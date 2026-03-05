import { useDocHandle } from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import {
  createSignal,
  createMemo,
  createEffect,
  onMount,
  onCleanup,
  Show,
  For,
} from "solid-js";
import type { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";
import { registerPatchworkSpaceElement } from "./elements/patchwork-space";
import { registerPatchworkPreviewElement } from "./elements/patchwork-preview";
import { loadLayout, saveLayout, computeGrid, getTargetCellSize } from "./layout/storage";
import { createDefaultLayout, type AccountConfig } from "./layout/defaults";
import type { SpaceLayout, SpaceItem, SpaceContent } from "./layout/types";
import { EditModeOverlay } from "./edit-mode/EditModeOverlay";
import { PipeRunner } from "./pipes/PipeRunner";
import "./styles.css";

type ConfigDoc = AccountConfig & {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
  frameToolId: string;
  contextToolIds: string[];
};

export const SpaceFrame = (props: {
  handle: DocHandle<ConfigDoc>;
  element: HTMLElement;
  repo: Repo;
}) => {
  registerPatchworkSpaceElement();
  registerPatchworkPreviewElement();

  const accountDocHandle = useDocHandle<ConfigDoc>(() => props.handle.url, {
    repo: props.repo,
  });
  const accountDoc = createMemo(() => accountDocHandle()?.doc());
  const accountDocUrl = props.handle.url;

  const [gridDims, setGridDims] = createSignal({ cols: 24, rows: 14 });
  const [layout, setLayout] = createSignal<SpaceLayout>({ items: [], pipes: [] });
  const [editing, setEditing] = createSignal(false);
  const [selectedDoc, setSelectedDoc] = createSignal<{
    url: AutomergeUrl;
    toolId?: string;
  } | null>(null);

  const selectedDocUrl = createMemo(() => selectedDoc()?.url);
  const selectedToolId = createMemo(() => selectedDoc()?.toolId);
  const viewKey = createMemo(() => {
    const doc = selectedDoc();
    return doc ? `${doc.url}-${doc.toolId ?? "default"}` : undefined;
  });

  let rootRef: HTMLElement | undefined;

  onMount(() => {
    setGridDims(computeGrid(window.innerWidth, window.innerHeight, getTargetCellSize()));
    window.addEventListener("resize", onWindowResize);
    onCleanup(() => window.removeEventListener("resize", onWindowResize));
  });

  function onWindowResize() {
    setGridDims(computeGrid(window.innerWidth, window.innerHeight, getTargetCellSize()));
  }

  createEffect(() => {
    if (!rootRef) return;
    const isEdit = editing();
    if (isEdit) {
      rootRef.setAttribute("data-editing", "");
    } else {
      rootRef.removeAttribute("data-editing");
    }
    rootRef.querySelectorAll("patchwork-space[data-space-id]").forEach((el) => {
      if (isEdit) {
        (el as HTMLElement).setAttribute("data-editing", "");
      } else {
        (el as HTMLElement).removeAttribute("data-editing");
      }
    });
  });

  createEffect(() => {
    const doc = accountDoc();
    if (!doc) return;
    const existing = loadLayout(accountDocUrl);
    if (existing) {
      setLayout(existing);
      return;
    }
    const dims = gridDims();
    const def = createDefaultLayout(accountDocUrl, doc, dims.cols, dims.rows);
    setLayout(def);
    saveLayout(accountDocUrl, def);
  });

  function updateLayout(updater: (prev: SpaceLayout) => SpaceLayout) {
    setLayout((prev) => {
      const next = updater(prev);
      saveLayout(accountDocUrl, next);
      return next;
    });
  }

  function resetLayout() {
    const doc = accountDoc();
    if (!doc) return;
    localStorage.removeItem(`patchwork-space-layout:${accountDocUrl}`);
    const dims = gridDims();
    const def = createDefaultLayout(accountDocUrl, doc, dims.cols, dims.rows);
    setLayout(def);
    saveLayout(accountDocUrl, def);
  }

  function handleRemoveSpace(itemId: string) {
    updateLayout((prev) => ({
      ...prev,
      items: removeItemById(prev.items, itemId),
      pipes: prev.pipes.filter((p) => p.from !== itemId && p.to !== itemId),
    }));
  }

  function removeItemById(items: SpaceItem[], id: string): SpaceItem[] {
    return items
      .filter((item) => item.id !== id)
      .map((item) => {
        if (item.content.type === "group") {
          return {
            ...item,
            content: {
              ...item.content,
              children: removeItemById(item.content.children, id),
              pipes: item.content.pipes.filter((p) => p.from !== id && p.to !== id),
            },
          };
        }
        return item;
      });
  }

  onMount(() => {
    const onOpenDocument = (event: Event) => {
      const e = event as OpenDocumentEvent;
      e.stopPropagation();
      setSelectedDoc({ url: e.detail.url, toolId: e.detail.toolId });
    };
    props.element.addEventListener("patchwork:open-document", onOpenDocument);
    onCleanup(() => props.element.removeEventListener("patchwork:open-document", onOpenDocument));
  });

  onMount(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setEditing((v) => !v);
      }
      if (e.key === "Escape" && editing()) {
        setEditing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });

  function resolveDocUrl(content: SpaceContent): AutomergeUrl | undefined {
    if (content.type !== "view") return undefined;
    if (content.docUrl) return content.docUrl as AutomergeUrl;
    if (!content.toolId) return selectedDocUrl();
    return accountDocUrl;
  }

  function resolveToolId(content: SpaceContent): string | undefined {
    if (content.type !== "view") return undefined;
    if (content.toolId) return content.toolId;
    return selectedToolId();
  }

  function getCellDimensions() {
    const root = rootRef;
    if (!root) return null;
    const rootRect = root.getBoundingClientRect();
    const dims = gridDims();
    return {
      cellW: rootRect.width / dims.cols,
      cellH: rootRect.height / dims.rows,
      dims,
    };
  }

  // ---- Drag to move ----
  // Uses pointer capture + transform only. Grid position committed on release.
  function handleDragStart(itemId: string, e: PointerEvent) {
    const root = rootRef;
    if (!root) return;
    const handleEl = e.currentTarget as HTMLElement;
    const spaceEl = root.querySelector(`[data-space-id="${itemId}"]`) as HTMLElement;
    if (!spaceEl) return;

    const cell = getCellDimensions();
    if (!cell) return;
    const item = findItemById(layout().items, itemId);
    if (!item) return;

    handleEl.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;

    spaceEl.style.zIndex = "100";
    spaceEl.style.opacity = "0.9";
    spaceEl.classList.add("space-dragging");

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      spaceEl.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const cleanup = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const dCols = Math.round(dx / cell.cellW);
      const dRows = Math.round(dy / cell.cellH);

      const newCol = Math.max(0, Math.min(cell.dims.cols - item.cols, item.col + dCols));
      const newRow = Math.max(0, Math.min(cell.dims.rows - item.rows, item.row + dRows));

      spaceEl.style.zIndex = "";
      spaceEl.style.opacity = "";
      spaceEl.style.transform = "";
      spaceEl.classList.remove("space-dragging");

      updateLayout((prev) => ({
        ...prev,
        items: updateItemPosition(prev.items, itemId, newCol, newRow),
      }));

      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", cleanup);
      handleEl.removeEventListener("lostpointercapture", cleanup);
    };

    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", cleanup);
    handleEl.addEventListener("lostpointercapture", cleanup);
  }

  // ---- Resize ----
  // Uses pointer capture + live attribute updates.
  function handleResizeStart(
    itemId: string,
    edge: "right" | "bottom" | "corner",
    e: PointerEvent
  ) {
    const root = rootRef;
    if (!root) return;
    const handleEl = e.currentTarget as HTMLElement;
    const spaceEl = root.querySelector(`[data-space-id="${itemId}"]`) as HTMLElement;
    if (!spaceEl) return;

    const cell = getCellDimensions();
    if (!cell) return;
    const item = findItemById(layout().items, itemId);
    if (!item) return;

    handleEl.setPointerCapture(e.pointerId);

    const startX = e.clientX;
    const startY = e.clientY;
    let lastCols = item.cols;
    let lastRows = item.rows;

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      if (edge === "right" || edge === "corner") {
        const newCols = Math.max(1, Math.min(cell.dims.cols - item.col, item.cols + Math.round(dx / cell.cellW)));
        if (newCols !== lastCols) {
          lastCols = newCols;
          spaceEl.setAttribute("cols", String(newCols));
        }
      }
      if (edge === "bottom" || edge === "corner") {
        const newRows = Math.max(1, Math.min(cell.dims.rows - item.row, item.rows + Math.round(dy / cell.cellH)));
        if (newRows !== lastRows) {
          lastRows = newRows;
          spaceEl.setAttribute("rows", String(newRows));
        }
      }
    };

    const cleanup = () => {
      updateLayout((prev) => ({
        ...prev,
        items: updateItemSize(prev.items, itemId, lastCols, lastRows),
      }));

      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", cleanup);
      handleEl.removeEventListener("lostpointercapture", cleanup);
    };

    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", cleanup);
    handleEl.addEventListener("lostpointercapture", cleanup);
  }

  function findItemById(items: SpaceItem[], id: string): SpaceItem | undefined {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.content.type === "group") {
        const found = findItemById(item.content.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  function updateItemPosition(items: SpaceItem[], id: string, col: number, row: number): SpaceItem[] {
    return items.map((item) => {
      if (item.id === id) return { ...item, col, row };
      if (item.content.type === "group") {
        return { ...item, content: { ...item.content, children: updateItemPosition(item.content.children, id, col, row) } };
      }
      return item;
    });
  }

  function updateItemSize(items: SpaceItem[], id: string, cols: number, rows: number): SpaceItem[] {
    return items.map((item) => {
      if (item.id === id) return { ...item, cols, rows };
      if (item.content.type === "group") {
        return { ...item, content: { ...item.content, children: updateItemSize(item.content.children, id, cols, rows) } };
      }
      return item;
    });
  }

  function renderEditControls(item: SpaceItem) {
    return (
      <Show when={editing()}>
        <div class="space-edit-controls">
          <button
            class="space-remove-btn"
            onClick={(e) => { e.stopPropagation(); handleRemoveSpace(item.id); }}
            title="Remove"
          >
            ×
          </button>

          <div
            class="space-drag-handle"
            on:pointerdown={(e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); handleDragStart(item.id, e); }}
          >
            <svg width="16" height="6" viewBox="0 0 16 6" fill="currentColor">
              <circle cx="3" cy="1" r="1"/><circle cx="8" cy="1" r="1"/><circle cx="13" cy="1" r="1"/>
              <circle cx="3" cy="5" r="1"/><circle cx="8" cy="5" r="1"/><circle cx="13" cy="5" r="1"/>
            </svg>
          </div>

          <div
            class="space-resize-handle space-resize-right"
            on:pointerdown={(e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); handleResizeStart(item.id, "right", e); }}
          />
          <div
            class="space-resize-handle space-resize-bottom"
            on:pointerdown={(e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); handleResizeStart(item.id, "bottom", e); }}
          />
          <div
            class="space-resize-handle space-resize-corner"
            on:pointerdown={(e: PointerEvent) => { e.preventDefault(); e.stopPropagation(); handleResizeStart(item.id, "corner", e); }}
          />
        </div>
      </Show>
    );
  }

  function renderSpaceItem(item: SpaceItem): any {
    if (item.content.type === "group") {
      return (
        <patchwork-space
          id={`space-${item.id}`} data-space-id={item.id}
          col={item.col} row={item.row} cols={item.cols} rows={item.rows}
          {...(item.collapsible ? { collapsible: "" } : {})}
          {...(item.collapsed ? { collapsed: "" } : {})}
        >
          <For each={item.content.children}>{(child) => renderSpaceItem(child)}</For>
        </patchwork-space>
      );
    }

    if (item.content.type === "preview") {
      return (
        <patchwork-space
          id={`space-${item.id}`} data-space-id={item.id}
          col={item.col} row={item.row} cols={item.cols} rows={item.rows}
        >
          <patchwork-preview data-space-id={item.id} style="width:100%;height:100%;" />
          {renderEditControls(item)}
        </patchwork-space>
      );
    }

    const isMainView = !item.content.toolId && !item.content.docUrl;

    if (isMainView) {
      return (
        <patchwork-space
          id={`space-${item.id}`} data-space-id={item.id}
          col={item.col} row={item.row} cols={item.cols} rows={item.rows}
        >
          <Show when={viewKey()} keyed fallback={<div class="space-empty-state">Select a document in the sidebar</div>}>
            {() => <patchwork-view doc-url={selectedDocUrl()!} tool-id={selectedToolId()} />}
          </Show>
          {renderEditControls(item)}
        </patchwork-space>
      );
    }

    if (item.content.toolId === "document-toolbar-group") {
      const toolIds = createMemo(() => accountDoc()?.documentToolbarToolIds ?? []);
      return (
        <patchwork-space
          id={`space-${item.id}`} data-space-id={item.id}
          col={item.col} row={item.row} cols={item.cols} rows={item.rows}
        >
          <Show when={selectedDocUrl()}>
            <div class="space-toolbar">
              <For each={toolIds()}>{(tid) => <patchwork-view class="space-toolbar-item" doc-url={selectedDocUrl()!} tool-id={tid} />}</For>
            </div>
          </Show>
          {renderEditControls(item)}
        </patchwork-space>
      );
    }

    const docUrl = resolveDocUrl(item.content);
    const toolId = resolveToolId(item.content);

    return (
      <patchwork-space
        id={`space-${item.id}`} data-space-id={item.id}
        col={item.col} row={item.row} cols={item.cols} rows={item.rows}
        {...(item.collapsible ? { collapsible: "" } : {})}
        {...(item.collapsed ? { collapsed: "" } : {})}
      >
        <Show when={docUrl}>
          <patchwork-view doc-url={docUrl!} tool-id={toolId} />
        </Show>
        {renderEditControls(item)}
      </patchwork-space>
    );
  }

  return (
    <>
      <patchwork-space id="space-root" ref={(el: HTMLElement) => { rootRef = el; }}>
        <For each={layout().items}>{(item) => renderSpaceItem(item)}</For>
      </patchwork-space>

      <Show when={editing()}>
        <EditModeOverlay
          layout={layout()} gridDims={gridDims()}
          onUpdateLayout={updateLayout} onDone={() => setEditing(false)} onReset={resetLayout}
        />
      </Show>

      <PipeRunner layout={layout()} rootElement={props.element} repo={props.repo} />
    </>
  );
};
