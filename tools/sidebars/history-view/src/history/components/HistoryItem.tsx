import { Show } from "solid-js";
import { formatTime } from "../utils";
import { TimelineCard } from "./TimelineCard";
import { CopyHashButton } from "./CopyHashButton";
import { LabeledField } from "./LabeledField";

export interface HistoryItemProps {
  hash: string;
  actor: string;
  time: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Component to display a single history change
 */
export function HistoryItem(props: HistoryItemProps) {
  const author = () => props.actor || "Unknown";
  const timeDisplay = () => formatTime(props.time);

  return (
    <TimelineCard isSelected={props.isSelected} onClick={props.onClick}>
      {/* Top row: Author and Hash */}
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <Show when={author()}>
            <LabeledField label="Author">
              <span>{author()}</span>
            </LabeledField>
          </Show>
        </div>
        <CopyHashButton hash={props.hash} />
      </div>

      {/* Time section */}
      <Show when={timeDisplay()}>
        <LabeledField label="Time">{timeDisplay()}</LabeledField>
      </Show>
    </TimelineCard>
  );
}
