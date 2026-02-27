import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  LoadablePlugin,
  LoadedPlugin,
  PluginDescription,
} from "./registry/types.js";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { getRegistry } from "./registry/index.js";

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
  datatype: LoadedDatatype<D> | Datatype<D>,
  repo: Repo,
  change?: (doc: D) => void
): Promise<DocHandle<D & HasPatchworkMetadata>> => {
  // Ensure the datatype is loaded via the registry so the loaded state persists
  let loaded = datatype as LoadedDatatype<D>;
  if (!loaded.module) {
    const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
    const registryLoaded = await registry.load(datatype.id);
    if (registryLoaded?.module) {
      loaded = registryLoaded as unknown as LoadedDatatype<D>;
    } else if ("load" in datatype && typeof datatype.load === "function") {
      loaded = {
        ...datatype,
        module: await datatype.load(),
      } as LoadedDatatype<D>;
    }
  }

  if (!loaded.module) {
    throw new Error(
      `Datatype "${datatype.id}" has no module and cannot be loaded`
    );
  }

  const handle = await repo.create2<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    loaded.module.init(doc, repo);
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
