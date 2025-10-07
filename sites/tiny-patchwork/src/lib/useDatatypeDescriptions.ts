import { DataType, getPluginRegistry } from "@patchwork/plugins";
import { useEffect, useState } from "react";

export const useDatatypeDescriptions = () => {
  const [datatypes, setDatatypes] = useState<DataType<unknown>[]>([]);

  useEffect(() => {
    const registry = getPluginRegistry("patchwork:datatype");

    const onPluginsChange = () => {
      setDatatypes(registry.getPlugins() as DataType<unknown>[]);
    };

    setDatatypes(registry.getPlugins() as DataType<unknown>[]);

    return registry.onChange(onPluginsChange);
  }, []);

  return datatypes;
};
