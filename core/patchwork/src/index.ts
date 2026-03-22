export { default as default } from "./setup.js";
export { default as patchwork } from "./setup.js";

export type { PatchworkOptions, Patchwork } from "./types.js";

// Re-exports from core packages
export { default as setupServiceWorker } from "@inkandswitch/patchwork-bootloader";
export { registerPatchworkViewElement } from "@inkandswitch/patchwork-elements";
export {
  registerPlugins,
  getRegistry,
  getAllRegistries,
  unregisterPlugins,
} from "@inkandswitch/patchwork-plugins";
export { ModuleWatcher } from "@inkandswitch/patchwork-filesystem";
