import {
  onMount,
  onCleanup,
  createMemo,
  createEffect,
  createSignal,
} from "solid-js";
import {
  Repo,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/automerge-repo-solid-primitives";
import { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";
import {
  getType,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getRegistry,
  type DatatypeDescription,
  type DatatypeImplementation,
} from "@inkandswitch/patchwork-plugins";
import {
  ACCOUNT_HISTORY_DATATYPE,
  DEDUPLICATION_TIME_THRESHOLD,
  VIEWER_TOOL_ID,
} from "./constants.ts";
import {
  type PatchworkToolProps,
  type AccountDoc,
  type HistoryDoc,
  type HistoryEntry,
} from "./types.ts";

declare global {
  interface Window {
    accountDocHandle?: DocHandle<AccountDoc>;
  }
}

async function getOrCreateAccountHistoryDoc(
  repo: Repo,
  accountHandle: DocHandle<AccountDoc>
): Promise<DocHandle<HistoryDoc>> {
  const accountDoc = accountHandle.doc();
  if (!accountDoc) {
    throw new Error("Account document not available");
  }

  // Check if history document already exists
  const existingUrl = accountDoc.accountHistoryUrl;

  if (existingUrl) {
    try {
      const handle = await repo.find<HistoryDoc>(existingUrl);
      await handle.whenReady();
      return handle;
    } catch (error) {
      console.error("Error loading existing history document:", error);
      // Fall through to create new one
    }
  }

  // Create new history document
  const historyHandle = await repo.create2<HistoryDoc>({
    ["@patchwork"]: { type: ACCOUNT_HISTORY_DATATYPE },
    title: "Account History",
    entries: [],
  });

  // Update account document with reference to history document
  accountHandle.change((doc) => {
    doc.accountHistoryUrl = historyHandle.url;
  });

  return historyHandle;
}

export function HistoryRecorder(props: PatchworkToolProps<any>) {
  const [isInitialized, setIsInitialized] = createSignal(false);

  // Get account doc handle from window
  const accountDocHandle = createMemo(() => {
    return window.accountDocHandle;
  });

  // Get history URL from account doc
  const historyUrl = createMemo<AutomergeUrl | undefined>(() => {
    const handle = accountDocHandle();
    if (!handle) return undefined;

    const doc = handle.doc();
    return doc?.accountHistoryUrl;
  });

  // Subscribe to history document handle reactively
  const historyHandle = useDocHandle<HistoryDoc>(historyUrl, {
    repo: props.repo,
  });

  // Initialize history document if needed
  createEffect(async () => {
    const accHandle = accountDocHandle();
    const existingHistoryUrl = historyUrl();

    if (accHandle && !existingHistoryUrl && !isInitialized()) {
      try {
        setIsInitialized(true);
        await getOrCreateAccountHistoryDoc(props.repo, accHandle);
      } catch (error) {
        console.error("Error initializing history document:", error);
        setIsInitialized(false);
      }
    }
  });

  onMount(() => {
    const onDocumentOpened = async (event: Event) => {
      const openEvent = event as OpenDocumentEvent;
      const { url: rawUrl, toolId: rawToolId } = openEvent.detail;
      const [docUrl, ...heads] = rawUrl.split("#");
      const url = docUrl as AutomergeUrl;
      let toolId = rawToolId;

      // Get document to extract title and type
      const docHandle = await props.repo.find(url);
      await docHandle.whenReady();
      const doc = docHandle.doc();

      if (!doc) {
        console.warn("HistoryRecorder: failed to load document");
        return;
      }

      const datatype = getType(doc as Partial<HasPatchworkMetadata>);

      if (!toolId) {
        // if the tool id isn't defined, use the current fallback tool
        if (!datatype) {
          console.warn(
            "HistoryRecorder: no tool found for document type; skipping history recording"
          );
          return;
        }
        const fallbackTool = getFallbackTool(doc as HasPatchworkMetadata);
        if (!fallbackTool) {
          console.warn(
            "HistoryRecorder: no tool found for document type; skipping history recording"
          );
          return;
        }
        toolId = fallbackTool.id;
      }

      if (toolId === VIEWER_TOOL_ID) {
        return; // Don't record when opening the history viewer itself
      }

      const currentHistoryHandle = historyHandle();
      if (!currentHistoryHandle) {
        console.warn("HistoryRecorder: history handle not ready yet");
        return;
      }
      const historyDoc = currentHistoryHandle.doc();
      if (!historyDoc) {
        console.warn("HistoryRecorder: history document not ready yet");
        return;
      }

      // Deduplication: check if this entry is a duplicate from rapid clicks
      const lastEntry = historyDoc.entries[historyDoc.entries.length - 1];
      if (
        lastEntry &&
        lastEntry.docUrl === url &&
        lastEntry.toolId === toolId &&
        Date.now() - lastEntry.timestamp < DEDUPLICATION_TIME_THRESHOLD
      ) {
        return; // Skip recording - duplicate from rapid clicking
      }

      // Extract title
      let docTitle = "Untitled";
      if (datatype) {
        const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
        const loaded = registry.get(datatype);
        if (loaded && "module" in loaded) {
          const impl = loaded.module as DatatypeImplementation;
          try {
            docTitle = impl.getTitle(doc) || "Untitled";
          } catch {
            // getTitle may fail if the document shape doesn't match the datatype
          }
        }
      }

      // Get current heads, unless the URL specified a head
      let entryHeads = heads;
      if (entryHeads.length === 0) entryHeads = docHandle.heads();

      // Create new entry
      const newEntry: HistoryEntry = {
        timestamp: Date.now(),
        docUrl: url,
        docTitle,
        docType: datatype || "unknown",
        toolId,
        heads: entryHeads,
      };

      // Add entry to history
      currentHistoryHandle.change((doc) => {
        doc.entries.push(newEntry);
      });
    };

    // Listen to patchwork:open-document events (should fire once per user action)
    document.addEventListener(
      "patchwork:open-document",
      onDocumentOpened as EventListener,
      { capture: true }
    );

    onCleanup(() => {
      document.removeEventListener(
        "patchwork:open-document",
        onDocumentOpened as EventListener,
        { capture: true }
      );
    });
  });

  const openHistory = () => {
    const currentHistoryUrl = historyUrl();
    if (!currentHistoryUrl) {
      console.warn("HistoryRecorder: no history URL yet");
      return;
    }

    // Dispatch open document event
    props.element.dispatchEvent(
      new OpenDocumentEvent({
        url: currentHistoryUrl,
        toolId: VIEWER_TOOL_ID,
      })
    );
  };

  return (
    <button
      onClick={openHistory}
      class="account-history-toolbar-button"
      title="Open account history"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </button>
  );
}
