import {
  updateText,
  type AutomergeUrl,
  type Repo,
  type DocHandle,
} from "@automerge/automerge-repo";
import type { AutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type {
  OpenDocumentEventDetail,
  PatchworkViewElement,
} from "@inkandswitch/patchwork-elements";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { handleFilesDrop } from "./file-drop.ts";
import { createEffect, createSignal, onMount, Show } from "solid-js";
import CreateNew from "../create-new.tsx";
import { filter, filterMatches, setRenaming } from "../state.ts";
import { DocumentList } from "./document-list.tsx";
import Item from "./item.tsx";
import { ItemName } from "./name.tsx";
import { Chevron } from "../icons.tsx";
import {
  dropTarget,
  throttledSetDropTarget,
  clearDropTarget,
  copyMode,
} from "../dnd/dnd.ts";
import { executeDrop } from "../dnd/operations.ts";
import { log } from "../dnd/debug.ts";

export default function Folder(props: {
  url: AutomergeUrl;
  repo: Repo;
  depth?: number;
  removeFromParent(): void;
  open(detail: OpenDocumentEventDetail): void;
  name?: string;
  hive?: AutomergeRepoKeyhive;
  selectedDocUrls: AutomergeUrl[];
  visitedFolders?: Set<AutomergeUrl>;
  element: PatchworkViewElement;
  rootFolderHandle: DocHandle<FolderDoc>;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [expanded, setExpanded] = createSignal(false);

  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  // Create a new Set with the current folder URL to prevent circular references
  const nextVisitedFolders = new Set(props.visitedFolders ?? []);
  nextVisitedFolders.add(props.url);

  const depth = () => props.depth ?? 1;
  const depthStyle = () => ({ "--depth": depth() + 1 });
  const folderDepthStyle = () => ({ "--depth": depth() });

  createEffect((last) => {
    if (!last && filter() && filterMatches(folder()!?.title ?? props.name)) {
      setExpanded(true);
    }
    return filter();
  });

  // lol @ this huge hack
  onMount(() => {
    setTimeout(() => {
      const has = !!ref()?.querySelector(
        ".document-list-item[aria-selected='true']"
      );
      setExpanded((open) => open || has);
    }, 500);
  });

  function rename(name: string) {
    handle()?.change((doc) => updateText(doc, ["title"], name));
  }

  async function handleDropIntoFolder(
    event: DragEvent,
    folderUrl: AutomergeUrl
  ) {
    log("Folder drop handler called for:", folderUrl);

    // Handle file drops from OS - add to beginning of folder
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      await handleFilesDrop(
        event.dataTransfer.files,
        handle()!,
        props.repo,
        "inside",
        0
      );
      return;
    }

    const dndData = event.dataTransfer?.getData("text/x-patchwork-dnd");
    if (!dndData) {
      log("No dnd data in drop event");
      return;
    }

    const { source, items } = JSON.parse(dndData);
    log("Drop data:", { source, items, folderUrl });

    executeDrop(
      {
        draggedIds: items.map((i: any) => i.id),
        draggedUrls: items.map((i: any) => i.url),
        targetId: folderUrl,
        position: "inside",
        sourceToolId: source,
        copyMode: copyMode(),
      },
      props.repo,
      props.rootFolderHandle,
      props.element.toolId!
    );
  }

  const folderDropState = () => {
    const target = dropTarget();
    if (!target || target.id !== props.url) return undefined;
    return target.position === "inside" ? "inside" : undefined;
  };

  return (
    <div
      class="document-list-folder"
      role="group"
      data-depth={depth()}
      style={folderDepthStyle()}
      aria-expanded={expanded()}
      data-dnd-container={props.url}
      data-drop-state={folderDropState()}
      ondragover={(event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();

        // Update drop effect based on copy mode
        const effect = copyMode() ? "copy" : "move";
        event.dataTransfer!.dropEffect = effect;

        // Only set "inside" if we're not directly over an item element
        // (If we're over an item, it will set its own above/below/inside position)
        const target = event.target as Element;
        const isOverItem = target.closest(".document-list-item");

        if (!isOverItem) {
          // Dropping into folder empty space
          throttledSetDropTarget({ id: props.url, position: "inside" });
        }
      }}
      ondragleave={(event: DragEvent) => {
        const related = event.relatedTarget as Element;
        if (!related || !(event.currentTarget as Element).contains(related)) {
          clearDropTarget();
        }
      }}
      ondrop={(event: DragEvent) => {
        log("Folder ondrop event fired", props.url);
        event.preventDefault();
        event.stopPropagation();

        // Check the drop position - only handle "inside" drops
        // (The item handles its own "above" and "below" drops)
        const target = dropTarget();

        if (target?.position === "inside") {
          handleDropIntoFolder(event, props.url);
        }
        clearDropTarget();
      }}
    >
      <Item
        aria-label={folder()?.title ?? props.name ?? ""}
        startRenaming={() => {
          setRenaming(props.url);
        }}
        remove={props.removeFromParent}
        id={props.url}
        url={props.url}
        name={folder()?.title ?? props.name ?? ""}
        pressed={props.selectedDocUrls.includes(props.url)}
        type="folder"
        element={props.element}
        repo={props.repo}
        rootFolderHandle={props.rootFolderHandle}
        isExpanded={expanded()}
        onToggleExpand={() => setExpanded((yn) => !yn)}
        openWith={(toolId) => {
          props.open({
            url: props.url,
            toolId,
            title: folder()?.title ?? props.name,
            type: "folder",
          });
        }}
      >
        <button
          aria-label={
            (expanded() ? "collapse" : "expand") +
            " " +
            (folder()?.title ?? props.name)
          }
          class="document-list-folder__toggle"
          onClick={(event) => {
            event.stopImmediatePropagation();
            setExpanded((yn) => !yn);
          }}
        >
          <Show when={expanded()} fallback={<Chevron />}>
            <Chevron style={{ rotate: "90deg" }} />
          </Show>
        </button>
        <ItemName
          name={folder()?.title ?? props.name}
          id={props.url}
          rename={rename}
        />
        <CreateNew
          context={folder()?.title ?? props.name ?? ""}
          repo={props.repo}
          hive={props.hive}
          changeFolder={(fn) => handle()?.change(fn)}
          open={props.open}
        />
      </Item>

      <div
        ref={(el) => setRef(el)}
        class="document-list-folder__contents"
        classList={{ "document-list-folder__contents--hidden": !expanded() && !filter() }}
        data-depth={depth()}
        style={depthStyle()}
      >
        <DocumentList
          docs={folder()?.docs}
          repo={props.repo}
          depth={depth() + 1}
          handle={handle.latest!}
          open={props.open}
          hive={props.hive}
          selectedDocUrls={props.selectedDocUrls}
          visitedFolders={nextVisitedFolders}
          element={props.element}
          rootFolderHandle={props.rootFolderHandle}
        />
      </div>
    </div>
  );
}
