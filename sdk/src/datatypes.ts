import EventEmitter from "eventemitter3";
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
  getPluginRegistry,
  getPluginFromRegistry,
  loadPluginFromRegistry,
  isLoadableElement,
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

/**
 * Get all data type descriptions
 * Returns only descriptions without loading implementations
 */
export const getDataTypeDescriptions = (): Record<
  string,
  DataTypeDescription
> => {
  return getPluginRegistry<DataTypeDescription>("dataTypes").getAll();
};

/**
 * Get a specific data type description by ID
 * Returns only the description without loading implementation
 */
export const getDataTypeDescriptionById = (
  id: string | undefined
): DataTypeDescription | undefined => {
  if (!id) return undefined;
  return getPluginRegistry<DataTypeDescription>("dataTypes").getById(id);
};

/**
 * Load a data type by ID
 * Returns a fully loaded data type with implementation
 * @param id The data type ID
 * @param shouldWait If true, wait for registration if not yet registered
 * @returns A Promise resolving to the loaded data type
 */
export const loadDataTypeById = async <D = unknown, T = unknown, V = unknown>(
  id: string | undefined,
  shouldWait = false
): Promise<DataType<D, T, V> | undefined> => {
  if (!id) return undefined;
  return loadPluginFromRegistry<DataType<D, T, V>>("dataTypes", id, shouldWait);
};

/**
 * Get all data types (backward compatibility)
 * @deprecated Use getDataTypeDescriptions() or loadAllDataTypes() instead
 */
export const allDataTypes = () => {
  console.warn(
    "allDataTypes() is deprecated. Use getDataTypeDescriptions() instead."
  );
  return getDataTypeDescriptions();
};

/**
 * Get a data type by ID (backward compatibility)
 * @deprecated Use getDataTypeDescriptionById() or loadDataTypeById() instead
 */
export const dataTypeById = <D = unknown, T = unknown, V = unknown>(
  id: string | undefined
) => {
  console.warn(
    "dataTypeById() is deprecated. Use getDataTypeDescriptionById() or loadDataTypeById() instead."
  );
  if (!id) return undefined;
  return getDataTypeDescriptionById(id) as DataType<D, T, V> | undefined;
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

/**
 * Load all data types
 * Returns fully loaded data types with implementations
 * @param skipUnlisted Skip data types marked as unlisted
 * @returns A Promise resolving to a record of loaded data types
 */
export const loadAllDataTypes = async (
  skipUnlisted = false
): Promise<Record<string, DataType>> => {
  return loadAllPluginsFromRegistry<DataType>(
    "dataTypes",
    skipUnlisted
      ? (element) => !(element as DataTypeDescription).unlisted
      : undefined,
    true
  );
};
