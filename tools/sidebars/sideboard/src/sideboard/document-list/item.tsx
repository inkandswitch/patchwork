import { ContextMenu } from "@kobalte/core/context-menu";
import {
  createEffect,
  createSignal,
  For,
  Show,
  untrack,
  type JSX,
} from "solid-js";
import { useSupportedToolsForType } from "@patchwork/solid";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";
import {
  type SideboardDragAndDropItem,
  dragstack,
  addToDragstack,
  removeFromDragstack,
  clearDragstack,
  setDragging,
  setDragSourceItems,
  clearDragSourceItems,
  getDropTarget,
  setDropTarget,
  isAbove,
  clearDropTarget,
  copyMode,
  setCopyMode,
} from "../dnd/dnd.ts";
import {
  parseAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { executeDrop } from "../dnd/operations.ts";
import { handleFilesDrop } from "./file-drop.ts";
import { log } from "../dnd/debug.ts";

export default function Item(props: {
  "aria-label": string;
  id: string;
  url: AutomergeUrl;
  name: string;
  type: string;
  pressed: boolean;
  children: JSX.Element;
  openWith(toolId?: string): void;
  startRenaming(): void;
  remove(): void;
  share?(): void;
  shareDisabled?: boolean;
  makeSecureCopy?(): void;
  element: PatchworkViewElement;
  repo: Repo;
  rootFolderHandle: DocHandle<FolderDoc>;
  parentFolderHandle: DocHandle<FolderDoc>;
  itemIndex: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const tools = useSupportedToolsForType(props.type);
  const [trigger, setTrigger] = createSignal<HTMLButtonElement>();

  createEffect((prev) => {
    if (props.pressed && !prev) {
      const el = untrack(trigger);
      if (el) {
        // @ts-expect-error scrollIntoViewIfNeeded is non-standard
        el?.scrollIntoViewIfNeeded?.();
      }
    }
    return props.pressed;
  });

  const dnd = (): SideboardDragAndDropItem => ({
    id: props.id,
    type: props.type,
    url: props.url,
    name: props.name,
    source: props.element.toolId!,
  });

  async function handleDrop(
    event: DragEvent,
    targetId: string,
    position: "above" | "below"
  ) {
    log("Item drop handler called for:", targetId, position);

    // Handle file drops from OS - add to parent folder at correct position
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      await handleFilesDrop(
        event.dataTransfer.files,
        props.parentFolderHandle,
        props.repo,
        position,
        props.itemIndex
      );
      return;
    }

    const dndData = event.dataTransfer?.getData("text/x-patchwork-dnd");
    if (!dndData) {
      log("No dnd data in drop event");
      return;
    }

    const { source, items } = JSON.parse(dndData);
    log("Drop data:", { source, items, targetId, position });

    executeDrop(
      {
        draggedIds: items.map((i: any) => i.id),
        draggedUrls: items.map((i: any) => i.url),
        targetId,
        position,
        sourceToolId: source,
        copyMode: copyMode(),
      },
      props.repo,
      props.rootFolderHandle,
      props.element.toolId!
    );
  }

  return (
    <ContextMenu>
      <ContextMenu.Trigger
        ref={setTrigger}
        ondragstart={(event: DragEvent) => {
          if (!dragstack.has(props.id)) {
            clearDragstack();
            addToDragstack(props.id, dnd());
          }

          const items = dragstack.values();

          const urls = [];
          const ids = [];

          // Check for Alt key for copy mode
          setCopyMode(event.altKey);
          // Set effectAllowed to copyMove to prevent Chrome split view (no "link")
          event.dataTransfer!.effectAllowed = "copyMove";

          for (const item of items) {
            urls.push(item.url);
            ids.push(item.id);
          }

          const urlList =
            urls
              .map(
                (url) =>
                  location.protocol +
                  "//" +
                  location.host +
                  `/#doc=${parseAutomergeUrl(url).documentId}`
              )
              .join("\r\n") + "\r\n";

          // Don't add text/uri-list to prevent Chrome split view on drag
          // Keep custom types for our internal DnD system
          event.dataTransfer?.items.add(
            JSON.stringify(ids),
            "text/x-sideboard-ids"
          );
          event.dataTransfer?.items.add(
            JSON.stringify(urls),
            "text/x-patchwork-urls"
          );

          // Add structured data with source tracking
          event.dataTransfer?.items.add(
            JSON.stringify({
              source: props.element.toolId,
              items: [...dragstack.values()],
            }),
            "text/x-patchwork-dnd"
          );

          // Create drag preview
          const preview = document.createElement("div");
          preview.style.cssText = `
            position: absolute;
            top: -1000px;
            background: var(--sideboard-primary);
            padding: 0.5rem 0.75rem;
            border-radius: var(--sideboard-radius);
            font-family: inherit;
            font-size: 0.9rem;
            pointer-events: none;
            color: var(--sideboard-line);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          `;
          const count = dragstack.size;
          const modeText = event.altKey ? " (copy)" : "";
          preview.textContent =
            count === 1 ? props.name + modeText : `${count} items${modeText}`;
          document.body.appendChild(preview);
          event.dataTransfer!.setDragImage(preview, 10, 10);

          // Clean up after drag
          setTimeout(() => preview.remove(), 0);

          setDragSourceItems([...dragstack.keys()]);
          setDragging(true);
        }}
        ondrag={(event: DragEvent) => {
          // Update copy mode if Alt key state changes during drag
          if (event.altKey !== copyMode()) {
            setCopyMode(event.altKey);
          }
        }}
        ondragend={(event: DragEvent) => {
          clearDragSourceItems();
          clearDragstack();
          setCopyMode(false);
          setDragging(false);
        }}
        ondragover={(event: DragEvent) => {
          event.preventDefault();

          // Update drop effect based on copy mode
          event.dataTransfer!.dropEffect = copyMode() ? "copy" : "move";

          // Determine drop position
          let position: "above" | "below" | "inside";

          if (props.type === "folder") {
            // For folders, use three zones: top 25% = above, bottom 25% = below, middle = inside
            const rect = (
              event.currentTarget as Element
            ).getBoundingClientRect();
            const offset = event.clientY - rect.top;
            const relativePosition = offset / rect.height;

            if (relativePosition < 0.25) {
              position = "above";
            } else if (relativePosition > 0.75) {
              position = "below";
            } else {
              position = "inside";
            }

            // Only bubble to container for "inside" drops
            if (position !== "inside") {
              event.stopPropagation();
            }
          } else {
            // For non-folders, just above or below
            position = isAbove(event.clientY, event.currentTarget as Element)
              ? "above"
              : "below";
            event.stopPropagation();
          }

          setDropTarget({ id: props.id, position });
        }}
        ondragleave={(event: DragEvent) => {
          // Only clear if we're actually leaving (not entering a child)
          const related = event.relatedTarget as Element;
          if (!related || !(event.currentTarget as Element).contains(related)) {
            clearDropTarget();
          }
        }}
        ondrop={(event: DragEvent) => {
          const target = getDropTarget();
          console.log(
            "[DnD] Item ondrop event fired",
            props.id,
            "type:",
            props.type,
            "target:",
            target
          );

          // For folders with "inside" position, let the container handle it
          if (props.type === "folder" && target?.position === "inside") {
            console.log(
              "[DnD] Folder inside position, letting container handle"
            );
            return;
          }

          log("Item handling drop itself");
          event.preventDefault();
          event.stopPropagation();

          if (!target) {
            log("No drop target set");
            return;
          }

          handleDrop(event, target.id, target.position as "above" | "below");
          clearDropTarget();
        }}
        draggable
        data-dnd-item={props.id}
        data-doc-url={props.url}
        aria-label={props["aria-label"]}
        aria-haspopup="menu"
        as="button"
        class="popmenu__trigger document-list-item"
        role="treeitem"
        aria-selected={props.pressed ? "true" : undefined}
        onMouseDown={(event: MouseEvent) => {
          if (event.ctrlKey || event.metaKey) {
            if (dragstack.has(props.id)) {
              removeFromDragstack(props.id);
            } else {
              addToDragstack(props.id, dnd());
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          } else if (!dragstack.has(props.id)) {
            clearDragstack();
          }
        }}
        on:click={(event: MouseEvent) => {
          if (event.ctrlKey || event.metaKey) {
            return;
          }
          const target = event.target as Element;
          if (target.closest(".document-list-folder__toggle, .create-new-button")) {
            return;
          }
          clearDragstack();
          props.openWith();
        }}
        onkeydown={(event: KeyboardEvent) => {
          // Arrow key navigation
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const current = event.currentTarget as HTMLElement;
            const allItems = Array.from(
              document.querySelectorAll("[data-dnd-item]")
            ).filter(
              (item) => (item as HTMLElement).offsetParent !== null
            ) as HTMLElement[];
            const currentIndex = allItems.indexOf(current);

            if (
              event.key === "ArrowDown" &&
              currentIndex < allItems.length - 1
            ) {
              allItems[currentIndex + 1]?.focus();
            } else if (event.key === "ArrowUp" && currentIndex > 0) {
              allItems[currentIndex - 1]?.focus();
            }
            return;
          }

          // Left/Right for folder expand/collapse
          if (props.type === "folder" && props.onToggleExpand) {
            if (event.key === "ArrowRight" && !props.isExpanded) {
              event.preventDefault();
              props.onToggleExpand();
              return;
            } else if (event.key === "ArrowLeft" && props.isExpanded) {
              event.preventDefault();
              props.onToggleExpand();
              return;
            }
          }

          // Context menu shortcut
          if (
            event.key == "Enter" &&
            event.ctrlKey &&
            !(+event.altKey | +event.shiftKey | +event.metaKey)
          ) {
            if (trigger()) {
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
              const el = event.target as HTMLButtonElement;
              const box = el.getBoundingClientRect();
              trigger()!.dispatchEvent(
                new MouseEvent("contextmenu", {
                  bubbles: true,
                  clientX: box.x + 10,
                  clientY: box.y + box.height - 10,
                })
              );
            }
          }
        }}
      >
        {props.children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content class="popmenu__content">
          <Show when={tools.length}>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger class="popmenu__sub-trigger">
                Open with...
              </ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.SubContent class="popmenu__sub-content">
                  <For each={tools}>
                    {(tool) => {
                      return (
                        <ContextMenu.Item
                          class="popmenu__item"
                          onSelect={() => props.openWith(tool.id)}
                        >
                          {tool.name}
                        </ContextMenu.Item>
                      );
                    }}
                  </For>
                </ContextMenu.SubContent>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </Show>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger class="popmenu__sub-trigger">
              Copy
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent class="popmenu__sub-content">
                <ContextMenu.Item
                  class="popmenu__item"
                  onSelect={() =>
                    navigator.clipboard.writeText(props.url)
                  }
                >
                  Automerge url
                </ContextMenu.Item>
                <Show when={tools.length}>
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger class="popmenu__sub-trigger">
                      Automerge url with...
                    </ContextMenu.SubTrigger>
                    <ContextMenu.Portal>
                      <ContextMenu.SubContent class="popmenu__sub-content">
                        <For each={tools}>
                          {(tool) => (
                            <ContextMenu.Item
                              class="popmenu__item"
                              onSelect={() =>
                                navigator.clipboard.writeText(
                                  `${props.url}&tool=${tool.id}`
                                )
                              }
                            >
                              {tool.name}
                            </ContextMenu.Item>
                          )}
                        </For>
                      </ContextMenu.SubContent>
                    </ContextMenu.Portal>
                  </ContextMenu.Sub>
                </Show>
                <ContextMenu.Item
                  class="popmenu__item"
                  onSelect={() =>
                    navigator.clipboard.writeText(
                      `${location.protocol}//${location.host}/#doc=${parseAutomergeUrl(props.url).documentId}`
                    )
                  }
                >
                  Patchwork url
                </ContextMenu.Item>
                <Show when={tools.length}>
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger class="popmenu__sub-trigger">
                      Patchwork url with...
                    </ContextMenu.SubTrigger>
                    <ContextMenu.Portal>
                      <ContextMenu.SubContent class="popmenu__sub-content">
                        <For each={tools}>
                          {(tool) => (
                            <ContextMenu.Item
                              class="popmenu__item"
                              onSelect={() =>
                                navigator.clipboard.writeText(
                                  `${location.protocol}//${location.host}/#doc=${parseAutomergeUrl(props.url).documentId}&tool=${tool.id}`
                                )
                              }
                            >
                              {tool.name}
                            </ContextMenu.Item>
                          )}
                        </For>
                      </ContextMenu.SubContent>
                    </ContextMenu.Portal>
                  </ContextMenu.Sub>
                </Show>
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>
          <ContextMenu.Item
            class="popmenu__item"
            onSelect={() => props.startRenaming()}
          >
            Rename
          </ContextMenu.Item>
          <ContextMenu.Item
            class="popmenu__item"
            onSelect={() => props.remove()}
          >
            Remove
          </ContextMenu.Item>
          <Show when={props.share}>
            <ContextMenu.Item
              class="popmenu__item"
              onSelect={() => props.share?.()}
              disabled={props.shareDisabled}
            >
              Share
            </ContextMenu.Item>
          </Show>
          <Show when={props.makeSecureCopy}>
            <ContextMenu.Item
              class="popmenu__item"
              onSelect={() => props.makeSecureCopy?.()}
            >
              Duplicate (unshared)
            </ContextMenu.Item>
          </Show>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu>
  );
}
