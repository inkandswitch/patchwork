import { Plugin } from "@patchwork/plugins";
// @ts-expect-error no types
import { plugins as patchworkFramePlugins } from "@tiny-patchwork/patchwork-frame";
// @ts-expect-error no types
import { plugins as tabViewerPlugins } from "@tiny-patchwork/context-sidebar";
// @ts-expect-error no types
import { plugins as branchViewPlugins } from "@tiny-patchwork/history-view";
// @ts-expect-error no types
import { plugins as todoPlugins } from "@tiny-patchwork/todo";
// @ts-expect-error no types
import { plugins as historyViewPlugins } from "@tiny-patchwork/history-view";
// @ts-expect-error no types
import { plugins as commentsViewPlugins } from "@tiny-patchwork/comments-view";
// @ts-expect-error no types
import { plugins as contextViewPlugins } from "@tiny-patchwork/context-view";
// @ts-expect-error no types
import { plugins as backLinkButtonPlugins } from "@tiny-patchwork/back-link-button";
// @ts-expect-error no types
import { plugins as documentTitlePlugins } from "@tiny-patchwork/doc-title";
// @ts-expect-error no types
import { plugins as tldrawPlugins } from "@patchwork/tldraw";
import "@patchwork/tldraw/style";

// @ts-expect-error no types
import { plugins as sideboardPlugins } from "@chee/patchwork-sideboard";
import "@chee/patchwork-sideboard/styles.css";
// @ts-expect-error no types
import { plugins as spacerPlugins } from "@tiny-patchwork/spacer";
// @ts-expect-error no types
import { plugins as highlightChangesCheckboxPlugins } from "@tiny-patchwork/highlight-changes-checkbox";
// @ts-expect-error no types
import { plugins as frameConfiguratorPlugins } from "@tiny-patchwork/frame-configurator";
// @ts-expect-error no types
import { plugins as orionMarkwhen } from "@orion/markwhen";
// @ts-expect-error no types
import { plugins as codemirrorBasePlugins } from "@grjte/codemirror-base";
// @ts-expect-error no types
import { plugins as codemirrorMarkdownPlugins } from "@grjte/codemirror-markdown";
// @ts-expect-error no types
import { plugins as markdownLinksPlugins } from "@grjte/codemirror-md-links";
// @ts-expect-error no types
import { plugins as syncIndicatorPlugins } from "@tiny-patchwork/sync-indicator";
// @ts-expect-error no types
import { plugins as commandsPlugins } from "@orion/commands";

export const plugins: Plugin<any>[] = [
  ...commandsPlugins,
  ...patchworkFramePlugins,
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
  ...syncIndicatorPlugins,
  ...codemirrorBasePlugins,
  ...codemirrorMarkdownPlugins,
  ...markdownLinksPlugins,
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
