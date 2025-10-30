import { Plugin } from "@patchwork/plugins";
import { plugins as markdownPlugins } from "./markdown";
import { plugins as patchworkFramePlugins } from "./patchwork-frame";
import { plugins as sidebarPlugins } from "./sidebar";
import { plugins as funkySidebarPlugins } from "./funky-sidebar";
import { plugins as tabViewerPlugins } from "./tabbed-view";
import { plugins as singleViewPlugins } from "./single-view";
import { plugins as branchViewPlugins } from "./history-view";
import { plugins as todoPlugins } from "./todo";
import { plugins as historyViewPlugins } from "./history-view";
import { plugins as commentsViewPlugins } from "./comments-view";
import { plugins as contextViewPlugins } from "./context-view";
// @ts-expect-error no types
import { plugins as tldrawPlugins } from "@patchwork/tldraw";
import "tldraw/tldraw.css";
// @ts-expect-error no types
import { plugins as sideboardPlugins } from "@chee/patchwork-sideboard";
import "@chee/patchwork-sideboard/styles.css";
// @ts-expect-error no types
import { plugins as orionMarkwhen } from "@orion/markwhen";

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
  ...commentsViewPlugins,
  ...sideboardPlugins,
  ...tldrawPlugins,
  ...contextViewPlugins,
  ...orionMarkwhen,
];
