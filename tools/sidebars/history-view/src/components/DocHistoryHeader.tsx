export interface DocHistoryHeaderProps {
  title: string;
  hasSelection: boolean;
  onReset: () => void;
}

/**
 * Header component showing document title and reset button
 */
export function DocHistoryHeader(props: DocHistoryHeaderProps) {
  return (
    <div class="p-2 flex justify-between items-center">
      <div class="font-medium">{props.title}</div>

      <button
        class={`btn btn-sm btn-ghost ${props.hasSelection ? "" : "invisible"}`}
        onClick={props.onReset}
      >
        Reset to now
      </button>
    </div>
  );
}
