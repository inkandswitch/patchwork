import {
  ChangeGroup,
  DecodedChangeWithMetadata,
  PendingChangeGroup,
  Annotation,
  HasVersionControlMetadata,
  TextPatch,
} from "./versionControl";
import { next as A, Doc } from "@automerge/automerge";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { ReactElement } from "react";
import { IconType } from "./ui";
import { DocMigration } from "./migrations/DocMigration";
import { HasPatchworkMetadata } from "./modules/types";
import { DocLink } from "./router/DocLink";
import {
  PluginDescription,
  LoadablePlugin,
  Plugin,
  loadPluginFromRegistry,
  loadAllPluginsFromRegistry,
} from "./plugins";

// DataType implementation interface
export type DataTypeImplementation<D = unknown, T = unknown, V = unknown> = {
  init: (doc: D, repo: Repo) => void;
  getTitle: (doc: D, repo: Repo) => Promise<string>;
  setTitle?: (doc: any, title: string) => void;
  markCopy: (doc: D) => void;
  actions?: Record<string, (doc: Doc<D>, args: object) => void>;

  // Versioned data type features
  includeChangeInHistory?: (
    doc: D
  ) => (change: DecodedChangeWithMetadata) => boolean;
  includePatchInChangeGroup?: (patch: A.Patch | TextPatch) => boolean;
  fallbackSummaryForChangeGroup?: (
    changeGroup: ChangeGroup<D>
  ) => string | ReactElement;
  promptForAIChangeGroupSummary?: (args: {
    docBefore: D;
    docAfter: D;
  }) => string;
  patchesToAnnotations?: (
    doc: D,
    docBefore: D,
    patches: A.Patch[]
  ) => Annotation<T, V>[];
  groupAnnotations?: (annotations: Annotation<T, V>[]) => Annotation<T, V>[][];
  valueOfAnchor?: (doc: D, anchor: T) => V | undefined;
  doAnchorsOverlap?: (doc: D, anchor1: T, anchor2: T) => boolean;
  sortAnchorsBy?: (doc: D, anchor: T) => any;
  groupChanges?: (
    currentGroup: PendingChangeGroup<D>,
    newChange: DecodedChangeWithMetadata
  ) => boolean;
  links?: (doc: D) => DocLink[];
  migrations?: DocMigration[];
};

// The DataType description extends the base PluginDescription
export interface DataTypeDescription extends PluginDescription {
  type: "patchwork:dataType";
  icon: IconType;
  unlisted?: boolean;
}

// Loadable DataType description using the generic LoadablePlugin
export type LoadableDataType<
  D = unknown,
  T = unknown,
  V = unknown
> = LoadablePlugin<DataTypeDescription, DataTypeImplementation<D, T, V>>;

// The complete loaded DataType using the generic Plugin
export type DataType<D = unknown, T = unknown, V = unknown> = Plugin<
  DataTypeDescription,
  DataTypeImplementation<D, T, V>
>;

export const isDataType = (value: unknown): value is DataType => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    (value as DataType).type === "patchwork:dataType"
  );
};

/** Creates a new document initialized with the given datatype */
export const createDocOfDataType = <D>(
  dataType: DataType<D>,
  repo: Repo,
  change?: (doc: D) => void
): DocHandle<D & HasPatchworkMetadata> => {
  const handle = repo.create<D & HasPatchworkMetadata>();
  handle.change((doc) => {
    dataType.init(doc, repo);
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

/** Kinda hacky utility function to initialize an object in
 * handle.change in a type-safe way. */
export const initFrom = <D extends object>(
  doc: D,
  init: Omit<D, keyof HasVersionControlMetadata<unknown, unknown>>
) => {
  Object.assign(doc, init);
};
