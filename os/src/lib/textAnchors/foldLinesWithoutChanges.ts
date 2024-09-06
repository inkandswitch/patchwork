import {
  EditorState,
  RangeSet,
  StateEffect,
  StateField,
} from "@codemirror/state";
import { Decoration, GutterMarker, WidgetType, gutter } from "@codemirror/view";
import { EditorView } from "codemirror";
import { ArrowDownFromLine, ArrowUpFromLine, createElement } from "lucide";
import { annotationsField, setAnnotationsEffect } from "./annotationsPlugin";

type LineRange = {
  fromLine: number;
  toLine: number;
};

const FOLDABLE_RANGE_MIN_LINES = 3;

const EXTEND_RANGE_STEPS = 10;

// Define the structure for unfolded ranges
type CharacterRange = {
  fromPos: number;
  toPos: number;
};

// Define the StateField for unfolded lines
export const unfoldedRangesField = StateField.define<CharacterRange[]>({
  create() {
    return [];
  },
  update(unfoldedRanges, transaction) {
    if (transaction.docChanged) {
      // Map the existing ranges to their new positions
      return unfoldedRanges.map((range) => ({
        fromPos: transaction.changes.mapPos(range.fromPos),
        toPos: transaction.changes.mapPos(range.toPos),
      }));
    }

    // Handle case to add unfolded range
    for (const effect of transaction.effects) {
      if (effect.is(addUnfoldedRangeEffect)) {
        const newRange = effect.value;
        // Find all overlapping ranges
        const overlappingRanges = unfoldedRanges.filter(
          (range) =>
            (newRange.fromPos >= range.fromPos &&
              newRange.fromPos <= range.toPos) ||
            (newRange.toPos >= range.fromPos &&
              newRange.toPos <= range.toPos) ||
            (newRange.fromPos <= range.fromPos && newRange.toPos >= range.toPos)
        );

        if (overlappingRanges.length > 0) {
          // Create a union of all overlapping ranges
          const unionRange = overlappingRanges.reduce(
            (acc, range) => ({
              fromPos: Math.min(acc.fromPos, range.fromPos, newRange.fromPos),
              toPos: Math.max(acc.toPos, range.toPos, newRange.toPos),
            }),
            { fromPos: Infinity, toPos: -Infinity }
          );

          // Remove all overlapping ranges
          unfoldedRanges = unfoldedRanges.filter(
            (range) => !overlappingRanges.includes(range)
          );

          // Add the union range
          unfoldedRanges.push(unionRange);
        } else {
          // Add new range if no overlap
          unfoldedRanges.push(newRange);
        }
      }
    }

    return unfoldedRanges;
  },
});

// Define the effect for adding an unfolded range
export const addUnfoldedRangeEffect = StateEffect.define<CharacterRange>();

// Helper function to add an unfolded range
export function addUnfoldedRange({
  view,
  fromLineNumber,
  toLineNumber,
}: {
  fromLineNumber: number;
  toLineNumber: number;
  view: EditorView;
}) {
  view.dispatch({
    effects: addUnfoldedRangeEffect.of({
      fromPos: view.state.doc.line(fromLineNumber).from,
      toPos: view.state.doc.line(toLineNumber).to,
    }),
  });
}

export const foldedRangesField = StateField.define<LineRange[]>({
  create(state) {
    return computeFoldedRanges(state);
  },
  update(ranges, transaction) {
    if (
      transaction.docChanged ||
      transaction.effects.some(
        (e) => e.is(addUnfoldedRangeEffect) || e.is(setAnnotationsEffect)
      )
    ) {
      return computeFoldedRanges(transaction.state);
    }

    return ranges;
  },
});

const computeFoldedRanges = (state: EditorState): LineRange[] => {
  const annotations = state.field(annotationsField);
  const unfoldedRanges = state.field(unfoldedRangesField);
  const totalLines = state.doc.lines;

  const combinedUnfoldedRanges: CharacterRange[] = unfoldedRanges
    .concat(
      annotations.map((annotation) => ({
        fromPos: annotation.anchor.fromPos,
        toPos: annotation.anchor.toPos,
      }))
    )
    .sort((a, b) => a.fromPos - b.fromPos);

  let nextUnfoldedRange = combinedUnfoldedRanges.shift();

  const foldedRanges: LineRange[] = [];

  let currentFoldedRangeFromLine: number | undefined;

  const addLineToFoldedRange = (lineNumber: number) => {
    if (currentFoldedRangeFromLine === undefined) {
      currentFoldedRangeFromLine = lineNumber;
    }
  };

  const endFoldedRangeAt = (lineNumber: number) => {
    if (currentFoldedRangeFromLine !== undefined) {
      // shrink foldable range by setting unfoldedLines
      const fromLine = currentFoldedRangeFromLine;
      const toLine = lineNumber;

      // ignore ranges that are smaller than the min size
      if (toLine - fromLine + 1 > FOLDABLE_RANGE_MIN_LINES) {
        foldedRanges.push({
          fromLine,
          toLine,
        });
      }

      currentFoldedRangeFromLine = undefined;
    }
  };

  for (let lineNumber = 1; lineNumber <= totalLines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    const lineStartPos = line.from;
    const lineEndPos = line.to;

    if (!nextUnfoldedRange) {
      addLineToFoldedRange(lineNumber);
      endFoldedRangeAt(totalLines);
      break;
    }

    const unfoldedRangeStart = nextUnfoldedRange.fromPos;
    const unfoldedRangeEnd = nextUnfoldedRange.toPos;

    const annotationEndInFoldableRegion =
      unfoldedRangeEnd >= lineStartPos && unfoldedRangeEnd <= lineEndPos;
    const annotationStartInFoldableRegion =
      unfoldedRangeStart >= lineStartPos && unfoldedRangeStart <= lineEndPos;

    const annotationContainsLine =
      unfoldedRangeStart < lineStartPos && unfoldedRangeEnd > lineEndPos;

    if (
      !annotationEndInFoldableRegion &&
      !annotationStartInFoldableRegion &&
      !annotationContainsLine
    ) {
      addLineToFoldedRange(lineNumber);
    } else {
      endFoldedRangeAt(Math.max(1, lineNumber - 1));

      if (annotationEndInFoldableRegion) {
        do {
          nextUnfoldedRange = combinedUnfoldedRanges.shift();
        } while (nextUnfoldedRange && nextUnfoldedRange.toPos <= lineEndPos);
      }
    }
  }

  endFoldedRangeAt(totalLines);
  return foldedRanges;
};

