import {
  initFrom,
  type DataTypeImplementation,
  type ModuleSettingsDoc as Doc,
} from "@patchwork/sdk";

export const markCopy = (doc: Doc) => {
  throw new Error("We don't duplicate this document type");
};

const setTitle = async (doc: Doc, title: string) => {
  throw new Error("We don't set a title for this document type");
};

const getTitle = async (doc: Doc) => {
  return "My Tools";
};

export const init = (doc: Doc) => {
  initFrom(doc, {
    modules: [],
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

export { Doc };
