import type { MaybeAccessor } from "@automerge/automerge-repo-solid-primitives/dist/types";
import {
  type ToolDescription,
  type DataTypeDescription,
  getSupportedToolsForType,
  getRegistry,
  type Plugin,
} from "@patchwork/plugins";
import { createEffect, on, onCleanup } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

// TODO: maybe these should go alongside the @patchwork/react package?
const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");
const datatypeRegistry = getRegistry<DataTypeDescription>("patchwork:datatype");

(window as any).toolRegistry = toolRegistry;
(window as any).datatypeRegistry = datatypeRegistry;

export function useTools(): Plugin<ToolDescription>[] {
  const [plugins, setPlugins] = createStore(toolRegistry.all());
  const dispose = toolRegistry.on("changed", () =>
    setPlugins(reconcile(toolRegistry.all()))
  );
  onCleanup(dispose);
  return plugins;
}

export function useDatatypes(
  filter: (item: DataTypeDescription) => boolean
): Plugin<DataTypeDescription>[] {
  const [plugins, setPlugins] = createStore(datatypeRegistry.filter(filter));
  const dispose = datatypeRegistry.on("changed", () =>
    setPlugins(reconcile(datatypeRegistry.filter(filter)))
  );
  onCleanup(dispose);
  return plugins;
}

function access(thing: MaybeAccessor<string>) {
  return typeof thing == "function" ? thing() : thing;
}

export function useSupportedToolsForType(type: MaybeAccessor<string>) {
  const [plugins, setPlugins] = createStore(
    getSupportedToolsForType(access(type)).filter((tool) => !tool.unlisted)
  );

  createEffect(
    on(
      () => access(type),
      (type) => {
        const dispose = toolRegistry.on("changed", () =>
          setPlugins(
            reconcile(
              getSupportedToolsForType(type).filter((tool) => !tool.unlisted)
            )
          )
        );
        onCleanup(dispose);
      }
    )
  );

  return plugins;
}
