import { createContext } from "react";
import { DataType } from "./sdk";
import { Tool } from "./tools";

// don't export any hooks from here, otherwise hot reloading doesn't work properly

export interface PatchworkContext {
  builtInTools: Tool[];
  builtInDataTypes: DataType[];
}

export const PatchworkContext = createContext<PatchworkContext>({
  builtInTools: [],
  builtInDataTypes: [],
});
