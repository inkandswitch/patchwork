import { Show } from "solid-js";
import type { GroupingStrategyConfig } from "../types";
import {
  DEFAULT_TIME_WINDOW,
  TIME_WINDOW_OPTIONS,
} from "../grouping/strategies";

export interface GroupingSelectorProps {
  selectedConfig: GroupingStrategyConfig;
  onConfigChange: (config: GroupingStrategyConfig) => void;
}

/**
 * Component to select the history grouping strategy and parameters
 */
export function GroupingSelector(props: GroupingSelectorProps) {
  const showTimeWindowOptions = () =>
    props.selectedConfig.name === "timeWindow";

  const handleStrategyChange = (strategyName: string) => {
    if (strategyName === "none") {
      props.onConfigChange({ name: "none" });
    } else if (strategyName === "author") {
      props.onConfigChange({ name: "author" });
    } else if (strategyName === "timeWindow") {
      props.onConfigChange({
        name: "timeWindow",
        params: { timeWindow: DEFAULT_TIME_WINDOW },
      });
    }
  };

  const handleTimeWindowChange = (windowMs: number) => {
    props.onConfigChange({
      name: "timeWindow",
      params: { timeWindow: windowMs },
    });
  };

  return (
    <div class="flex gap-2">
      <select
        class="select select-sm select-bordered flex-1"
        value={props.selectedConfig.name}
        onChange={(e) => handleStrategyChange(e.currentTarget.value)}
      >
        <option value="none">No grouping</option>
        <option value="timeWindow">Group by time</option>
        <option value="author">Group by author</option>
      </select>

      <Show when={showTimeWindowOptions()}>
        <select
          class="select select-sm select-bordered w-24"
          value={props.selectedConfig.params?.timeWindow ?? DEFAULT_TIME_WINDOW}
          onChange={(e) =>
            handleTimeWindowChange(Number(e.currentTarget.value))
          }
        >
          <option value={TIME_WINDOW_OPTIONS["30m"]}>30 min</option>
          <option value={TIME_WINDOW_OPTIONS["4h"]}>4 hrs</option>
          <option value={TIME_WINDOW_OPTIONS["1d"]}>1 day</option>
          <option value={TIME_WINDOW_OPTIONS["1w"]}>1 week</option>
        </select>
      </Show>
    </div>
  );
}
