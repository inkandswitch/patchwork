import { Plugin } from "@patchwork/plugins";
import { plugins as markdownPlugins } from "./markdown";
import { plugins as patchworkFramePlugins } from "./patchwork-frame";
import { plugins as sidebarPlugins } from "./sidebar";
import { plugins as funkySidebarPlugins } from "./funky-sidebar";
import { plugins as tabViewerPlugins } from "./context-sidebar";
import { plugins as branchViewPlugins } from "./history-view";
import { plugins as todoPlugins } from "./todo";
import { plugins as historyViewPlugins } from "./history-view";
import { plugins as commentsViewPlugins } from "./comments-view";
import { plugins as contextViewPlugins } from "./context-view";
import { plugins as backLinkButtonPlugins } from "./back-link-button";
import { plugins as documentTitlePlugins } from "./doc-title";
// @ts-expect-error no types
import { plugins as tldrawPlugins } from "@patchwork/tldraw";
import "tldraw/tldraw.css";
// @ts-expect-error no types
import { plugins as sideboardPlugins } from "@chee/patchwork-sideboard";
import "@chee/patchwork-sideboard/styles.css";
import { plugins as spacerPlugins } from "./spacer";
import { plugins as highlightChangesCheckboxPlugins } from "./highlight-changes-checkbox";
import { plugins as frameConfiguratorPlugins } from "./frame-configurator";
// @ts-expect-error no types
import { plugins as orionMarkwhen } from "@orion/markwhen";

export const plugins: Plugin<any>[] = [
  ...markdownPlugins,
  ...patchworkFramePlugins,
  ...sidebarPlugins,
  ...funkySidebarPlugins,
  ...tabViewerPlugins,
  ...branchViewPlugins,
  ...todoPlugins,
  ...historyViewPlugins,
  ...commentsViewPlugins,
  ...sideboardPlugins,
  ...tldrawPlugins,
  ...contextViewPlugins,
  ...backLinkButtonPlugins,
  ...documentTitlePlugins,
  ...spacerPlugins,
  ...highlightChangesCheckboxPlugins,
  ...frameConfiguratorPlugins,
  ...orionMarkwhen,
  {
    id: "folder",
    type: "patchwork:datatype",
    name: "Folder",
    async load() {
      return {
        init(doc: any) {
          doc.title = "New folder";
          doc.docs = [];
        },
        getTitle(doc: any) {
          return doc.title;
        },
        setTitle(doc: any, title: string) {
          doc.title = title;
        },
      };
    },
  },
];
