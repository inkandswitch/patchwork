import { PatchworkContext } from "@patchwork/sdk";
import { usePackageModulesInRootFolder } from "@patchwork/pkg/usePackages";
import { Tool, isTool } from "@patchwork/sdk";
import { useContext, useMemo } from "react";

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
