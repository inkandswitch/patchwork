import type { Plugin, ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { render } from "solid-js/web";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "space-frame",
    category: "frame",
    name: "Space Frame",
    icon: "LayoutGrid",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation<any>> {
      const { SpaceFrame } = await import("./SpaceFrame");
      return (handle, element) => {
        return render(
          () => (
            <SpaceFrame
              handle={handle}
              element={element}
              repo={element.repo}
            />
          ),
          element
        );
      };
    },
  },
];
