import { createRoot } from "react-dom/client";
import type { ToolImplementation } from "@patchwork/plugins";
import { dataType as datatype } from "./datatype.ts";
import { RepoContext } from "@automerge/react";
import "./main.css";

export const plugins = [
  {
    type: "patchwork:datatype",
    id: "tldraw2",
    name: "Drawing2",
    icon: "PenLine",
    async load() {
      return datatype;
    },
  },
  {
    type: "patchwork:tool",
    id: "tldraw2",
    name: "Drawing2",
    supportedDataTypes: ["tldraw2"],
    async load(): Promise<ToolImplementation> {
      const { TldrawTool } = await import("./tool.tsx");
      return (handle, element) => {
        const root = createRoot(element);
        root.render(
          <RepoContext.Provider value={element.repo}>
            <TldrawTool docUrl={handle.url} />
          </RepoContext.Provider>
        );
        return () => root.unmount();
      };
    },
  },
];
