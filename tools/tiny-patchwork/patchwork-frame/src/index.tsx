import { Plugin, ToolImplementation } from "@inkandswitch/patchwork-plugins";
import { render } from "solid-js/web";
import type { TinyPatchworkConfigDoc } from "./types";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "patchwork-frame",
    tags: ["frame-tool"],
    name: "Patchwork Frame",
    icon: "Window",
    supportedDatatypes: ["account"],
    async load(): Promise<ToolImplementation<TinyPatchworkConfigDoc>> {
      const { PatchworkFrame } = await import("./PatchworkFrame");
      return (handle, element) => {
        return render(
          () => (
            <PatchworkFrame
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
