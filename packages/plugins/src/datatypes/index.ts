import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
} from "../registry/types.js";
import type { HasPatchworkMetadata } from "@patchwork/filesystem";

// DataType implementation interface
export type DataTypeImplementation<D = unknown> = {
  init: (doc: D, repo: Repo) => void;
  getTitle: (doc: D) => string;
  setTitle?: (doc: any, title: string) => void;
};

// The DataType description extends the base PluginDescription
export interface DataTypeDescription extends PluginDescription {
  type: "patchwork:datatype";
  icon: string;
  unlisted?: boolean;
}

// Loadable DataType description using the generic LoadablePlugin
export type LoadableDataType<D = unknown> = LoadablePlugin<
  DataTypeDescription,
  DataTypeImplementation<D>
>;

// The complete loaded DataType using the generic Plugin
export type DataType<D = unknown> = LoadedPlugin<
  DataTypeDescription,
  DataTypeImplementation<D>
>;

/** Creates a new document initialized with the given datatype */
export const createDocOfDataType = <D>(
  dataType: DataType<D>,
  repo: Repo,
  change?: (doc: D) => void
): DocHandle<D & HasPatchworkMetadata> => {
  const handle = repo.create<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    dataType.module.init(doc, repo);
    (doc as any)["@patchwork"] = {
      type: dataType.id,
      suggestedImportUrl: dataType.importUrl,
    };
    if (change) {
      change(doc);
    }
  });
  return handle;
};

/** Creates a new document initialized with the given datatype using create2 */
export const createDocOfDataType2 = async <D>(
  dataType: DataType<D>,
  repo: Repo,
  change?: (doc: D) => void
): Promise<DocHandle<D & HasPatchworkMetadata>> => {
  const handle = await repo.create2<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    dataType.module.init(doc, repo);
    (doc as any)["@patchwork"] = {
      type: dataType.id,
      suggestedImportUrl: dataType.importUrl,
    };
    if (change) {
      change(doc);
    }
  });
  return handle;
};
