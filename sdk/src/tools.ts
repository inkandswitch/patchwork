import { AutomergeUrl } from "@automerge/automerge-repo";
import React from "react";
import { LoadedPlugin, PluginDescription } from "./plugins";

export type ToolImplementation = {
  EditorComponent: React.FC<EditorProps>;
};

export type ToolDescription = PluginDescription & {
  id: string;
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: string;
};

export type Tool = LoadedPlugin<ToolDescription, ToolImplementation>;

export type EditorProps = {
  docUrl: AutomergeUrl;
};
