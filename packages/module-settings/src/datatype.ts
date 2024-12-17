import {
  initFrom,
  type DataType,
  type ModuleSettingsDoc,
} from "@patchwork/sdk";

export const markCopy = (doc: ModuleSettingsDoc) => {
  throw new Error("We don't duplicate this document type");
};

const setTitle = async (doc: ModuleSettingsDoc, title: string) => {
  throw new Error("We don't set a title for this document type");
};

const getTitle = async (doc: ModuleSettingsDoc) => {
  return "Module Settings";
};

export const init = (doc: ModuleSettingsDoc) => {
  initFrom(doc, {
    modules: [],
  });
};

export const dataType: DataType<ModuleSettingsDoc, unknown> = {
  type: "patchwork:dataType",
  id: "module-settings",
  name: "Module Settings",
  icon: "Cog",

  init,
  getTitle,
  setTitle,
  markCopy,
};

export { ModuleSettingsDoc };
