import type { Plugin, ToolImplementation } from "@inkandswitch/patchwork-plugins";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "space-frame",
    category: "frame",
    name: "Space Frame",
    icon: "LayoutGrid",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation<any>> {
      const { mountSpaceFrame } = await import("./space-frame");
      return (handle, element) => {
        return mountSpaceFrame(handle, element, element.repo);
      };
    },
  },
];
