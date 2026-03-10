import { Show } from "solid-js";
import type { HistoryGroup } from "../../types";
import { formatTime } from "../utils";
import { TimelineCard } from "./TimelineCard";
import { CopyHashButton } from "./CopyHashButton";
import { LabeledField } from "./LabeledField";

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
          <LabeledField label={authorCount() === 1 ? "Author" : "Authors"}>
            <span class="truncate">{authors()}</span>
          </LabeledField>
        </div>
        <CopyHashButton hash={latestHash()} />
      </div>

      {/* Time section */}
      <Show when={timeDisplay()}>
        <LabeledField label="Time">{timeDisplay()}</LabeledField>
      </Show>

      {/* Stats section */}
      <LabeledField label="Stats">
        {changeCount()} {changeCount() === 1 ? "change" : "changes"}
      </LabeledField>
    </TimelineCard>
  );
}
