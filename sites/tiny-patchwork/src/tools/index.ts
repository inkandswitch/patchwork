import { Plugin } from "@patchwork/plugins";
import { plugins as markdownPlugins } from "./markdown";

export const plugins: Plugin<any>[] = [
  ...markdownPlugins,
  {
    type: "patchwork:tool",
    id: "patchwork-frame",
    name: "Patchwork Frame",
    icon: "Window",
    supportedDataTypes: ["patchwork-frame"],
    async load() {
      const { renderFrame } = await import("./PatchworkFrame");
      return { render: renderFrame };
    },
  },
  {
    type: "patchwork:tool",
    id: "simple-sidebar",
    name: "Simple Sidebar",
    icon: "Sidebar",
    supportedDataTypes: ["folder"],
    async load() {
      const { renderSidebar } = await import("./Sidebar");
      return { render: renderSidebar };
    },
  },
];
