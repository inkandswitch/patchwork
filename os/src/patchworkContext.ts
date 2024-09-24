import { createContext, useContext, useMemo } from "react";
import { isTool, Tool } from "./tools";
import { DataType } from "./datatypes";
import { usePackageModulesInRootFolder } from "@/packages/pkg/usePackages";

export interface PatchworkContext {
  builtInTools: Tool[];
  builtInDataTypes: DataType[];
}

export const PatchworkContext = createContext<PatchworkContext>({
  builtInTools: [],
  builtInDataTypes: [],
});

export const useTools = (): Tool[] => {
  const { builtInTools } = useContext(PatchworkContext);
  const modules = usePackageModulesInRootFolder();

  // add exported tools in packages to tools
  const dynamicTools = useMemo(
    () =>
      Object.values(modules).flatMap(({ module }) =>
        Object.values(module).flatMap((tool) => {
          console.log(tool);
          return isTool(tool) ? [{ ...tool }] : [];
        })
      ),
    [modules]
  );

  const tools = useMemo(
    () => builtInTools.concat(dynamicTools),
    [builtInTools, dynamicTools]
  );

  return tools;
};

export const useDataTypes = (): DataType[] => {
  const { builtInDataTypes } = useContext(PatchworkContext);
  return builtInDataTypes;
};
