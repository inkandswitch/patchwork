import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
} from "./registry/types.js";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";

// Datatype implementation interface
export type DatatypeImplementation<D = unknown> = {
  init(doc: D, repo: Repo): void;
  getTitle(doc: D): string;
  setTitle?(doc: D, title: string): void;
};

// The Datatype description extends the base PluginDescription
export interface DatatypeDescription extends PluginDescription {
  type: "patchwork:datatype";
  icon: string;
  unlisted?: boolean;
}

// Loadable Datatype description using the generic LoadablePlugin
export type Datatype<D = unknown> = LoadablePlugin<
  DatatypeDescription,
  DatatypeImplementation<D>
>;

// The complete loaded Datatype using the generic Plugin
export type LoadedDatatype<D = unknown> = LoadedPlugin<
  DatatypeDescription,
  DatatypeImplementation<D>
>;

/** Creates a new document initialized with the given datatype using create2 */
export const createDocOfDatatype2 = async <D>(
  datatype: LoadedDatatype<D>,
  repo: Repo,
  change?: (doc: D) => void
): Promise<DocHandle<D & HasPatchworkMetadata>> => {
  const handle = await repo.create2<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    datatype.module.init(doc, repo);
    (doc as any)["@patchwork"] = {
      type: datatype.id,
      suggestedImportUrl: datatype.importUrl,
    };
    if (change) {
      change(doc);
    }
  });
  return handle;
};
