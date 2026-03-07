import type {
  Plugin,
  ToolImplementation,
} from "@inkandswitch/patchwork-plugins";
import type { TransformImplementation } from "./transforms";

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
  {
    type: "patchwork:transform",
    id: "passthrough",
    name: "Passthrough",
    async load(): Promise<TransformImplementation> {
      return {
        run(input: any): any {
          if (typeof input === "string") return input;
          if (input?.content && typeof input.content === "string")
            return input.content;
          return JSON.stringify(input, null, 2);
        },
      };
    },
  },
];
