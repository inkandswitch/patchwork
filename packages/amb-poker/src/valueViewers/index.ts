// This is basically a fork of the ValueViewer interface from original ambsheet.
// Maybe we'll reconcile later.

import { Scenario, Value } from "../model";
import { barChartViewer } from "./barChartViewer";
import { cardViewer } from "./cardViewer";
import { tableViewer } from "./tableViewer";
import { histogramViewer } from "./histogramViewer";
import { singleValueViewer } from "./singleValueViewer";
import { dateViewer } from "./dateViewer";

export type ValueViewerProps = {
  scenarios: Scenario[];
  cellToDisplay: string;
  filters: string[];
};

type ShouldRenderPriority = "high" | "normal" | "hide";

export type ValueViewer = {
  name: string;
  shouldRender: (props: ValueViewerProps) => ShouldRenderPriority;
  component: React.FC<ValueViewerProps>;
};

export const valueViewers: ValueViewer[] = [
  cardViewer,
  singleValueViewer,
  dateViewer,
  tableViewer,
  barChartViewer,
  histogramViewer,
];
