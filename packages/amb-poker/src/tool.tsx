import { makeTool } from "@patchwork/sdk";
import { AmbPoker } from "./components/AmbPoker";

export const tool = makeTool({
  EditorComponent: AmbPoker,
});
