import { Plugin } from "@inkandswitch/patchwork-plugins";
// @ts-expect-error no types
import { plugins as backLinkButtonPlugins } from "@tiny-patchwork/back-link-button";
// @ts-expect-error no types
import { plugins as documentTitlePlugins } from "@tiny-patchwork/doc-title";

// @ts-expect-error no types
import { plugins as sideboardPlugins } from "@chee/patchwork-sideboard";
import "@chee/patchwork-sideboard/styles.css";
// @ts-expect-error no types
import { plugins as spacerPlugins } from "@tiny-patchwork/spacer";

// @ts-expect-error no types
import { plugins as frameConfiguratorPlugins } from "@tiny-patchwork/frame-configurator";
// @ts-expect-error no types
import { plugins as orionMarkwhen } from "@orion/markwhen";
// @ts-expect-error no types
import { plugins as codemirrorBasePlugins } from "@grjte/codemirror-base";
// @ts-expect-error no types
import { plugins as codemirrorEmbedPlugins } from "@grjte/codemirror-embed";
// @ts-expect-error no types
import { plugins as codemirrorMarkdownPlugins } from "@grjte/codemirror-markdown";
// @ts-expect-error no types
import { plugins as syncIndicatorPlugins } from "@tiny-patchwork/sync-indicator";
// @ts-expect-error no types
import { plugins as commandsPlugins } from "@orion/commands";

// @ts-expect-error no types
import { plugins as addDocToSidebarButtonPlugins } from "@tiny-patchwork/add-doc-to-sidebar-button";

// @ts-expect-error no types
import { plugins as contactPlugins } from "@patchwork/contact";
import "@patchwork/contact/style.css";
// @ts-expect-error no types
import { plugins as accountPickerPlugins } from "@patchwork/account-picker";
import "@patchwork/account-picker/style.css";

export const plugins: Plugin<any>[] = [
  ...commandsPlugins,
  ...sideboardPlugins,
  ...backLinkButtonPlugins,
  ...documentTitlePlugins,
  ...spacerPlugins,

  ...frameConfiguratorPlugins,
  ...orionMarkwhen,
  ...syncIndicatorPlugins,
  ...codemirrorBasePlugins,
  ...codemirrorMarkdownPlugins,
  ...codemirrorEmbedPlugins,
  ...addDocToSidebarButtonPlugins,
  ...contactPlugins,
  ...accountPickerPlugins,
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
