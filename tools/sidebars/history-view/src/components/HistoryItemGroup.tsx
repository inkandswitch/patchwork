import { Show } from "solid-js";
import type { HistoryGroup } from "../types";
import { formatTime } from "../utils/formatTime";
import { TimelineCard } from "./TimelineCard";
import { CopyHashButton } from "./CopyHashButton";

export interface HistoryItemGroupProps {
  group: HistoryGroup;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Component to display a group of related history changes.
 * Shows aggregate information about the group.
 */
export function HistoryItemGroup(props: HistoryItemGroupProps) {
  const changeCount = () => props.group.changes.length;

  const latestHash = () => props.group.changes[0]?.hash ?? "";

  const uniqueAuthors = () => {
    const seen: string[] = [];
    for (const c of props.group.changes) {
      const actor = c.metadata?.actor;
      if (actor && !seen.includes(actor)) seen.push(actor);
    }
    return seen;
  };

  const authors = () => uniqueAuthors().join(", ") || "Unknown";
  const authorCount = () => uniqueAuthors().length;
  const timeDisplay = () => formatTime(props.group.endTime);

  return (
    <TimelineCard isSelected={props.isSelected} onClick={props.onClick}>
      {/* Top row: Authors and Hash */}
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <div class="text-[11px] font-medium text-base-content/50 uppercase tracking-wide mb-0.5">
            {authorCount() === 1 ? "Author" : "Authors"}
          </div>
          <div class="text-sm text-base-content truncate">{authors()}</div>
        </div>
        <CopyHashButton hash={latestHash()} />
      </div>

      {/* Time section */}
      <Show when={timeDisplay()}>
        <div class="mb-2">
          <div class="text-[11px] font-medium text-base-content/50 uppercase tracking-wide mb-0.5">
            Time
          </div>
          <div class="text-sm text-base-content">{timeDisplay()}</div>
        </div>
      </Show>

      {/* Stats section */}
      <div class="mb-2">
        <div class="text-[11px] font-medium text-base-content/50 uppercase tracking-wide mb-0.5">
          Stats
        </div>
        <div class="text-sm text-base-content">
          {changeCount()} {changeCount() === 1 ? "change" : "changes"}
        </div>
      </div>
    </TimelineCard>
  );
}
