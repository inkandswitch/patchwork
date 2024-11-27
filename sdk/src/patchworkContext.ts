import { createContext } from "react";
import { DataType } from "@patchwork/sdk";
import { Tool } from "@patchwork/sdk";

// don't export any hooks from here, otherwise hot reloading doesn't work properly

export interface PatchworkContext {
  builtInTools: Tool[];
  builtInDataTypes: DataType[];
}

export const PatchworkContext = createContext<PatchworkContext>({
  builtInTools: [],
  builtInDataTypes: [],
});
