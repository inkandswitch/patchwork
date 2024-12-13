import { Position, RawValue } from "../datatype";
import { FilteredValue, Env } from "../eval";
import { choiceDependenciesViewer } from "./ChoiceDependencies";
import { chartViewer } from "./LineChart";
import { histogramViewer } from "./ResultHistogram";
import { shadesViewer } from "./Shades";
import { stacksViewer } from "./Stacks";
import { tableViewer } from "./TableViewer";

export type ValueViewerProps = {
  values: FilteredValue[];
  sheet: Env;
  selectedCells?: Position[];
  setFilterSelection: (selectedValues: RawValue[] | null) => void;
};
export type ValueViewer = {
  name: string;
  shouldRender: (values: FilteredValue[], sheet: Env) => ShouldRenderPriority;
  component: React.FC<ValueViewerProps>;
};
export type ShouldRenderPriority = "high" | "normal" | "hide";
export const valueViewers: ValueViewer[] = [
  choiceDependenciesViewer,
  histogramViewer,
  tableViewer,
  stacksViewer,
  shadesViewer,
  chartViewer,
];
