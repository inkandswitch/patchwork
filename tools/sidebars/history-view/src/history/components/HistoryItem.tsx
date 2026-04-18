import { Show } from "solid-js";
import type { HistoryItem as HistoryItemType } from "../../types";
import { formatTime } from "../utils";
import { TimelineCard } from "./TimelineCard";
import { CopyHashButton } from "./CopyHashButton";
import { LabeledField } from "./LabeledField";

export interface HistoryItemProps {
  item: HistoryItemType;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Renders a single entry in the timeline — either a lone change or a grouped
 * run of changes. The two are the same shape: a lone change is just an item
 * with `count === 1`, and the stats row is hidden in that case.
 */
export function HistoryItem(props: HistoryItemProps) {
  const changeCount = () => props.item.count;
  const latestHash = () => props.item.latestHash;
  const authors = () => props.item.authors.join(", ") || "Unknown";
  const authorCount = () => props.item.authors.length;
  const timeDisplay = () => formatTime(props.item.endTime);

  return (
    <TimelineCard isSelected={props.isSelected} onClick={props.onClick}>
      <div class="flex justify-between items-start mb-2">
        <div class="flex-1 min-w-0">
          <LabeledField label={authorCount() === 1 ? "Author" : "Authors"}>
            <span>{authors()}</span>
          </LabeledField>
        </div>
        <CopyHashButton hash={latestHash()} />
      </div>

      <Show when={timeDisplay()}>
        <LabeledField label="Time">{timeDisplay()}</LabeledField>
      </Show>

      <Show when={changeCount() > 1}>
        <LabeledField label="Stats">{changeCount()} changes</LabeledField>
      </Show>
    </TimelineCard>
  );
}
