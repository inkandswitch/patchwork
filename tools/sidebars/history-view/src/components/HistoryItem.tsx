import { Show } from "solid-js";
import type { ChangeMetadata } from "@automerge/automerge";
import { formatTime } from "../utils/formatTime";
import { TimelineCard } from "./TimelineCard";
import { CopyHashButton } from "./CopyHashButton";

export interface HistoryItemProps {
  hash: string;
  metadata?: ChangeMetadata;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Component to display a single history change
 */
export function HistoryItem(props: HistoryItemProps) {
  const author = () => props.metadata?.actor || "Unknown";
  const timeDisplay = () => formatTime(props.metadata?.time);

  return (
    <TimelineCard isSelected={props.isSelected} onClick={props.onClick}>
      {/* Top row: Author and Hash */}
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <Show when={author()}>
            <div class="text-[11px] font-medium text-base-content/50 uppercase tracking-wide mb-0.5">
              Author
            </div>
            <div class="text-sm text-base-content truncate">{author()}</div>
          </Show>
        </div>
        <CopyHashButton hash={props.hash} />
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
    </TimelineCard>
  );
}
