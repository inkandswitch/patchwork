import type { DataTypeImplementation } from "@patchwork/plugins";
import {
  createTLSchema,
  createTLStore,
  type SerializedSchema,
  type SerializedStore,
  type TLPage,
  type TLPageId,
  type TLRecord,
  type TLShapeId,
} from "tldraw";

// SCHEMA
export type TLDrawDoc = {
  store: SerializedStore<TLRecord>;
  schema: SerializedSchema;
};

export type TLDrawDocAnchor = TLShapeId;

const pageKey = "page:page" as TLPageId;

// FUNCTIONS
// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
export const markCopy = (doc: TLDrawDoc) => {
  const page = doc.store[pageKey] as TLPage;
  page.name = "Copy of " + page.name;
};

export const getTitle = (doc: TLDrawDoc) => {
  const page = doc.store[pageKey] as TLPage;
  return page.name.toString() || "Drawing";
};

export const setTitle = (doc: TLDrawDoc, title: string) => {
  const page = doc.store[pageKey] as TLPage;
  page.name = title;
};

export const init = (doc: TLDrawDoc) => {
  doc.schema = createTLSchema().serialize();
  doc.store = createTLStore().serialize();
  doc.store[pageKey] = {
    meta: {},
    id: "page:page" as TLPageId,
    index: "a1" as TLPage["index"],
    name: "My drawing",
    typeName: "page",
  };
};

export const dataType: DataTypeImplementation<TLDrawDoc> = {
  init,
  getTitle,
  setTitle,
};
