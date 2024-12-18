import { makeTool } from "@patchwork/sdk";
import { AmbPoker } from "./components/AmbPoker";

import "./index.css";

export const tool = makeTool({
  EditorComponent: AmbPoker,
});
