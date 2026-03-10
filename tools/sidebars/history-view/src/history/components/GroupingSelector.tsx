import type { GroupingStrategyConfig } from "../../types";
import { DEFAULT_TIME_WINDOW } from "../utils";

export interface GroupingSelectorProps {
  selectedConfig: GroupingStrategyConfig;
  onConfigChange: (config: GroupingStrategyConfig) => void;
}

/**
 * Component to select the history grouping strategy
 */
export function GroupingSelector(props: GroupingSelectorProps) {
  const handleStrategyChange = (strategyName: string) => {
    if (strategyName === "author") {
      props.onConfigChange({ name: "author" });
    } else if (strategyName === "timeWindow") {
      props.onConfigChange({
        name: "timeWindow",
        params: { timeWindow: DEFAULT_TIME_WINDOW },
      });
    }
  };

  return (
    <div class="flex gap-2">
      <select
        class="select select-sm select-bordered flex-1"
        value={props.selectedConfig.name}
        onChange={(e) => handleStrategyChange(e.currentTarget.value)}
      >
        <option value="timeWindow">Group by time</option>
        <option value="author">Group by author</option>
      </select>
    </div>
  );
}
