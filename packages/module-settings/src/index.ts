import type {
  DataTypeDescription,
  DeferredTool,
  ModuleSettingsDoc,
} from "@patchwork/sdk";

// Kinda weird how ModuleSettingsDoc isn't owned by the type.

export const dataType: DataTypeDescription<ModuleSettingsDoc> = {
  type: "patchwork:dataType",
  id: "module-settings",
  name: "Module Settings",
  icon: "Cog",

  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: DeferredTool[] = [
  {
    type: "patchwork:tool",
    id: "module-settings",
    name: "Module Settings",
    supportedDataTypes: ["module-settings"],
    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
];
