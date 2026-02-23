import { DatatypeDescription } from "../datatypes.js";
import { ToolDescription } from "../tools.js";

export interface PluginRegistryEvents<D extends PluginDescription> {
  registered: (plugin: D) => void;
  removed: (id: string) => void;
  changed: () => void;
}

/**
 * Map of registry types and their corresponding plugin description types
 * can be extended with `declare module "@inkandswitch/patchwork-plugins" { ... }`
 * to add new registry types in userland while maintaining type safety.
 */
export type RegistryTypeMap = {
  "patchwork:tool": ToolDescription;
  "patchwork:datatype": DatatypeDescription;
};

/**
 * Base interface for all plugin descriptions.
 * The registry stores descriptions only. Consumers call import(importUrl)
 * to load the implementation module when needed.
 */
export interface PluginDescription {
  id: string;
  type: string;
  name: string;
  icon?: string;
  /** Relative path to the implementation module within the package */
  importPath?: string;
  /** Fully resolved URL for import() -- set by registerPlugins */
  importUrl?: string;
  /** Plain automerge URL of the tool package (no heads) */
  sourceDocUrl?: string;
  /** Branch name this version is registered under (e.g. "default", "pvh-dev") */
  branch?: string;
  /** Automerge heads string identifying this specific version */
  version?: string;
}

/**
 * Plugin type as stored in the registry -- just the description.
 */
export type Plugin<D extends PluginDescription = PluginDescription> = D;
