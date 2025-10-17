import type { Doc, DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
} from "../registry/types.js";
import type { DocLink, HasPatchworkMetadata } from "@patchwork/filesystem";

// DataType implementation interface
export type DataTypeImplementation<D = unknown> = {
  init: (doc: D, repo: Repo) => void;
  getTitle: (doc: D) => string;
  setTitle?: (doc: any, title: string) => void;
  markCopy: (doc: D) => void;
  actions?: Record<string, (doc: Doc<D>, args: object) => void>;
  /**
   * Specifies what other Automerge documents are "linked to" from this
   * document. This is currently used to figure out which documents to clone
   * when a branch is created.
   */
  links?: (doc: D) => DocLink[];
};

// The DataType description extends the base PluginDescription
export interface DataTypeDescription extends PluginDescription {
  type: "patchwork:dataType";
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

// TODO: How do we do away with this?
/** Kinda hacky utility function to initialize an object in
 * handle.change in a type-safe way. */
export const initFrom = <D extends object>(doc: D, init: D) => {
  Object.assign(doc, init);
};
