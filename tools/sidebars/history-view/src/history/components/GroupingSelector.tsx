import { Show } from "solid-js";
import type { GroupingStrategyConfig, StrategyName } from "../../types";
import { TIME_WINDOW_OPTIONS, DEFAULT_TIME_WINDOW } from "../utils";

export interface GroupingSelectorProps {
  selectedConfig: GroupingStrategyConfig;
  onConfigChange: (config: GroupingStrategyConfig) => void;
}

const TIME_WINDOW_LABELS: Record<keyof typeof TIME_WINDOW_OPTIONS, string> = {
  "30m": "30 minutes",
  "4h": "4 hours",
  "1d": "1 day",
  "1w": "1 week",
};

/**
 * Component to select the history grouping strategy and time window.
 * First dropdown: strategy name. Second dropdown: time window (only for timeWindow strategy).
 */
export function GroupingSelector(props: GroupingSelectorProps) {
  const handleStrategyChange = (strategyName: string) => {
    if (strategyName === "author") {
      props.onConfigChange({ name: "author" });
    } else {
      // Keep existing time window when switching to timeWindow strategy
      const windowMs =
        props.selectedConfig.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
      props.onConfigChange({
        name: "timeWindow",
        params: { timeWindow: windowMs },
      });
    }
  };

  const handleTimeWindowChange = (key: string) => {
    const windowMs =
      TIME_WINDOW_OPTIONS[key as keyof typeof TIME_WINDOW_OPTIONS] ??
      DEFAULT_TIME_WINDOW;
    props.onConfigChange({
      name: "timeWindow",
      params: { timeWindow: windowMs },
    });
  };

  const currentTimeWindowKey = () => {
    const windowMs =
      props.selectedConfig.params?.timeWindow ?? DEFAULT_TIME_WINDOW;
    const key = Object.entries(TIME_WINDOW_OPTIONS).find(
      ([, ms]) => ms === windowMs
    )?.[0];
    return key ?? "30m";
  };

  return (
    <div class="flex gap-2">
      <select
        class="select select-sm select-bordered flex-1"
        value={props.selectedConfig.name}
        onChange={(e) =>
          handleStrategyChange(e.currentTarget.value as StrategyName)
        }
      >
        <option value="timeWindow">Group by time</option>
        {/* TODO: enable author strategy */}
        {/* <option value="author">Group by author</option> */}
      </select>
      <Show when={props.selectedConfig.name === "timeWindow"}>
        <select
          class="select select-sm select-bordered flex-1"
          value={currentTimeWindowKey()}
          onChange={(e) => handleTimeWindowChange(e.currentTarget.value)}
        >
          {Object.entries(TIME_WINDOW_LABELS).map(([key, label]) => (
            <option value={key}>{label}</option>
          ))}
        </select>
      </Show>
    </div>
  );
}