export const foldedRangesDecoration = EditorView.decorations.compute(
  ["doc", foldedRangesField],
  (state) => {
    const foldedRanges = state.field(foldedRangesField);

    // Create decorations for unannotated lines and add ellipsis
    const decorations = foldedRanges.flatMap(({ fromLine, toLine }) => {
      const fromPos = state.doc.line(fromLine).from;
      const toPos = state.doc.line(toLine).to;
      const omittedLines = toLine - fromLine + 1;
      return [
        Decoration.replace({
          inclusive: true,
          widget: new (class extends WidgetType {
            toDOM() {
              const el = document.createElement("div");
              el.className =
                "cm-folded-line-widget flex items-center h-full pl-2 text-gray-500 font-sans text-xs";
              el.textContent = `${omittedLines} lines omitted`;
              return el;
            }
          })(),
        }).range(fromPos, toPos),
        Decoration.line({
          class: "cm-folded-range",
        }).range(fromPos),
      ];
    });

    return Decoration.set(decorations, true);
  }
);

class LineMarker extends GutterMarker {
  constructor(
    private lineNumber: number,
    private view: EditorView,
    private foldedRange?: LineRange
  ) {
    super();
  }

  toDOM() {
    const foldedRange = this.foldedRange;

    if (foldedRange) {
      const div = document.createElement("div");
      div.className =
        "cm-folded-range-gutter-marker flex flex-col h-full border-gray-300 border-t border-b";

      if (this.lineNumber !== 1) {
        const downButton = document.createElement("button");
        downButton.className =
          "flex-grow flex items-center justify-center hover:bg-gray-200 transition-colors duration-200";

        const icon = createElement(ArrowDownFromLine);
        icon.setAttribute("width", "16px");
        icon.setAttribute("height", "16px");

        downButton.append(icon);
        downButton.addEventListener("mousedown", (e) => {
          e.preventDefault();
          addUnfoldedRange({
            view: this.view,
            fromLineNumber: foldedRange.fromLine,
            toLineNumber: Math.min(
              foldedRange.toLine,
              foldedRange.fromLine + EXTEND_RANGE_STEPS
            ),
          });
        });
        div.appendChild(downButton);
      }

      if (foldedRange.toLine !== this.view.state.doc.lines) {
        const upButton = document.createElement("button");
        upButton.className =
          "flex-grow flex items-center justify-center hover:bg-gray-200 transition-colors duration-200";

        const icon = createElement(ArrowUpFromLine);
        icon.setAttribute("width", "16px");
        icon.setAttribute("height", "16px");

        upButton.append(icon);
        upButton.addEventListener("mousedown", (e) => {
          e.preventDefault();
          addUnfoldedRange({
            view: this.view,
            fromLineNumber: Math.max(
              1,
              foldedRange.toLine - EXTEND_RANGE_STEPS
            ),
            toLineNumber: foldedRange.toLine,
          });
        });
        div.appendChild(upButton);
      }

      return div;
    } else {
      const span = document.createElement("span");
      span.className =
        "cm-folded-range-gutter-line-number text-right px-1 h-full flex items-center justify-end";
      span.textContent = this.lineNumber.toString();
      return span;
    }
  }
}

// Unfortunately we need to create our own line number gutter
// because we can't override the behavior of the existing line number gutter
// to render fold / unfold controls in lines that have been folded instead of the line number
export const foldAwareLineNumberGutter = gutter({
  class: "cm-folded-range-gutter",
  markers: (view) => {
    const foldedRanges = view.state.field(foldedRangesField, false) ?? [];
    const markers = [];

    for (let i = 1; i <= view.state.doc.lines; i++) {
      const foldedRange = foldedRanges.find(
        (range) => i >= range.fromLine && i <= range.toLine
      );

      markers.push(
        new LineMarker(i, view, foldedRange).range(view.state.doc.line(i).from)
      );
    }
    const markerSet = RangeSet.of(markers);

    return markerSet;
  },
  initialSpacer: (view) => new LineMarker(0, view),
});

export const hideLinesWithoutAnnotations = [
  foldedRangesField,
  unfoldedRangesField,
  foldedRangesDecoration,
];
