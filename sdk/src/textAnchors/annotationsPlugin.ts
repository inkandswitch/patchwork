import { ResolvedTextAnchor } from "@patchwork/sdk/textAnchors";
import { AnnotationWithUIState } from "@patchwork/sdk/versionControl";
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { foldAwareLineNumberGutter } from "./foldLinesWithoutChanges";

export const ANNOTATION_STYLES = {
  ".cm-patch-splice": {
    backgroundColor: "rgb(0 255 0 / 5%)",
    borderBottom: "rgb(0 202 0 / 30%) 2px solid",
    borderRadius: "3px",
  },
  ".cm-patch-splice.active": {
    backgroundColor: "rgb(0 255 0 / 20%)",
  },
  ".cm-patch-splice .cm-comment-thread, .cm-comment-thread .cm-patch-splice": {
    backgroundColor: "rgb(100 202 0 / 5%)",
  },
  ".cm-patch-splice .cm-comment-thread.active, .cm-comment-thread.active .cm-patch-splice":
  {
    backgroundColor: "rgb(100 202 0 / 30%)",
    borderBottom: "rgb(0 222 0 / 100%) 2px solid",
  },
  ".cm-comment-thread": {
    backgroundColor: "rgb(255 249 194)",
  },
  ".cm-comment-thread.active": {
    backgroundColor: "rgb(255 227 135)",
  },
  // active highlighting wins if it's inside another thread
  ".cm-comment-thread.active .cm-comment-thread": {
    backgroundColor: "rgb(255 227 135)",
  },
  ".cm-folded-range": {
    background: "#f3f4f6",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    padding: 0,
    height: "40px",
  },
  // hack: codemirror inserts widget buffer element that throws off the spacing
  ".cm-folded-range .cm-widgetBuffer": {
    display: "none",
  },
};

export const setAnnotationsEffect =
  StateEffect.define<AnnotationWithUIState<ResolvedTextAnchor, string>[]>();

export const annotationsField = StateField.define<
  AnnotationWithUIState<ResolvedTextAnchor, string>[]
>({
  create() {
    return [];
  },
  update(patches, tr) {
    for (const e of tr.effects) {
      if (e.is(setAnnotationsEffect)) {
        return e.value.sort((a, b) => a.anchor.fromPos - b.anchor.fromPos);
      }
    }
    return patches;
  },
});

class DeletionMarker extends WidgetType {
  deletedText: string;
  isActive: boolean;

  constructor(deletedText: string, isActive: boolean) {
    super();
    this.deletedText = deletedText;
    this.isActive = isActive;
  }

  toDOM(): HTMLElement {
    const box = document.createElement("div");
    box.style.display = "inline-block";
    box.style.boxSizing = "border-box";
    box.style.padding = "0 2px";
    box.style.color = "rgb(236 35 35)";
    box.style.margin = "0 4px";
    box.style.fontSize = "0.8em";
    box.style.backgroundColor = this.isActive
      ? "rgb(255 0 0 / 20%)"
      : "rgb(255 0 0 / 10%)";
    box.style.borderRadius = "3px";
    box.style.cursor = "default";
    box.innerText = "⌫";

    const hoverText = document.createElement("div");
    hoverText.style.position = "absolute";
    hoverText.style.zIndex = "1";
    hoverText.style.padding = "10px";
    hoverText.style.backgroundColor = "rgb(255 230 230)";
    hoverText.style.fontSize = "15px";
    hoverText.style.color = "black";
    hoverText.style.padding = "5px";
    hoverText.style.border = "rgb(100 55 55)";
    hoverText.style.boxShadow = "0px 0px 6px rgba(0, 0, 0, 0.1)";
    hoverText.style.borderRadius = "3px";
    hoverText.style.visibility = "hidden";
    hoverText.innerText = this.deletedText;

    box.appendChild(hoverText);

    box.onmouseover = function () {
      hoverText.style.visibility = "visible";
    };
    box.onmouseout = function () {
      hoverText.style.visibility = "hidden";
    };

    return box;
  }

  eq(other: DeletionMarker) {
    return (
      other.deletedText === this.deletedText && other.isActive === this.isActive
    );
  }

  ignoreEvent() {
    return true;
  }
}

const spliceDecoration = Decoration.mark({ class: "cm-patch-splice" });
const spliceDecorationActive = Decoration.mark({
  class: "cm-patch-splice active",
});

const highlightDecoration = Decoration.mark({ class: "cm-comment-thread" });
const highlightDecorationActive = Decoration.mark({
  class: "cm-comment-thread active",
});

const makeDeleteDecoration = (deletedText: string, isActive: boolean) =>
  Decoration.widget({
    widget: new DeletionMarker(deletedText, isActive),
    side: 1,
  });

export const annotationDecorations = EditorView.decorations.compute(
  [annotationsField],
  (state) => {
    const annotations = state.field(annotationsField);

    const decorations = annotations.flatMap((annotation) => {
      const { fromPos, toPos } = annotation.anchor;
      switch (annotation.type) {
        case "added": {
          // In general we shouldn't construct invalid annotation ranges,
          // but this case can happen if a users inserts one character at the end of the text.
          //
          // Why does this happen?
          // Cursors positions are interpreted as pointing before the character
          // We can't do this at the end of the text, because there is no next character
          // so instead we point to the last character. In the case of a single character
          // being inserted this means that both the from and the to position point to the same character
          //
          // todo: remove once we can point to sides of characters with cursors
          if (fromPos == toPos) {
            return [];
          }

          const decoration = annotation.isEmphasized
            ? spliceDecorationActive
            : spliceDecoration;
          return [decoration.range(fromPos, toPos)];
        }
        case "deleted": {
          return [
            makeDeleteDecoration(
              annotation.deleted,
              annotation.isEmphasized
            ).range(fromPos),
          ];
        }

        case "changed": {
          // same case as added
          // todo: remove once we can point to sides of characters with cursors
          if (fromPos == toPos) {
            return [];
          }

          const decoration = annotation.isEmphasized
            ? spliceDecorationActive
            : spliceDecoration;
          return [
            decoration.range(fromPos, toPos),
            makeDeleteDecoration(
              annotation.before,
              annotation.isEmphasized
            ).range(toPos),
          ];
        }

        case "highlighted": {
          const decoration = annotation.isEmphasized
            ? highlightDecorationActive
            : highlightDecoration;
          return [decoration.range(fromPos, toPos)];
        }
      }
    });

    return Decoration.set(decorations, true);
  }
);

export const annotationsPlugin = [
  EditorView.theme(ANNOTATION_STYLES),
  annotationDecorations,
  annotationsField,
  foldAwareLineNumberGutter,
];
