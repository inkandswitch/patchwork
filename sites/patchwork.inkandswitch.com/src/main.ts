import "@inkandswitch/patchwork-bootloader/global.css";

declare const __KEYHIVE__: boolean;

import { bootPatchworkSite } from "@inkandswitch/patchwork-bootloader/site";

// The default tool bundle. Resolution order:
//   1. `localStorage.systemPackageListURL` — runtime override (handled by the
//      bootloader), e.g. point a deployed shell at a local tools server.
//   2. `PATCHWORK_SYSTEM_PACKAGE_LIST_URL` — build-time env (comma-separated
//      list of sources; each may be an `automerge:` URL or a static
//      `modules.json` manifest URL). `VITE_DEFAULT_MODULES` is the pre-rename
//      name, still honoured.
//   3. the patchwork-base static tools bundle deployed to Netlify (below). To
//      boot from an Automerge module-settings doc instead, set
//      PATCHWORK_SYSTEM_PACKAGE_LIST_URL (or localStorage.systemPackageListURL)
//      to an `automerge:` URL.
const DEFAULT_PACKAGE_LIST = "https://patchwork-base.netlify.app/modules.json";

const defaultModules = (
  import.meta.env.PATCHWORK_SYSTEM_PACKAGE_LIST_URL ||
  import.meta.env.VITE_DEFAULT_MODULES ||
  DEFAULT_PACKAGE_LIST
)
  .split(",")
  .map((source) => source.trim())
  .filter(Boolean);

await bootPatchworkSite({
  defaultModules,
  accountStorageKey: "tinyPatchworkAccountUrl",
  titleSuffix: "patchwork",
  keyhive: __KEYHIVE__,
});
