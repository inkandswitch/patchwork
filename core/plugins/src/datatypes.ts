import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { PluginDescription } from "./registry/types.js";
import type {
  HasPatchworkMetadata,
  ToolSource,
} from "@inkandswitch/patchwork-filesystem";

export type DatatypeImplementation<D = unknown> = {
  init(doc: D, repo: Repo): void;
  getTitle(doc: D): string;
  setTitle?(doc: D, title: string): void;
};

export interface DatatypeDescription extends PluginDescription {
  type: "patchwork:datatype";
  icon: string;
  unlisted?: boolean;
}

export type Datatype = DatatypeDescription;

/** Import and return a datatype's implementation module */
async function importDatatypeImpl<D>(
  datatype: DatatypeDescription
): Promise<DatatypeImplementation<D>> {
  if (!datatype.importUrl) {
    throw new Error(`Datatype "${datatype.id}" has no importUrl`);
  }
  const mod = await import(/* @vite-ignore */ datatype.importUrl);
  return mod.default as DatatypeImplementation<D>;
}

/** Creates a new document initialized with the given datatype using create2 */
export const createDocOfDatatype2 = async <D>(
  datatype: DatatypeDescription,
  repo: Repo,
  change?: (doc: D) => void
): Promise<DocHandle<D & HasPatchworkMetadata>> => {
  const impl = await importDatatypeImpl<D>(datatype);
  const handle = await repo.create2<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    impl.init(doc, repo);
    const metadata: Record<string, any> = {
      type: datatype.id,
      // Package URL so loadSuggestedImportUrl loads the package main (which exports plugins).
      // Fall back to datatype.importUrl for backward compat when sourceDocUrl is not set.
      suggestedImportUrl: datatype.sourceDocUrl ?? datatype.importUrl,
    };
    if (datatype.sourceDocUrl) {
      const toolSource: ToolSource = {
        packageUrl: datatype.sourceDocUrl as any,
      };
      if (datatype.branch) {
        toolSource.branch = datatype.branch;
      }
      metadata.toolSource = toolSource;
    }
    (doc as any)["@patchwork"] = metadata;
    if (change) {
      change(doc);
    }
  });
  return handle;
};
