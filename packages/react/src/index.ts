import type {
  DatatypeDescription,
  DatatypeImplementation,
  PluginDescription,
  ToolDescription,
  ToolImplementation,
  ToolElement,
  Plugin,
} from "@inkandswitch/patchwork-plugins";
import { getRegistry } from "@inkandswitch/patchwork-plugins";
import { useEffect, useState, createElement } from "react";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/vanillajs";

export const usePluginDescriptions = <Description extends PluginDescription>(
  type: string
) => {
  const [plugins, setPlugins] = useState<Description[]>([]);

  useEffect(() => {
    const registry = getRegistry<Description>(type);

    const onPluginsChange = () => {
      setPlugins(registry.all());
    };

    setPlugins(registry.all());

    return registry.on("changed", onPluginsChange);
  }, [type]);

  return plugins;
};

/** Returns a plugin description and its loaded implementation module */
export const usePlugin = <
  Description extends PluginDescription,
  Implementation = unknown,
>(
  type: string,
  id?: string
) => {
  const [result, setResult] = useState<
    (Description & { module: Implementation }) | undefined
  >(undefined);

  useEffect(() => {
    let canceled = false;
    const registry = getRegistry<Description>(type);

    const loadPlugin = () => {
      if (!id) return;
      const desc = registry.get(id);
      if (!desc?.importUrl) return;
      import(/* @vite-ignore */ desc.importUrl).then((mod) => {
        if (canceled) return;
        setResult({ ...desc, module: mod.default as Implementation });
      });
    };

    const unsubscribe = registry.on("changed", loadPlugin);

    loadPlugin();

    return () => {
      canceled = true;
      unsubscribe();
    };
  }, [id, type]);

  return result?.id === id ? result : undefined;
};

export const useDatatypeDescriptions = () => {
  return usePluginDescriptions<DatatypeDescription>("patchwork:datatype");
};

export const useDatatype = (id?: string) => {
  return usePlugin<DatatypeDescription, DatatypeImplementation>(
    "patchwork:datatype",
    id
  );
};

export const useToolDescriptions = () => {
  return usePluginDescriptions<ToolDescription>("patchwork:tool");
};

export const useTool = (id?: string) => {
  return usePlugin<ToolDescription, ToolImplementation>("patchwork:tool", id);
};

export type ReactToolProps = {
  docUrl: AutomergeUrl;
  element: ToolElement;
};

/**
 * @import {LegacyEditorProps, ToolImplementation} from "@inkandswitch/patchwork-plugins"
 */

export function toolify(
  editorComponent: React.FC<ReactToolProps>
): ToolImplementation {
  return (handle, element) => {
    const root = createRoot(element);

    root.render(
      createElement(
        RepoContext.Provider,
        { value: element.repo },
        createElement(editorComponent, {
          docUrl: handle.url,
          element,
        })
      )
    );

    return () => {
      root.unmount();
    };
  };
}
