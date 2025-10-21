import {
  type ToolDescription,
  type DataTypeDescription,
  type Tool,
  type DataType,
  getLoadedSupportedToolsForType,
  getPluginRegistry,
} from "@patchwork/plugins";
import { createResource, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

const toolRegistry = getPluginRegistry<ToolDescription>("patchwork:tool");
const datatypeRegistry =
  getPluginRegistry<DataTypeDescription>("patchwork:datatype");

export function useTools(): Tool[] {
  const [plugins, setPlugins] = createStore(toolRegistry.getPlugins());
  const dispose = toolRegistry.onChange(() =>
    setPlugins(reconcile(toolRegistry.getPlugins()))
  );
  onCleanup(dispose);
  return plugins;
}

export function useDatatypes(filter: (item: DataType) => boolean): DataType[] {
  const [plugins, setPlugins] = createStore(
    datatypeRegistry.getPlugins().filter(filter)
  );
  const dispose = datatypeRegistry.onChange(() =>
    setPlugins(reconcile(datatypeRegistry.getPlugins().filter(filter)))
  );
  onCleanup(dispose);
  return plugins;
}

export function useLoadedSupportedToolsForType(type: string) {
  const [supportedTools, control] = createResource(
    () => type,
    getLoadedSupportedToolsForType
  );
  onCleanup(toolRegistry.onChange(control.refetch));
  return supportedTools;
}
