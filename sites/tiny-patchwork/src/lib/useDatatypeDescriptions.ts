import {
  DataType,
  DataTypeDescription,
  getPluginRegistry,
  LoadedPlugin,
} from "@patchwork/plugins";
import { PluginRegistry } from "@patchwork/plugins/dist/registry/registry";
import { useEffect, useState } from "react";

export const useDatatypeDescriptions = () => {
  const [datatypes, setDatatypes] = useState<DataType<unknown>[]>([]);

  useEffect(() => {
    const registry = getPluginRegistry(
      "patchwork:datatype"
    ) as PluginRegistry<DataTypeDescription>;

    const onPluginsChange = () => {
      setDatatypes(getListedDatatypes(registry));
    };

    setDatatypes(getListedDatatypes(registry));

    return registry.onChange(onPluginsChange);
  }, []);

  return datatypes;
};

const getListedDatatypes = (registry: PluginRegistry<DataTypeDescription>) => {
  return (registry.getPlugins() as LoadedPlugin<DataTypeDescription>[]).filter(
    (plugin) => !plugin.unlisted
  ) as DataType<unknown>[];
};
