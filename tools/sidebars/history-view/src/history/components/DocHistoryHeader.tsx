import { Show } from "solid-js";

export interface DocHistoryHeaderProps {
  /**
   * Document title to display. When omitted, only the reset button is
   * rendered (right-aligned via flex layout). Used when the surrounding UI
   * already shows the title — e.g. a single-doc sidebar.
   */
  title?: string;
  hasSelection: boolean;
  onReset: () => void;
}

/**
 * Header component showing the (optional) document title and a reset button.
 */
export function DocHistoryHeader(props: DocHistoryHeaderProps) {
  return (
    <div class="p-2 flex justify-between items-center">
      <Show when={props.title !== undefined} fallback={<div />}>
        <div class="font-medium">{props.title}</div>
      </Show>

      <button
        class={`btn btn-sm btn-ghost ${props.hasSelection ? "" : "invisible"}`}
        onClick={props.onReset}
      >
        Reset to now
      </button>
    </div>
  );
}
