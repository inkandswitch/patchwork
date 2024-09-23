import { usePackageModulesInRootFolder } from "@/packages/pkg/usePackages";
import { useEffect, useMemo, useState } from "react";
import { DataType } from "./datatypes";
import * as PACKAGES from "./packages";
import { Tool } from "./tools";

const isTool = (value: any): value is Tool => {
  return "type" in value && value.type === "patchwork:tool";
};

export const useTools = (): Tool[] => {
  const [builtInTools, setBuiltInTools] = useState<Tool[]>([]);
  const [dynamicTools, setDynamicTools] = useState<Tool[]>([]);
  const modules = usePackageModulesInRootFolder();

  // add exported tools in packages to tools
  useEffect(() => {
    setDynamicTools(
      Object.values(modules).flatMap(({ module }) =>
        Object.values(module).flatMap((tool) => {
          console.log(tool);
          return isTool(tool) ? [{ ...tool }] : [];
        })
      )
    );
  }, [modules]);

  // load packages asynchronously to break the dependency loop tools -> packages -> tools
  useEffect(() => {
    setBuiltInTools(
      Object.values(PACKAGES).flatMap((module) =>
        Object.values(module).filter(isTool)
      )
    );
  }, []);

  return builtInTools.concat(dynamicTools);
};

export const useToolsForDataType = (
  dataType: DataType<unknown, unknown, unknown> | string | undefined
): Tool[] => {
  const tools = useTools();

  return useMemo(() => {
    if (!dataType) {
      return [];
    }

    return tools.filter((tool) => {
      return (
        tool.supportedDataTypes === "*" ||
        (typeof dataType === "string"
          ? tool.supportedDataTypes.some((d) => d === dataType)
          : tool.supportedDataTypes.includes(dataType.id))
      );
    });
  }, [tools, dataType]);
};

export const useTool = (id: string | undefined): Tool | undefined => {
  const tools = useTools();
  return tools.find((tool) => tool.id === id);
};
