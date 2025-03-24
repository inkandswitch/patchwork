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
  SystemElementDescription,
  LoadableSystemElement,
  SystemElement,
  getSystemRegistry,
  getElementFromSystem,
} from "./systems";

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

// The DataType description extends the base SystemElementDescription
export interface DataTypeDescription extends SystemElementDescription {
  type: "patchwork:dataType";
  icon: IconType;
  unlisted?: boolean;
}

// Loadable DataType description using the generic LoadableSystemElement
export type LoadableDataType<
  D = unknown,
  T = unknown,
  V = unknown
> = LoadableSystemElement<DataTypeDescription, DataTypeImplementation<D, T, V>>;

// The complete loaded DataType using the generic SystemElement
export type DataType<D = unknown, T = unknown, V = unknown> = SystemElement<
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

// For backward compatibility and transition
export type DataTypesMap = Record<string, DataType<unknown, unknown, unknown>>;
export type DataTypeEvents = {
  "datatypes:changed": (datatypes: DataTypesMap) => void;
};
export const datatypeEvents = new EventEmitter<DataTypeEvents>();

// Register existing event listeners with the new system
getSystemRegistry<DataType>("dataTypes").onChange((elements) => {
  datatypeEvents.emit("datatypes:changed", elements);
});

export const registerDataType = async <D = unknown, T = unknown, V = unknown>(
  datatype: LoadableDataType<D, T, V>,
  importUrl?: string
) => {
  // Use the systems registry to register the datatype
  const registry = getSystemRegistry<DataTypeDescription>("dataTypes");
  await registry.register(datatype, importUrl || datatype.importUrl);
};

export const allDataTypes = () => {
  return getSystemRegistry<DataType>("dataTypes").getAll();
};

export const dataTypeById = <D = unknown, T = unknown, V = unknown>(
  id: string | undefined
) => {
  if (!id) return undefined;
  return getElementFromSystem<DataType<D, T, V>>("dataTypes", id);
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
