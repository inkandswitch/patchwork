import type { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";
import {
  createTLSchema,
  createTLStore,
  type SerializedSchema,
  type SerializedStore,
  type TLPage,
  type TLPageId,
  type TLRecord,
  type TLShapeId,
} from "@tldraw/tldraw";
import { DEFAULT_STORE } from "./lith/default_store.ts";
import { tldrawValueToAutomergeValue } from "./lith/TLStoreToAutomerge.ts";

// SCHEMA
export type TLDrawDoc = {
  store: SerializedStore<TLRecord>;
  schema: SerializedSchema;
};

export type TLDrawDocAnchor = TLShapeId;

const pageKey = "page:page" as TLPageId;

export const getTitle = (doc: TLDrawDoc) => {
  const page = doc.store[pageKey] as TLPage;
  return page.name.toString() || "Drawing";
};

export const setTitle = (doc: TLDrawDoc, title: string) => {
  const page = doc.store[pageKey] as TLPage;
  page.name = title;
};

export const init = (doc: TLDrawDoc) => {
  Object.assign(doc, tldrawValueToAutomergeValue(DEFAULT_STORE));
  doc.store[pageKey] = {
    meta: {},
    id: "page:page" as TLPageId,
    index: "a1" as TLPage["index"],
    name: "My drawing",
    typeName: "page",
  };
};

export const datatype: DatatypeImplementation<TLDrawDoc> = {
  init,
  getTitle,
  setTitle,
};
