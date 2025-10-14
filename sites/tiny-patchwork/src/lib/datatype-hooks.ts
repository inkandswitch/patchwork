import { Repo } from "@automerge/automerge-repo";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import {
  DataType,
  DataTypeDescription,
  DataTypeImplementation,
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

export const useDatatype = (id: string) => {
  const [datatype, setDatatype] = useState<
    LoadedPlugin<DataTypeDescription, DataTypeImplementation> | undefined
  >(undefined);

  useEffect(() => {
    const registry = getPluginRegistry(
      "patchwork:datatype"
    ) as PluginRegistry<DataTypeDescription>;

    const loadDatatype = () => {
      registry.loadById(id).then((datatype) => {
        setDatatype(
          datatype as LoadedPlugin<DataTypeDescription, DataTypeImplementation>
        );
      });
    };

    const unsubscribe = registry.onChange(loadDatatype);

    loadDatatype();

    return () => {
      unsubscribe();
    };
  }, [id]);

  return datatype;
};

export const useTitle = (doc: HasPatchworkMetadata, repo: Repo) => {
  const datatype = useDatatype(doc["@patchwork"].type);
  const [title, setTitle] = useState<string>("");

  useEffect(() => {
    datatype?.module.getTitle(doc, repo).then((title) => {
      setTitle(title);
    });
  }, [doc, repo, datatype]);

  return title;
};
