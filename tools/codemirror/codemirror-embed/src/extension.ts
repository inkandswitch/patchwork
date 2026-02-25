import {
  EditorView,
  Decoration,
  WidgetType,
  ViewPlugin,
  ViewUpdate,
  type DecorationSet,
} from "@codemirror/view";
import { Range } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { type DocumentId, isValidDocumentId, parseAutomergeUrl } from "@automerge/automerge-repo";
import { embedTheme } from "./theme.ts";
import { openLinkIcon } from "./icons.ts";

/**
 * Widget to render an embedded <patchwork-view> element in a CodeMirror editor.
 */
class EmbedWidget extends WidgetType {
  readonly docId: DocumentId;
  readonly toolId: string;
  readonly embedText: string;

  constructor(docId: DocumentId, toolId: string, embedText: string) {
    super();
    this.docId = docId;
    this.toolId = toolId;
    this.embedText = embedText;
  }

  eq(other: EmbedWidget) {
    return other.docId === this.docId && other.toolId === this.toolId;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-embed";

    const label = document.createElement("div");
    label.className = "cm-embed-label";

    const labelText = document.createElement("span");
    labelText.className = "cm-embed-label-text";
    labelText.textContent = this.embedText;
    labelText.title = "Click to edit";

    const openLink = document.createElement("button");
    openLink.className = "cm-embed-open-link";
    openLink.title = "Open document";
    openLink.innerHTML = openLinkIcon;

    openLink.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const params = new URLSearchParams();
      params.set("doc", this.docId);
      params.set("tool", this.toolId);
      window.location.hash = params.toString();
    };

    label.appendChild(labelText);
    label.appendChild(openLink);

    const view = document.createElement("patchwork-view");
    view.setAttribute("doc-url", `automerge:${this.docId}`);
    view.setAttribute("tool-id", this.toolId);

    container.appendChild(label);
    container.appendChild(view);

    return container;
  }

  ignoreEvent(e: Event) {
    if (e.type === "mousedown" && e.target instanceof Element) {
      // Allow clicks on the label text to pass through for editing
      if (e.target.classList.contains("cm-embed-label-text")) {
        return false; // Let the editor handle it
      }
      // Block clicks on the open link button (let button handle it)
      if (
        e.target.classList.contains("cm-embed-open-link") ||
        e.target.closest(".cm-embed-open-link")
      ) {
        return true; // Block from editor
      }
    }
    // Block other events from reaching the editor (let patchwork-view handle them)
    return true;
  }
}

function getEmbedLinks(view: EditorView) {
  const widgets: Range<Decoration>[] = [];
  const { state } = view;
  const selection = state.selection.main;

  for (let { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        // Match markdown link syntax
        if (node.name === "Link") {
          const linkFrom = node.from;
          const linkTo = node.to;

          // Check if cursor is inside this link
          const cursorInLink =
            selection.from >= linkFrom && selection.from <= linkTo;
          // Check if the link is inside the selection
          const selectionSpansLink =
            selection.from < linkFrom && selection.to > linkTo;

          // Replace if cursor is outside the link and there's no selection across the link
          if (!cursorInLink && !selectionSpansLink) {
            const linkText = state.doc.sliceString(linkFrom, linkTo);

            // Match [patchwork:docId/toolId] format
            const match = linkText.match(/\[patchwork:([^/\]]+)\/([^\]]+)\]/);

            if (match) {
              const [, docId, toolId] = match;

              // Validate the DocumentId before creating the embed widget
              if (isValidDocumentId(docId)) {
                // Replace the entire [patchwork:docId/toolId] with the embed widget
                const embed = Decoration.replace({
                  widget: new EmbedWidget(
                    docId as DocumentId,
                    toolId,
                    linkText
                  ),
                });

                widgets.push(embed.range(linkFrom, linkTo));
              }
            }
          }
        }
      },
    });
  }

  return Decoration.set(widgets);
}

/** MIME type used by the sideboard (and similar) for document drag-and-drop. */
const PATCHWORK_DND = "text/x-patchwork-dnd";

/**
 * Drop handler that accepts documents dragged from the sidebar (or elsewhere)
 * using text/x-patchwork-dnd. Inserts [patchwork:docId/toolId] at the drop position.
 */
function embedDropHandlers() {
  return EditorView.domEventHandlers({
    dragover(event, view) {
      if (!event.dataTransfer?.types.includes(PATCHWORK_DND)) return false;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      return true;
    },
    drop(event, view) {
      if (!event.dataTransfer?.types.includes(PATCHWORK_DND)) return false;
      const raw = event.dataTransfer.getData(PATCHWORK_DND);
      if (!raw) return false;
      try {
        const data = JSON.parse(raw) as { items?: Array<{ url?: string; source?: string }> };
        const items = data?.items;
        if (!Array.isArray(items) || items.length === 0) return false;
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos == null) return false;
        const inserts: string[] = [];
        for (const item of items) {
          const url = item?.url;
          const toolId = item?.source;
          if (!url || !toolId) continue;
          const { documentId } = parseAutomergeUrl(url);
          if (!isValidDocumentId(documentId)) continue;
          inserts.push(`[patchwork:${documentId}/${toolId}]`);
        }
        if (inserts.length === 0) return false;
        event.preventDefault();
        const text = inserts.join("\n\n");
        view.dispatch({
          changes: { from: pos, insert: text },
          selection: { anchor: pos + text.length },
        });
        return true;
      } catch {
        return false;
      }
    },
  });
}

const embedPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getEmbedLinks(view);
    }

    update(update: ViewUpdate) {
      // Recompute when doc changes, selection moves, or viewport changes
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = getEmbedLinks(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

export function codeMirrorEmbed() {
  return [embedPlugin, embedTheme, embedDropHandlers()];
}
