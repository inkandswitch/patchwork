import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";

type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
  contactUrl: AutomergeUrl;
};

import type { PatchworkToolProps } from "../types.ts";
import { filter, setFilter } from "./state.ts";
import CreateNew from "./create-new.tsx";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { createOpenEvent } from "./events.ts";
import { SearchIcon } from "./icons.tsx";
import { DocumentList } from "./document-list/document-list.tsx";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { OpenDocumentEventDetail } from "@inkandswitch/patchwork-elements";
import { useSubscribe } from "@inkandswitch/subscribables-solid";
import { $selectedDocUrls } from "@inkandswitch/annotations-selection";
import { createEffect, createSignal, Show } from "solid-js";
import { handleFilesDrop } from "./document-list/file-drop.ts";

export function Sideboard(
  props: PatchworkToolProps<TinyPatchworkAccountDoc | FolderDoc>
) {
  const doc = makeDocumentProjection(props.handle);
  const [folder, folderHandle] = useDocument<FolderDoc>(
    () => ("rootFolderUrl" in doc ? doc.rootFolderUrl : props.handle.url),
    props
  );

  const moduleSettingsUrl = () =>
    "moduleSettingsUrl" in doc ? doc.moduleSettingsUrl : undefined;
  const accountDocUrl = () => props.handle.url;
  const contactUrl = () => ("contactUrl" in doc ? doc.contactUrl : undefined);
  const selectedDocUrls = useSubscribe($selectedDocUrls);

  // Manage aria-selected + scrollIntoView via DOM to avoid O(n) per item.
  createEffect((prev: AutomergeUrl[]) => {
    const urls = (selectedDocUrls() as AutomergeUrl[]) ?? [];
    const newSet = new Set(urls);
    const prevSet = new Set(prev);

    for (const url of prev) {
      if (!newSet.has(url)) {
        const el = props.element.querySelector(
          `[data-doc-url="${CSS.escape(url)}"]`
        );
        if (el) el.removeAttribute("aria-selected");
      }
    }
    for (const url of urls) {
      const el = props.element.querySelector(
        `[data-doc-url="${CSS.escape(url)}"]`
      );
      if (el) {
        el.setAttribute("aria-selected", "true");
        if (!prevSet.has(url)) {
          // @ts-expect-error scrollIntoViewIfNeeded is non-standard
          el.scrollIntoViewIfNeeded?.();
        }
      }
    }
    return urls;
  }, [] as AutomergeUrl[]);

  function open(detail: OpenDocumentEventDetail) {
    props.element.dispatchEvent(createOpenEvent(detail));
  }

  const [isDraggingFile, setIsDraggingFile] = createSignal(false);

  const isAccount = () => "rootFolderUrl" in doc;

  function closeSidebar() {
    let root: Document | ShadowRoot = props.element.getRootNode() as
      | Document
      | ShadowRoot;
    if (root instanceof ShadowRoot) {
      root = root.host.getRootNode() as Document | ShadowRoot;
    }
    const toggles = root.querySelectorAll(".sidebar-toggle");
    (toggles[0] as HTMLElement)?.click();
  }

  return (
    <aside class="sideboard">
      <Show when={isAccount()}>
        <button
          class="sideboard-close-button"
          onClick={closeSidebar}
          title="Close account sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
      </Show>
      <header class="sideboard-header">
        <CreateNew
          changeFolder={(fn) => folderHandle()?.change(fn)}
          repo={props.repo}
          hive={props.element.hive}
          open={open}
        />
      </header>
      <div class="sideboard__filter-container sideboard-widget">
        <SearchIcon />
        <input
          name="filter"
          class="sideboard__filter"
          placeholder="Filter by title"
          value={filter()}
          onInput={(event) => setFilter(event.target.value.toLowerCase())}
        />
      </div>
      <nav
        class="sideboard__doclist sideboard-widget"
        classList={{
          "sideboard__doclist--drag-over": isDraggingFile(),
        }}
        role="tree"
        aria-multiselectable="true"
        onDragOver={(event: DragEvent) => {
          // Only handle file drops from OS
          if (event.dataTransfer?.types.includes("Files")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsDraggingFile(true);
          }
        }}
        onDragLeave={(event: DragEvent) => {
          const related = event.relatedTarget as Element;
          if (!related || !(event.currentTarget as Element).contains(related)) {
            setIsDraggingFile(false);
          }
        }}
        onDrop={(event: DragEvent) => {
          event.preventDefault();
          setIsDraggingFile(false);

          const files = event.dataTransfer?.files;
          if (files && files.length > 0 && folderHandle()) {
            const folderDoc = folderHandle()!.doc();
            const insertIndex = folderDoc?.docs?.length || 0;
            handleFilesDrop(
              files,
              folderHandle()!,
              props.repo,
              "inside",
              insertIndex
            );
          }
        }}
      >
        <DocumentList
          depth={0}
          repo={props.repo}
          docs={folder()?.docs}
          handle={folderHandle.latest!}
          open={open}
          hive={props.element.hive}
          element={props.element}
          rootFolderHandle={folderHandle.latest!}
        />
      </nav>
      <Show when={moduleSettingsUrl() && contactUrl()}>
        <footer class="sideboard-footer">
          <button
            onClick={() =>
              open({
                url: accountDocUrl(),
                toolId: "account-picker",
              })
            }
            class="sideboard-footer__button"
          >
            <patchwork-view doc-url={contactUrl()!} tool-id="contact-avatar" />
          </button>

          <button
            onClick={() => open({ url: moduleSettingsUrl()! })}
            class="sideboard-footer__button"
          >
            Packages
          </button>

          <button
            onClick={() =>
              open({
                url: accountDocUrl(),
                toolId: "frame-configurator",
              })
            }
            class="sideboard-footer__button"
          >
            Settings
          </button>
        </footer>
      </Show>
    </aside>
  );
}
