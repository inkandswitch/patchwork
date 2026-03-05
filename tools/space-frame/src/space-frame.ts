import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";
import { registerPatchworkSpace } from "./elements/patchwork-space";
import { registerPatchworkPreviewElement } from "./elements/patchwork-preview";
import { registerPatchworkPipe } from "./elements/patchwork-pipe";
import { loadLayout, saveLayout, clearLayout } from "./layout/storage";
import { createDefaultLayout, type AccountConfig } from "./layout/defaults";
import type { SpaceLayout, SpaceNode, SpaceChild, PipeNode } from "./layout/types";
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
    if (pipe.transforms.length > 0) {
      el.setAttribute("transforms", pipe.transforms.join(","));
    }
    return el;
  }

  function buildContent(container: HTMLElement, node: SpaceNode) {
    if (!node.content) return;

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

  function appendView(container: HTMLElement, docUrl: AutomergeUrl, toolId?: string) {
    const view = document.createElement("patchwork-view");
    view.setAttribute("doc-url", docUrl);
    if (toolId) view.setAttribute("tool-id", toolId);
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    container.appendChild(view);
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

    const direction = el.getAttribute("direction") as "horizontal" | "vertical" | null;
    const node: SpaceNode = { id };

    if (direction) node.direction = direction;

    // Parse sizing from flex shorthand: "grow shrink basis"
    const flexGrow = parseFloat(el.style.flexGrow);
    const flexBasis = el.style.flexBasis;
    if (flexGrow === 0 && flexBasis.endsWith("px") && parseFloat(flexBasis) > 0) {
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
          const pipeId = child.id?.replace("pipe-", "") || `pipe-${Date.now()}`;
          const transforms = (child.getAttribute("transforms") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as AutomergeUrl[];
          node.children.push({ id: pipeId, type: "pipe", transforms });
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

  function addSpace() {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode: SpaceNode = {
      id: newId,
      content: { type: "preview" },
    };
    const el = buildNode(newNode);
    rootEl.appendChild(el);
    if (editing) {
      el.setAttribute("editing", "");
    }
    persistLayout();
  }

  function refreshDividers() {
    if (!rootEl) return;
    const containers = rootEl.querySelectorAll("patchwork-space[editing]");
    for (const c of containers) {
      (c as any).refreshEditUI?.();
    }
  }

  // ---- Event listeners ----

  function setupListeners(doc: ConfigDoc) {
    element.addEventListener("patchwork:open-document", (event: Event) => {
      const e = event as OpenDocumentEvent;
      e.stopPropagation();
      updateSelectedDoc(e.detail.url, e.detail.toolId);
    });

    element.addEventListener("space:reorder", () => {
      persistLayout();
      refreshDividers();
    });
    element.addEventListener("space:resize", () => persistLayout());
    element.addEventListener("space:remove", ((e: CustomEvent) => {
      const target = e.target as HTMLElement;
      target.remove();
      persistLayout();
    }) as EventListener);
    element.addEventListener("pipe:update", () => persistLayout());
    element.addEventListener("pipe:delete", () => persistLayout());

    window.addEventListener("keydown", onKeyDown);
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
