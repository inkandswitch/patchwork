import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";
import { registerPatchworkSpace } from "./elements/patchwork-space";
import { registerPatchworkPreviewElement } from "./elements/patchwork-preview";
import { registerPatchworkPipe } from "./elements/patchwork-pipe";
import { loadLayout, saveLayout, clearLayout } from "./layout/storage";
import { createDefaultLayout, type AccountConfig } from "./layout/defaults";
import type {
  SpaceLayout,
  SpaceNode,
  SpaceChild,
  PipeNode,
} from "./layout/types";
import { isPipeNode } from "./layout/types";
import "./styles.css";

type ConfigDoc = AccountConfig & {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
  frameToolId: string;
  contextToolIds: string[];
};

export function mountSpaceFrame(
  handle: DocHandle<ConfigDoc>,
  element: HTMLElement,
  repo: Repo
): () => void {
  registerPatchworkSpace();
  registerPatchworkPreviewElement();
  registerPatchworkPipe();

  const accountDocUrl = handle.url;
  let layout: SpaceLayout | null = null;
  let rootEl: HTMLElement | null = null;
  let editing = false;
  let selectedDoc: { url: AutomergeUrl; toolId?: string } | null = null;
  let overlay: HTMLElement | null = null;

  // Wait for the account doc to be available, then build the tree
  function init() {
    const doc = handle.doc() as ConfigDoc | undefined;
    if (!doc) {
      handle.once("change", init);
      return;
    }

    const existing = loadLayout(accountDocUrl);
    if (existing) {
      layout = existing;
    } else {
      layout = createDefaultLayout(accountDocUrl, doc);
      saveLayout(accountDocUrl, layout);
    }

    buildTree();
    setupListeners(doc);
  }

  function buildTree() {
    if (!layout) return;
    element.innerHTML = "";
    rootEl = buildNode(layout.root);
    rootEl.id = "space-root";
    element.appendChild(rootEl);
    createOverlay();
  }

  function buildNode(node: SpaceNode): HTMLElement {
    const el = document.createElement("patchwork-space");
    el.id = `space-${node.id}`;
    el.dataset.spaceId = node.id;

    if (node.direction) {
      el.setAttribute("direction", node.direction);
    }

    if (node.fixedSize != null) {
      el.style.flex = `0 0 ${node.fixedSize}px`;
    } else if (node.size != null) {
      el.style.flex = `${node.size} 0 0px`;
    } else {
      el.style.flex = "1 0 0px";
    }

    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) {
          const pipeEl = buildPipeNode(child);
          el.appendChild(pipeEl);
        } else {
          el.appendChild(buildNode(child));
        }
      }
    } else if (node.content) {
      buildContent(el, node);
    }

    return el;
  }

  function buildPipeNode(pipe: PipeNode): HTMLElement {
    const el = document.createElement("patchwork-pipe");
    el.id = `pipe-${pipe.id}`;
    if (pipe.transform) {
      el.setAttribute("transform", pipe.transform);
    }
    if (pipe.expanded) {
      el.setAttribute("expanded", "");
    }
    return el;
  }

  function buildContent(container: HTMLElement, node: SpaceNode) {
    if (!node.content) return;

    if (node.content.type === "picker") {
      buildPicker(container, node);
      return;
    }

    if (node.content.type === "preview") {
      const preview = document.createElement("patchwork-preview");
      preview.style.width = "100%";
      preview.style.height = "100%";
      container.appendChild(preview);
      return;
    }

    if (node.content.type === "view") {
      const isMainView = !node.content.toolId && !node.content.docUrl;

      if (isMainView) {
        // Main view: shows selected document
        container.dataset.mainView = "true";
        if (selectedDoc) {
          appendView(container, selectedDoc.url, selectedDoc.toolId);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "space-empty-state";
          placeholder.textContent = "Select a document in the sidebar";
          container.appendChild(placeholder);
        }
        return;
      }

      if (node.content.toolId === "document-toolbar-group") {
        container.dataset.toolbar = "true";
        // Toolbar is populated when a doc is selected
        if (selectedDoc) {
          buildToolbar(container, selectedDoc.url);
        }
        return;
      }

      // Regular view with a specific tool/doc
      const docUrl = node.content.docUrl
        ? (node.content.docUrl as AutomergeUrl)
        : accountDocUrl;
      appendView(container, docUrl, node.content.toolId);
    }
  }

  function appendView(
    container: HTMLElement,
    docUrl: AutomergeUrl,
    toolId?: string
  ) {
    const view = document.createElement("patchwork-view");
    view.setAttribute("doc-url", docUrl);
    if (toolId) view.setAttribute("tool-id", toolId);
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    container.appendChild(view);
  }

  function buildPicker(container: HTMLElement, node: SpaceNode) {
    const nodeId = node.id;
    const picker = document.createElement("div");
    picker.className = "space-picker";

    const title = document.createElement("div");
    title.className = "space-picker-title";
    title.textContent = "Choose content";
    picker.appendChild(title);

    function updateNode(updater: (n: SpaceNode) => void) {
      const liveNode = layout ? findNodeById(layout.root, nodeId) : null;
      if (liveNode) updater(liveNode);
      updater(node);
    }

    const options: Array<{ label: string; icon: string; action: () => void }> =
      [
        {
          label: "Document view",
          icon: "📄",
          action: () => {
            updateNode((n) => {
              n.content = { type: "view" };
            });
            picker.remove();
            container.dataset.mainView = "true";
            if (selectedDoc) {
              appendView(container, selectedDoc.url, selectedDoc.toolId);
            } else {
              const ph = document.createElement("div");
              ph.className = "space-empty-state";
              ph.textContent = "Select a document";
              container.appendChild(ph);
            }
            persistLayout();
          },
        },
        {
          label: "Preview",
          icon: "👁",
          action: () => {
            updateNode((n) => {
              n.content = { type: "preview" };
            });
            picker.remove();
            const preview = document.createElement("patchwork-preview");
            preview.style.width = "100%";
            preview.style.height = "100%";
            container.appendChild(preview);
            persistLayout();
          },
        },
        {
          label: "Container",
          icon: "◫",
          action: () => {
            updateNode((n) => {
              n.content = undefined;
              n.direction = "horizontal";
              n.children = [];
            });
            picker.remove();
            container.setAttribute("direction", "horizontal");
            (container as any).refreshEditUI?.();
            persistLayout();
          },
        },
      ];

    for (const opt of options) {
      const btn = document.createElement("button");
      btn.className = "space-picker-option";
      btn.innerHTML = `<span class="space-picker-icon">${opt.icon}</span><span>${opt.label}</span>`;
      btn.addEventListener("click", opt.action);
      picker.appendChild(btn);
    }

    container.appendChild(picker);
  }

  function buildToolbar(container: HTMLElement, docUrl: AutomergeUrl) {
    const doc = handle.doc() as ConfigDoc | undefined;
    if (!doc) return;

    const bar = document.createElement("div");
    bar.className = "space-toolbar";

    for (const tid of doc.documentToolbarToolIds ?? []) {
      const view = document.createElement("patchwork-view");
      view.setAttribute("doc-url", docUrl);
      view.setAttribute("tool-id", tid);
      view.className = "space-toolbar-item";
      bar.appendChild(view);
    }

    container.appendChild(bar);
  }

  function updateSelectedDoc(url: AutomergeUrl, toolId?: string) {
    if (selectedDoc?.url === url && selectedDoc?.toolId === toolId) return;
    selectedDoc = { url, toolId };
    if (!rootEl) return;

    // Update main view
    const mainView = rootEl.querySelector("[data-main-view]");
    if (mainView) {
      mainView.innerHTML = "";
      appendView(mainView as HTMLElement, url, toolId);
    }

    // Update toolbar
    const toolbar = rootEl.querySelector("[data-toolbar]");
    if (toolbar) {
      toolbar.innerHTML = "";
      buildToolbar(toolbar as HTMLElement, url);
    }
  }

  function toggleEditing() {
    editing = !editing;
    if (!rootEl) return;
    if (editing) {
      rootEl.setAttribute("editing", "");
    } else {
      rootEl.removeAttribute("editing");
    }
    updateOverlay();
  }

  function serializeTree(): SpaceLayout | null {
    if (!rootEl) return null;
    const root = serializeNode(rootEl);
    return root ? { root } : null;
  }

  function serializeNode(el: HTMLElement): SpaceNode | null {
    const id = el.dataset.spaceId;
    if (!id) return null;

    const direction = el.getAttribute("direction") as
      | "horizontal"
      | "vertical"
      | null;
    const node: SpaceNode = { id };

    if (direction) node.direction = direction;

    // Parse sizing from flex shorthand: "grow shrink basis"
    const flexGrow = parseFloat(el.style.flexGrow);
    const flexBasis = el.style.flexBasis;
    if (
      flexGrow === 0 &&
      flexBasis.endsWith("px") &&
      parseFloat(flexBasis) > 0
    ) {
      node.fixedSize = parseInt(flexBasis);
    } else if (flexGrow > 0 && flexGrow !== 1) {
      node.size = flexGrow;
    }

    // Check for children (spaces and pipes)
    const childSpaces = el.querySelectorAll(`:scope > patchwork-space`);
    const childPipes = el.querySelectorAll(`:scope > patchwork-pipe`);

    if (childSpaces.length > 0) {
      // Container: serialize children in DOM order
      node.children = [];
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        if (tag === "patchwork-space") {
          const childNode = serializeNode(child as HTMLElement);
          if (childNode) node.children.push(childNode);
        } else if (tag === "patchwork-pipe") {
          const transform = child.getAttribute("transform") || "";
          const expanded = child.hasAttribute("expanded");
          if (transform || expanded) {
            const pipeId = child.id?.replace("pipe-", "") || `pipe-${Date.now()}`;
            node.children.push({ id: pipeId, type: "pipe", transform, expanded });
          }
        }
      }
    } else {
      // Leaf: preserve content info from the layout
      node.content = getContentForNode(id);
    }

    return node;
  }

  function getContentForNode(id: string): SpaceNode["content"] {
    if (!layout) return undefined;
    const found = findNodeById(layout.root, id);
    return found?.content;
  }

  function findNodeById(node: SpaceNode, id: string): SpaceNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) continue;
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }

  function persistLayout() {
    const serialized = serializeTree();
    if (serialized) {
      layout = serialized;
      saveLayout(accountDocUrl, serialized);
    }
  }

  function resetLayout() {
    const doc = handle.doc() as ConfigDoc | undefined;
    if (!doc) return;
    clearLayout(accountDocUrl);
    layout = createDefaultLayout(accountDocUrl, doc);
    saveLayout(accountDocUrl, layout);
    selectedDoc = null;
    buildTree();
    if (editing) {
      rootEl?.setAttribute("editing", "");
      updateOverlay();
    }
  }

  // ---- Overlay (Done, Reset, Add) ----

  function createOverlay() {
    overlay?.remove();
    overlay = document.createElement("div");
    overlay.className = "edit-overlay";
    overlay.style.display = "none";
    element.appendChild(overlay);
  }

  function updateOverlay() {
    if (!overlay) return;
    if (editing) {
      overlay.style.display = "";
      overlay.innerHTML = "";

      const bar = document.createElement("div");
      bar.className = "edit-controls-bar";

      const addBtn = document.createElement("button");
      addBtn.className = "edit-ctrl-btn edit-ctrl-btn--add";
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", () => addSpace());
      addBtn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        startAddDrag(e, addBtn);
      });
      bar.appendChild(addBtn);

      const sep1 = document.createElement("div");
      sep1.className = "edit-ctrl-sep";
      bar.appendChild(sep1);

      const resetBtn = document.createElement("button");
      resetBtn.className = "edit-ctrl-btn";
      resetBtn.textContent = "Reset";
      resetBtn.addEventListener("click", resetLayout);
      bar.appendChild(resetBtn);

      const doneBtn = document.createElement("button");
      doneBtn.className = "edit-ctrl-btn edit-ctrl-btn--primary";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => toggleEditing());
      bar.appendChild(doneBtn);

      overlay.appendChild(bar);
    } else {
      overlay.style.display = "none";
    }
  }

  // ---- Drag-to-add: drag the "+ Add" button into the layout ----

  function startAddDrag(e: PointerEvent, btn: HTMLElement) {
    if (!rootEl) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    let ghost: HTMLElement | null = null;
    const indicator = document.createElement("div");
    indicator.className = "space-drop-indicator";

    let lastContainer: HTMLElement | null = null;
    let lastRefChild: Element | null = null;

    const cleanup = () => {
      ghost?.remove();
      indicator.remove();
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
    };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) < 6) return;

      if (!dragging) {
        dragging = true;
        ghost = document.createElement("div");
        ghost.className = "space-add-ghost";
        ghost.textContent = "+ Add";
        document.body.appendChild(ghost);
      }

      ghost!.style.left = `${ev.clientX}px`;
      ghost!.style.top = `${ev.clientY}px`;

      ghost!.style.display = "none";
      const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
      ghost!.style.display = "";

      if (!elBelow) return;

      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }

      const target = findNearestContainer(elBelow, rootEl!);
      if (!target) {
        indicator.remove();
        lastContainer = null;
        return;
      }

      const { container, refChild } = computeInsertionPoint(
        target,
        ev.clientX,
        ev.clientY
      );
      container.classList.add("drop-target");
      lastContainer = container;
      lastRefChild = refChild;

      positionIndicator(indicator, container, refChild);
      if (!indicator.parentElement) document.body.appendChild(indicator);
    };

    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      cleanup();

      if (dragging && lastContainer) {
        insertSpaceAt(lastContainer, lastRefChild);
      }
      // If not dragging, the click handler will fire normally and call addSpace()
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  // ---- HTML5 drag-and-drop for file drops from sidebar ----

  function setupFileDrop() {
    let dropIndicator: HTMLElement | null = null;

    element.addEventListener("dragover", (e) => {
      if (!rootEl) return;
      const data = e.dataTransfer;
      if (!data) return;
      if (
        !data.types.includes("text/x-patchwork-urls") &&
        !data.types.includes("text/x-patchwork-dnd")
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      data.dropEffect = "copy";

      const elBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (!elBelow) return;

      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }

      const target = findNearestContainer(elBelow, rootEl);
      if (!target) return;

      const { container } = computeInsertionPoint(target, e.clientX, e.clientY);
      container.classList.add("drop-target");

      if (!dropIndicator) {
        dropIndicator = document.createElement("div");
        dropIndicator.className = "space-drop-indicator";
      }
      const { refChild } = computeInsertionPoint(target, e.clientX, e.clientY);
      positionIndicator(dropIndicator, container, refChild);
      if (!dropIndicator.parentElement)
        document.body.appendChild(dropIndicator);
    });

    element.addEventListener("dragleave", (e) => {
      if (e.relatedTarget && element.contains(e.relatedTarget as Node)) return;
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      dropIndicator?.remove();
      dropIndicator = null;
    });

    element.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      dropIndicator?.remove();
      dropIndicator = null;

      if (!rootEl) return;
      const data = e.dataTransfer;
      if (!data) return;

      let urls: AutomergeUrl[] = [];
      const urlData = data.getData("text/x-patchwork-urls");
      if (urlData) {
        try {
          urls = JSON.parse(urlData);
        } catch {}
      }
      if (urls.length === 0) {
        const dndData = data.getData("text/x-patchwork-dnd");
        if (dndData) {
          try {
            const parsed = JSON.parse(dndData);
            urls = (parsed.items || []).map((i: any) => i.url).filter(Boolean);
          } catch {}
        }
      }

      if (urls.length === 0) return;

      const elBelow = document.elementFromPoint(e.clientX, e.clientY);
      if (!elBelow) return;
      const target = findNearestContainer(elBelow, rootEl);
      if (!target) return;
      const { container, refChild } = computeInsertionPoint(
        target,
        e.clientX,
        e.clientY
      );

      // If dropped on a leaf space, check if it's an empty/picker space and fill it instead
      const spaceBelow = findLeafSpace(elBelow);
      if (spaceBelow) {
        const spaceId = spaceBelow.dataset.spaceId;
        if (spaceId && layout) {
          const node = findNodeById(layout.root, spaceId);
          if (node && node.content?.type === "picker") {
            const pickerEl = spaceBelow.querySelector(".space-picker");
            pickerEl?.remove();
            node.content = { type: "view", docUrl: urls[0] };
            spaceBelow.dataset.mainView = "true";
            appendView(spaceBelow, urls[0]);
            persistLayout();
            return;
          }
        }
      }

      // If we're in edit mode, insert new space(s) at the drop location
      // Otherwise, if we're dropping on a main view, open it there
      if (editing) {
        for (const url of urls) {
          insertDocViewAt(container, refChild, url);
        }
      } else {
        updateSelectedDoc(urls[0]);
      }
    });
  }

  // ---- Shared drop-target utilities ----

  function findNearestContainer(
    el: Element,
    root: HTMLElement
  ): HTMLElement | null {
    let candidate: Element | null = el;
    while (candidate && candidate !== root.parentElement) {
      if (candidate.tagName.toLowerCase() === "patchwork-space") {
        return candidate as HTMLElement;
      }
      candidate = candidate.parentElement;
    }
    return root;
  }

  function findLeafSpace(el: Element): HTMLElement | null {
    let candidate: Element | null = el;
    while (candidate) {
      if (
        candidate.tagName.toLowerCase() === "patchwork-space" &&
        !candidate.querySelector(":scope > patchwork-space")
      ) {
        return candidate as HTMLElement;
      }
      candidate = candidate.parentElement;
    }
    return null;
  }

  function computeInsertionPoint(
    target: HTMLElement,
    clientX: number,
    clientY: number
  ): { container: HTMLElement; refChild: Element | null } {
    // If it's a leaf, use its parent as the container
    const isLeaf = !target.querySelector(":scope > patchwork-space");
    const container = isLeaf
      ? ((target.parentElement as HTMLElement) ?? target)
      : target;

    if (container.tagName.toLowerCase() !== "patchwork-space") {
      return { container: target, refChild: null };
    }

    const children = Array.from(
      container.querySelectorAll(":scope > patchwork-space")
    );
    if (children.length === 0) return { container, refChild: null };

    const isHoriz = container.getAttribute("direction") !== "vertical";

    for (const child of children) {
      const r = child.getBoundingClientRect();
      const mid = isHoriz ? r.left + r.width / 2 : r.top + r.height / 2;
      const pos = isHoriz ? clientX : clientY;
      if (pos < mid) return { container, refChild: child };
    }

    return { container, refChild: null };
  }

  function positionIndicator(
    indicator: HTMLElement,
    container: HTMLElement,
    refChild: Element | null
  ) {
    const isHoriz = container.getAttribute("direction") !== "vertical";

    if (refChild) {
      const r = refChild.getBoundingClientRect();
      if (isHoriz) {
        indicator.style.left = `${r.left - 2}px`;
        indicator.style.top = `${r.top}px`;
        indicator.style.width = "4px";
        indicator.style.height = `${r.height}px`;
      } else {
        indicator.style.left = `${r.left}px`;
        indicator.style.top = `${r.top - 2}px`;
        indicator.style.width = `${r.width}px`;
        indicator.style.height = "4px";
      }
    } else {
      // After the last child
      const children = container.querySelectorAll(":scope > patchwork-space");
      const lastChild = children[children.length - 1];
      if (lastChild) {
        const r = lastChild.getBoundingClientRect();
        if (isHoriz) {
          indicator.style.left = `${r.right - 2}px`;
          indicator.style.top = `${r.top}px`;
          indicator.style.width = "4px";
          indicator.style.height = `${r.height}px`;
        } else {
          indicator.style.left = `${r.left}px`;
          indicator.style.top = `${r.bottom - 2}px`;
          indicator.style.width = `${r.width}px`;
          indicator.style.height = "4px";
        }
      } else {
        const cr = container.getBoundingClientRect();
        indicator.style.left = `${cr.left + 4}px`;
        indicator.style.top = `${cr.top + 4}px`;
        indicator.style.width = `${cr.width - 8}px`;
        indicator.style.height = `${cr.height - 8}px`;
      }
    }
  }

  function addSpace() {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode: SpaceNode = {
      id: newId,
      content: { type: "picker" },
    };
    const el = buildNode(newNode);
    rootEl.appendChild(el);
    if (editing) {
      el.setAttribute("editing", "");
      (rootEl as any).refreshEditUI?.();
    }
    persistLayout();
  }

  function insertSpaceAt(
    container: HTMLElement,
    refChild: Element | null,
    content?: SpaceNode["content"]
  ) {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode: SpaceNode = {
      id: newId,
      content: content ?? { type: "picker" },
    };
    const el = buildNode(newNode);
    container.insertBefore(el, refChild);
    if (editing) {
      el.setAttribute("editing", "");
      (container as any).refreshEditUI?.();
    }
    persistLayout();
  }

  function insertDocViewAt(
    container: HTMLElement,
    refChild: Element | null,
    docUrl: AutomergeUrl
  ) {
    const newId = `space-${Date.now()}`;
    const newNode: SpaceNode = {
      id: newId,
      content: { type: "view", docUrl },
    };
    const el = buildNode(newNode);
    container.insertBefore(el, refChild);
    if (editing) {
      el.setAttribute("editing", "");
      (container as any).refreshEditUI?.();
    }
    persistLayout();
  }

  // ---- Event listeners ----

  function setupListeners(doc: ConfigDoc) {
    element.addEventListener("patchwork:open-document", (event: Event) => {
      const e = event as OpenDocumentEvent;
      e.stopPropagation();
      updateSelectedDoc(e.detail.url, e.detail.toolId);
    });

    element.addEventListener("space:reorder", (e: Event) => {
      // Refresh the parent container's dividers after reorder
      const target = e.target as HTMLElement;
      const parent = target.parentElement;
      if (parent) (parent as any).refreshEditUI?.();
      persistLayout();
    });
    element.addEventListener("space:resize", () => persistLayout());
    element.addEventListener("space:remove", ((e: CustomEvent) => {
      const target = e.target as HTMLElement;
      const parent = target.parentElement;
      target.remove();
      // Refresh parent's dividers after child removal
      if (parent) (parent as any).refreshEditUI?.();
      persistLayout();
    }) as EventListener);
    element.addEventListener("pipe:update", (e: Event) => {
      const target = e.target as HTMLElement;
      const parent = target.parentElement;
      if (parent) (parent as any).refreshEditUI?.();
      persistLayout();
    });
    element.addEventListener("pipe:delete", () => persistLayout());

    window.addEventListener("keydown", onKeyDown);
    setupFileDrop();
  }

  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "e") {
      e.preventDefault();
      toggleEditing();
    }
    if (e.key === "Escape" && editing) {
      toggleEditing();
    }
  }

  // Start
  init();

  // Cleanup function
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    overlay?.remove();
    rootEl?.remove();
  };
}
