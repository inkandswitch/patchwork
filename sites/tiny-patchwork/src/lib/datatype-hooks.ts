import { HasPatchworkMetadata } from "@patchwork/filesystem";
import {
  DataType,
  DataTypeDescription,
  DataTypeImplementation,
  getPluginRegistry,
  LoadedPlugin,
} from "@patchwork/plugins";
import { PluginRegistry } from "@patchwork/plugins/dist/registry/registry";
import { useEffect, useMemo, useState } from "react";

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

export const useDatatype = (id?: string) => {
  const [datatype, setDatatype] = useState<
    LoadedPlugin<DataTypeDescription, DataTypeImplementation> | undefined
  >(undefined);

  useEffect(() => {
    let canceled = false;
    const registry = getPluginRegistry(
      "patchwork:datatype"
    ) as PluginRegistry<DataTypeDescription>;

    const loadDatatype = () => {
      if (!id) {
        return;
      }
      registry.loadById(id).then((datatype) => {
        if (canceled) return;
        setDatatype(
          datatype as LoadedPlugin<DataTypeDescription, DataTypeImplementation>
        );
      });
    };

    const unsubscribe = registry.onChange(loadDatatype);

    loadDatatype();

    return () => {
      canceled = true;
      unsubscribe();
    };
  }, [id]);

  // ensure that we never return an outdated datatype
  return datatype?.id === id ? datatype : undefined;
};

export const useTitle = (doc?: HasPatchworkMetadata) => {
  const datatype = useDatatype(doc?.["@patchwork"]?.type);

  return useMemo(() => {
    if (!doc) {
      return;
    }

    const title = datatype?.module?.getTitle(doc);

    return title ? title : "Untitled";
  }, [doc, datatype]);
};

const getListedDatatypes = (registry: PluginRegistry<DataTypeDescription>) => {
  return (registry.getPlugins() as LoadedPlugin<DataTypeDescription>[]).filter(
    (plugin) => !plugin.unlisted
  ) as DataType<unknown>[];
};
