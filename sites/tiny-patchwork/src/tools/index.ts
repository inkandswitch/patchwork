import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
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
