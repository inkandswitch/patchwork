import { createSignal, createEffect, For, Show, onMount } from "solid-js";
import type { SpaceLayout, SpaceItem, Pipe } from "../layout/types";
import { PipeEditorPopover } from "../pipes/PipeEditorPopover";

type Props = {
  layout: SpaceLayout;
  gridDims: { cols: number; rows: number };
  onUpdateLayout: (updater: (prev: SpaceLayout) => SpaceLayout) => void;
  onDone: () => void;
  onReset: () => void;
};

type PipeEditorState = {
  pipe: Pipe;
  screenX: number;
  screenY: number;
};

type AdjacentPair = {
  left: SpaceItem;
  right: SpaceItem;
  orientation: "horizontal" | "vertical";
};

type ConnectionPos = {
  pair: AdjacentPair;
  x: number;
  y: number;
};

export function EditModeOverlay(props: Props) {
  const [addPicker, setAddPicker] = createSignal<{
    screenX: number;
    screenY: number;
    col: number;
    row: number;
  } | null>(null);
  const [pipeEditor, setPipeEditor] = createSignal<PipeEditorState | null>(null);
  const [connectionPositions, setConnectionPositions] = createSignal<ConnectionPos[]>([]);

  function findAllLeafItems(items: SpaceItem[]): SpaceItem[] {
    const result: SpaceItem[] = [];
    for (const item of items) {
      if (item.content.type === "group") {
        result.push(...findAllLeafItems(item.content.children));
      } else {
        result.push(item);
      }
    }
    return result;
  }

  function findAdjacentPairs(items: SpaceItem[]): AdjacentPair[] {
    const leaves = findAllLeafItems(items);
    const pairs: AdjacentPair[] = [];
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const a = leaves[i];
        const b = leaves[j];

        if (a.col + a.cols === b.col && a.row < b.row + b.rows && b.row < a.row + a.rows) {
          pairs.push({ left: a, right: b, orientation: "horizontal" });
        } else if (b.col + b.cols === a.col && a.row < b.row + b.rows && b.row < a.row + a.rows) {
          pairs.push({ left: b, right: a, orientation: "horizontal" });
        }

        if (a.row + a.rows === b.row && a.col < b.col + b.cols && b.col < a.col + a.cols) {
          pairs.push({ left: a, right: b, orientation: "vertical" });
        } else if (b.row + b.rows === a.row && a.col < b.col + b.cols && b.col < a.col + a.cols) {
          pairs.push({ left: b, right: a, orientation: "vertical" });
        }
      }
    }
    return pairs;
  }

  function computeConnectionPositions() {
    const root = document.getElementById("space-root");
    if (!root) return;

    const pairs = findAdjacentPairs(props.layout.items);
    const positions: ConnectionPos[] = [];

    for (const pair of pairs) {
      const leftEl = root.querySelector(`[data-space-id="${pair.left.id}"]`) as HTMLElement | null;
      const rightEl = root.querySelector(`[data-space-id="${pair.right.id}"]`) as HTMLElement | null;
      if (!leftEl || !rightEl) continue;

      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();

      let x: number, y: number;
      if (pair.orientation === "horizontal") {
        x = (lr.right + rr.left) / 2;
        y = Math.max(lr.top, rr.top) + (Math.min(lr.bottom, rr.bottom) - Math.max(lr.top, rr.top)) / 2;
      } else {
        x = Math.max(lr.left, rr.left) + (Math.min(lr.right, rr.right) - Math.max(lr.left, rr.left)) / 2;
        y = (lr.bottom + rr.top) / 2;
      }
      positions.push({ pair, x, y });
    }
    setConnectionPositions(positions);
  }

  onMount(() => {
    // Double-rAF to wait for layout to settle
    requestAnimationFrame(() => requestAnimationFrame(() => computeConnectionPositions()));
  });

  createEffect(() => {
    props.layout; // re-run on layout change
    requestAnimationFrame(() => computeConnectionPositions());
  });

  function getAllPipes(layout: SpaceLayout): Pipe[] {
    const pipes = [...layout.pipes];
    function collect(items: SpaceItem[]) {
      for (const item of items) {
        if (item.content.type === "group") {
          pipes.push(...item.content.pipes);
          collect(item.content.children);
        }
      }
    }
    collect(layout.items);
    return pipes;
  }

  function findPipeForPair(from: string, to: string): Pipe | undefined {
    return getAllPipes(props.layout).find(
      (p) => (p.from === from && p.to === to) || (p.from === to && p.to === from)
    );
  }

  function handleAddPipe(from: SpaceItem, to: SpaceItem) {
    props.onUpdateLayout((prev) => ({
      ...prev,
      pipes: [...prev.pipes, { id: `pipe-${Date.now()}`, from: from.id, to: to.id, transforms: [] }],
    }));
  }

  function handleAddSpaceClick(e: MouseEvent) {
    const root = document.getElementById("space-root");
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const cellW = rect.width / props.gridDims.cols;
    const cellH = rect.height / props.gridDims.rows;
    const col = Math.floor((e.clientX - rect.left) / cellW);
    const row = Math.floor((e.clientY - rect.top) / cellH);

    // Clamp popover position to stay within viewport
    const screenX = Math.min(e.clientX, window.innerWidth - 220);
    const screenY = Math.min(e.clientY, window.innerHeight - 120);
    setAddPicker({ col, row, screenX, screenY });
  }

  function handleAddSpace(col: number, row: number, type: "view" | "preview") {
    props.onUpdateLayout((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `space-${Date.now()}`,
          col: Math.min(col, props.gridDims.cols - 4),
          row: Math.min(row, props.gridDims.rows - 4),
          cols: 4,
          rows: 4,
          content: type === "preview" ? { type: "preview" as const } : { type: "view" as const },
        },
      ],
    }));
    setAddPicker(null);
  }

  return (
    <div class="edit-overlay">
      {/* Top bar: Done + Reset */}
      <div class="edit-top-bar">
        <button class="edit-reset-btn" onClick={props.onReset}>
          Reset Layout
        </button>
        <button class="edit-done-btn" onClick={props.onDone}>
          Done
        </button>
      </div>

      {/* Pipe connection points */}
      <For each={connectionPositions()}>
        {(conn) => {
          const existingPipe = () => findPipeForPair(conn.pair.left.id, conn.pair.right.id);
          return (
            <Show
              when={existingPipe()}
              fallback={
                <button
                  class="pipe-connection-point"
                  style={{ left: `${conn.x - 12}px`, top: `${conn.y - 12}px` }}
                  onClick={() => handleAddPipe(conn.pair.left, conn.pair.right)}
                  title="Add pipe"
                >
                  +
                </button>
              }
            >
              {(pipe) => (
                <button
                  class="pipe-indicator"
                  style={{ left: `${conn.x - 20}px`, top: `${conn.y - 12}px` }}
                  onClick={(e) =>
                    setPipeEditor({ pipe: pipe(), screenX: e.clientX, screenY: e.clientY })
                  }
                >
                  {pipe().transforms.length > 0
                    ? pipe().transforms.map((t) => t.type).join(" → ")
                    : "→"}
                </button>
              )}
            </Show>
          );
        }}
      </For>

      {/* Add space button */}
      <button
        class="add-space-btn"
        style={{ bottom: "20px", right: "20px" }}
        onClick={handleAddSpaceClick}
        title="Add a new space"
      >
        +
      </button>

      {/* Add space picker popover */}
      <Show when={addPicker()}>
        {(picker) => (
          <>
            <div class="edit-backdrop" onClick={() => setAddPicker(null)} />
            <div
              class="add-space-picker"
              style={{ left: `${picker().screenX}px`, top: `${picker().screenY}px` }}
            >
              <button
                class="add-space-picker-item"
                onClick={() => handleAddSpace(picker().col, picker().row, "view")}
              >
                View (tool + document)
              </button>
              <button
                class="add-space-picker-item"
                onClick={() => handleAddSpace(picker().col, picker().row, "preview")}
              >
                Preview (pipe target)
              </button>
            </div>
          </>
        )}
      </Show>

      {/* Pipe editor popover */}
      <Show when={pipeEditor()}>
        {(editor) => (
          <>
            <div class="edit-backdrop" onClick={() => setPipeEditor(null)} />
            <PipeEditorPopover
              pipe={editor().pipe}
              screenX={Math.min(editor().screenX, window.innerWidth - 280)}
              screenY={Math.min(editor().screenY, window.innerHeight - 300)}
              onUpdate={(updatedPipe) => {
                props.onUpdateLayout((prev) => ({
                  ...prev,
                  pipes: prev.pipes.map((p) => (p.id === updatedPipe.id ? updatedPipe : p)),
                }));
                setPipeEditor((prev) => (prev ? { ...prev, pipe: updatedPipe } : null));
              }}
              onDelete={(pipeId) => {
                props.onUpdateLayout((prev) => ({
                  ...prev,
                  pipes: prev.pipes.filter((p) => p.id !== pipeId),
                }));
                setPipeEditor(null);
              }}
              onClose={() => setPipeEditor(null)}
            />
          </>
        )}
      </Show>
    </div>
  );
}
