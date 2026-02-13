import type { JSXElement } from "solid-js";

export interface TimelineCardProps {
  isSelected: boolean;
  onClick: () => void;
  children: JSXElement;
}

/**
 * Card wrapper providing timeline dot, connecting line,
 * selected/unselected styling, and accessibility attributes.
 */
export function TimelineCard(props: TimelineCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={props.isSelected}
      onClick={props.onClick}
      class={
        "relative text-xs p-3 pl-6 rounded border cursor-pointer " +
        (props.isSelected
          ? "bg-primary border-primary-content"
          : "bg-base-50 border-base-200 hover:bg-base-100")
      }
    >
      {/* Timeline dot */}
      <div class="absolute left-2 top-4 w-2 h-2 rounded-full bg-primary"></div>

      {/* Timeline line */}
      <div class="absolute left-2.5 top-6 bottom-0 w-0.5 bg-base-300 opacity-30 timeline-line"></div>

      {props.children}
    </div>
  );
}
