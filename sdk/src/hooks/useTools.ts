import { useEffect, useState } from "react";
import {
  allTools,
  Tool,
  toolById,
  toolsEvents,
  toolsForDataType,
  ToolsMap,
} from "../tools";

export function useTool(id: string | undefined) {
  const [tool, setTool] = useState<Tool | undefined>(toolById(id));

  useEffect(() => {
    setTool(toolById(id));

    const handler = () => setTool(toolById(id));
    toolsEvents.on("tools:changed", handler);
    return () => {
      toolsEvents.off("tools:changed", handler);
    };
  }, [id]);

  return tool;
}

export function useTools() {
  const [tools, setTools] = useState<ToolsMap>(allTools());

  useEffect(() => {
    const handler = () => setTools(allTools());
    toolsEvents.on("tools:changed", handler);
    return () => {
      toolsEvents.off("tools:changed", handler);
    };
  }, []);

  return tools;
}

export function useToolsForDataType(id: string | undefined) {
  const [tools, setTools] = useState<Tool[]>(toolsForDataType(id));

  useEffect(() => {
    setTools(toolsForDataType(id));
    const handler = () => setTools(toolsForDataType(id));
    toolsEvents.on("tools:changed", handler);
    return () => {
      toolsEvents.off("tools:changed", handler);
    };
  }, [id]);

  return tools;
}
