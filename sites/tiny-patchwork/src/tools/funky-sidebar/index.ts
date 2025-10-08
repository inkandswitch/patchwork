import { Plugin } from "@patchwork/plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "funky-sidebar",
    name: "Funky Sidebar",
    icon: "Sidebar",
    supportedDataTypes: ["folder"],
    async load() {
      const { renderSidebar } = await import("./FunkySidebar");
      return { render: renderSidebar };
    },
  },
];
