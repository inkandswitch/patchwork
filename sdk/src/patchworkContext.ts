import { createContext } from "react";
import { DataType } from ".";
import { Tool } from ".";

// don't export any hooks from here, otherwise hot reloading doesn't work properly

export interface PatchworkContext {
  tools: Tool[];
  dataTypes: DataType[];
}

export const PatchworkContext = createContext<PatchworkContext>({
  tools: [],
  dataTypes: [],
});
