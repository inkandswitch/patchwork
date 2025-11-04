import type {
  DataTypeDescription,
  DataTypeImplementation,
  LoadedPlugin,
  PluginDescription,
  ToolDescription,
  ToolImplementation,
  ToolElement,
} from "@patchwork/plugins";
import { PluginRegistry, getPluginRegistry } from "@patchwork/plugins";
import { useEffect, useState, createElement } from "react";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/vanillajs";

export const usePluginDescriptions = <
  Description extends PluginDescription,
  Implementation = unknown,
>(
  type: string
) => {
  const [plugins, setPlugins] = useState<
    LoadedPlugin<Description, Implementation>[]
  >([]);

  useEffect(() => {
    const registry = getPluginRegistry(type) as PluginRegistry<
      Description,
      Implementation
    >;

    const onPluginsChange = () => {
      setPlugins(registry.getPlugins());
    };

    setPlugins(registry.getPlugins());

    return registry.onChange(onPluginsChange);
  }, [type]);

  return plugins;
};

export const usePlugin = <
  Description extends PluginDescription,
  Implementation = unknown,
>(
  type: string,
  id?: string
) => {
  const [plugin, setPlugin] = useState<
    LoadedPlugin<Description, Implementation> | undefined
  >(undefined);

  useEffect(() => {
    let canceled = false;
    const registry = getPluginRegistry(type) as PluginRegistry<
      Description,
      Implementation
    >;

    const loadDatatype = () => {
      if (!id) {
        return;
      }
      registry.loadById(id).then((datatype) => {
        if (canceled) return;
        setPlugin(datatype as LoadedPlugin<Description, Implementation>);
      });
    };

    const unsubscribe = registry.onChange(loadDatatype);

    loadDatatype();

    return () => {
      canceled = true;
      unsubscribe();
    };
  }, [id, type]);

  // ensure that we never return an outdated datatype
  return plugin?.id === id ? plugin : undefined;
};

export const useDatatypeDescriptions = () => {
  return usePluginDescriptions<DataTypeDescription, DataTypeImplementation>(
    "patchwork:datatype"
  );
};

export const useDatatype = (id?: string) => {
  return usePlugin<DataTypeDescription, DataTypeImplementation>(
    "patchwork:datatype",
    id
  );
};

export const useToolDescriptions = () => {
  return usePluginDescriptions<ToolDescription, ToolImplementation>(
    "patchwork:tool"
  );
};

export const useTool = (id?: string) => {
  return usePlugin<ToolDescription, ToolImplementation>("patchwork:tool", id);
};

export type ReactToolProps = {
  docUrl: AutomergeUrl;
  element: ToolElement;
};

/**
 * @import {LegacyEditorProps, ToolImplementation} from "@patchwork/plugins"
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
