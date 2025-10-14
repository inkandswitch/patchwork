import { Plugin } from "@patchwork/plugins";
import { plugins as markdownPlugins } from "./markdown";
import { plugins as patchworkFramePlugins } from "./patchwork-frame";
import { plugins as sidebarPlugins } from "./sidebar";
import { plugins as funkySidebarPlugins } from "./funky-sidebar";
import { plugins as tabViewerPlugins } from "./tab-view";
import { plugins as singleViewPlugins } from "./single-view";
import { plugins as branchViewPlugins } from "./history-view";
import { plugins as todoPlugins } from "./todo";
import { plugins as historyViewPlugins } from "./history-view";

export const plugins: Plugin<any>[] = [
  ...markdownPlugins,
  ...patchworkFramePlugins,
  ...sidebarPlugins,
  ...funkySidebarPlugins,
  ...tabViewerPlugins,
  ...singleViewPlugins,
  ...branchViewPlugins,
  ...todoPlugins,
  ...historyViewPlugins,
];
