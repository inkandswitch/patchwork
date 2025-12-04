// todo this is now not patchwork-specific, it's just a fun little importmap thing
// and a separate thing that returns the service worker which doesn't really
// need to be a plugin at all

import { importmap } from "./importmap-plugin.js";
import { serviceworker } from "./service-worker-plugin.js";

export default function patchwork(options?: PatchworkVitePluginOptions) {
  return [importmap(options), serviceworker()];
}

type Imports = { [name: string]: string };
export type ImportMap = {
  imports: Imports;
  scopes?: { [scope: string]: Imports };
};

export interface PatchworkVitePluginOptions {
  importmap?: ImportMap;
}
