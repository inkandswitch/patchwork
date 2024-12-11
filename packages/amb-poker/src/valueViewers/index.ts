// This is basically a fork of the ValueViewer interface from original ambsheet.
// Maybe we'll reconcile later.

import { Value } from "../model";
import { barChartViewer } from "./barChartViewer";

type FilteredValue = { value: Value; include: boolean };

type ShouldRenderPriority = "high" | "normal" | "hide";

export type ValueViewer = {
  name: string;
  shouldRender: (values: FilteredValue[]) => ShouldRenderPriority;
  component: React.FC<{ values: FilteredValue[] }>;
};

export const valueViewers: ValueViewer[] = [barChartViewer];
