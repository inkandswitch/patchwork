import type {
  DataTypeDescription,
  ToolDescription,
  ModuleSettingsDoc,
} from "@patchwork/sdk";

// Kinda weird how ModuleSettingsDoc isn't owned by the type.

export const dataType: DataTypeDescription<ModuleSettingsDoc> = {
  type: "patchwork:dataType",
  id: "module-settings",
  name: "Module Settings",
  icon: "Cog",
  unlisted: true,

  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
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
