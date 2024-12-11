import { makeTool } from "@patchwork/sdk";
import { AmbPoker } from "./components/AmbPoker";

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambPoker",
  name: "Amb Poker",
  supportedDataTypes: ["ambPoker"],
  EditorComponent: AmbPoker,
});
