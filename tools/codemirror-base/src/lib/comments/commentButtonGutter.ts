import { RangeSet } from "@codemirror/state";
import { EditorView, gutter, GutterMarker, WidgetType } from "@codemirror/view";

type CommentButtonCallback = (
  from: number,
  to: number,
  view: EditorView
) => void;

// Comment button widget shown in the gutter
class CommentButtonWidget extends WidgetType {
  from: number;
  to: number;
  onComment: CommentButtonCallback | undefined;
  view: EditorView;

  constructor(
    from: number,
    to: number,
    view: EditorView,
    onComment: CommentButtonCallback
  ) {
    super();
    this.from = from;
    this.to = to;
    this.onComment = onComment;
    this.view = view;
  }

  toDOM(): HTMLElement {
    const button = document.createElement("button");
    button.textContent = "💬";
    button.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 2px;
      border-radius: 3px;
      transition: background-color 0.2s;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.backgroundColor = "transparent";
    });

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onComment) {
        this.onComment(this.from, this.to, this.view);
      } else {
        // fallback: Log if no callback provided
        console.log("Comment button clicked for range:", this.from, this.to);
      }
    });

    return button;
  }

  eq(other: CommentButtonWidget) {
    // Equal if the from/to range and callback are identical
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.onComment === other.onComment
    );
  }

  ignoreEvent() {
    return false; // We want to handle click events
  }
}

// Comment button gutter marker
class CommentButtonMarker extends GutterMarker {
  from: number;
  to: number;
  onComment: CommentButtonCallback;

  constructor(from: number, to: number, onComment: CommentButtonCallback) {
    super();
    this.from = from;
    this.to = to;
    this.onComment = onComment;
  }

  eq(other: CommentButtonMarker) {
    return (
      this.from === other.from &&
      this.to === other.to &&
      this.onComment === other.onComment
    );
  }

  toDOM(view: EditorView) {
    return new CommentButtonWidget(
      this.from,
      this.to,
      view,
      this.onComment
    ).toDOM();
  }
}

// Factory function to create the gutter with a callback
export const commentButtonGutter = (onComment: CommentButtonCallback) => {
  return gutter({
    class: "cm-comment-gutter",
    renderEmptyElements: false,
    side: "after", // Right side
    markers(view) {
      const sel = view.state.selection.main;
      if (sel.empty) return RangeSet.empty;

      // Place marker at the start of the line where the selection begins
      const line = view.state.doc.lineAt(sel.from);
      return RangeSet.of([
        new (class extends CommentButtonMarker {
          toDOM = (_: EditorView) =>
            new CommentButtonWidget(
              this.from,
              this.to,
              view,
              onComment
            ).toDOM();
        })(sel.from, sel.to, onComment).range(line.from),
      ]);
    },
  });
};
