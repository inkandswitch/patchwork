import { DataTypeDescription } from "../datatypes";
import { ExportMethod } from "../exportMethods";
import { ImportMethod } from "../importMethods";
import { ToolDescription } from "../tools";

/**
 * Map of plugin type strings to their corresponding description types
 */

export type PluginTypeMap = {
  "patchwork:tool": ToolDescription;
  "patchwork:dataType": DataTypeDescription;
  "patchwork:importMethod": ImportMethod;
  "patchwork:exportMethod": ExportMethod;
  [key: string]: PluginDescription; // Allow for user-defined plugin types
};
/**
 * Base interface for all plugin descriptions
 */

export interface PluginDescription {
  id: string;
  type: string;
  name: string;
  icon?: string; // an icon name from the icon font
  importUrl?: string;
}
/**
 * Generic loadable plugin
 * D = Description type that extends PluginDescription
 * I = Implementation type that will be loaded
 */

export type LoadablePlugin<
  D extends PluginDescription = PluginDescription,
  I = any,
> = D & {
  load: () => Promise<I>;
};
/**
 * A fully loaded plugin combining description and implementation
 * D = Description type, I = Implementation type
 */

export type LoadedPlugin<
  D extends PluginDescription = PluginDescription,
  I = any,
> = D & {
  module: I;
};

export type Plugin<D extends PluginDescription = PluginDescription, I = any> =
  | LoadedPlugin<D, I>
  | LoadablePlugin<D, I>;
