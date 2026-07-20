import "@inkandswitch/patchwork-bootloader/global.css";

import { bootPatchworkSite } from "@inkandswitch/patchwork-bootloader/site";

const DEFAULT_PACKAGE_LIST =
  "https://base.pkg.patchwork.inkandswitch.com/modules.json";

const defaultModules = (
  import.meta.env.PATCHWORK_SYSTEM_PACKAGE_LIST_URL ||
  import.meta.env.VITE_DEFAULT_MODULES ||
  DEFAULT_PACKAGE_LIST
)
  .split(",")
  .map((source) => source.trim())
  .filter(Boolean);

declare const __KEYHIVE__: boolean;
await bootPatchworkSite({
  defaultModules,
  accountStorageKey: "tinyPatchworkAccountUrl",
  titleSuffix: "patchwork",
  keyhive: __KEYHIVE__,
});
