import type { MaybeAccessor } from "@automerge/automerge-repo-solid-primitives/dist/types";
import {
  type ToolDescription,
  type DataTypeDescription,
  type Tool,
  type DataType,
  getSupportedToolsForType,
  getPluginRegistry,
} from "@patchwork/plugins";
import { createEffect, on, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

const toolRegistry = getPluginRegistry<ToolDescription>("patchwork:tool");
const datatypeRegistry =
  getPluginRegistry<DataTypeDescription>("patchwork:datatype");

(window as any).toolRegistry = toolRegistry;
(window as any).datatypeRegistry = datatypeRegistry;

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

function access(thing: MaybeAccessor<string>) {
  return typeof thing == "function" ? thing() : thing;
}

export function useSupportedToolsForType(type: MaybeAccessor<string>) {
  const [plugins, setPlugins] = createStore(
    getSupportedToolsForType(access(type))
  );

  createEffect(
    on(
      () => access(type),
      (type) => {
        const dispose = toolRegistry.onChange(() =>
          setPlugins(reconcile(getSupportedToolsForType(type)))
        );
        onCleanup(dispose);
      }
    )
  );

  return plugins;
}
