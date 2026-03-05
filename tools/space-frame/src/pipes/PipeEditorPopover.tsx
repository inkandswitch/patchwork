import { createSignal, For, Show } from "solid-js";
import type { Pipe, TransformStep } from "../layout/types";
import { getAvailableTransforms } from "./transforms/registry";

type Props = {
  pipe: Pipe;
  screenX: number;
  screenY: number;
  onUpdate: (pipe: Pipe) => void;
  onDelete: (pipeId: string) => void;
  onClose: () => void;
};

export function PipeEditorPopover(props: Props) {
  const [showTransformPicker, setShowTransformPicker] = createSignal(false);
  const available = getAvailableTransforms();

  function addTransform(type: string) {
    const step: TransformStep = {
      id: `step-${Date.now()}`,
      type,
    };
    props.onUpdate({
      ...props.pipe,
      transforms: [...props.pipe.transforms, step],
    });
    setShowTransformPicker(false);
  }

  function removeTransform(stepId: string) {
    props.onUpdate({
      ...props.pipe,
      transforms: props.pipe.transforms.filter((t) => t.id !== stepId),
    });
  }

  function flipDirection() {
    props.onUpdate({
      ...props.pipe,
      from: props.pipe.to,
      to: props.pipe.from,
    });
  }

  // Clamp position to viewport
  const left = () => Math.min(props.screenX, window.innerWidth - 280);
  const top = () => Math.min(props.screenY, window.innerHeight - 300);

  return (
    <div
      class="pipe-editor"
      style={{ left: `${left()}px`, top: `${top()}px` }}
    >
      <div class="pipe-editor-header">
        <span>
          {props.pipe.from} → {props.pipe.to}
        </span>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            "font-size": "16px",
            color: "#999",
          }}
          onClick={props.onClose}
        >
          x
        </button>
      </div>

      <div class="pipe-editor-body">
        <Show
          when={props.pipe.transforms.length > 0}
          fallback={
            <div
              style={{
                padding: "12px",
                "text-align": "center",
                color: "#999",
                "font-size": "13px",
              }}
            >
              No transforms — data passes through unchanged
            </div>
          }
        >
          <For each={props.pipe.transforms}>
            {(step) => (
              <div class="pipe-editor-transform">
                <span>{step.type}</span>
                <button
                  class="pipe-editor-transform-remove"
                  onClick={() => removeTransform(step.id)}
                >
                  x
                </button>
              </div>
            )}
          </For>
        </Show>

        <Show
          when={showTransformPicker()}
          fallback={
            <button
              class="pipe-editor-add-btn"
              onClick={() => setShowTransformPicker(true)}
            >
              + Add transform
            </button>
          }
        >
          <div style={{ "margin-top": "4px" }}>
            <For each={available}>
              {(t) => (
                <button
                  class="add-space-picker-item"
                  onClick={() => addTransform(t.type)}
                >
                  {t.name}
                </button>
              )}
            </For>
            <button
              class="add-space-picker-item"
              style={{ color: "#999" }}
              onClick={() => setShowTransformPicker(false)}
            >
              Cancel
            </button>
          </div>
        </Show>
      </div>

      <div class="pipe-editor-actions">
        <button class="pipe-editor-action-btn" onClick={flipDirection}>
          Flip direction
        </button>
        <button
          class="pipe-editor-action-btn pipe-editor-action-btn--danger"
          onClick={() => props.onDelete(props.pipe.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
