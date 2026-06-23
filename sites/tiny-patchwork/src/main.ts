import "./global.css";

declare const __KEYHIVE__: boolean;

import { bootPatchworkSite } from "@inkandswitch/patchwork-bootloader/site";

// The default tool bundle. Resolution order:
//   1. `localStorage.defaultToolsUrl` — runtime override (handled by the
//      bootloader), e.g. point a deployed shell at a local tools server.
//   2. `VITE_DEFAULT_MODULES` — build-time env (comma-separated list of
//      sources; each may be an `automerge:` URL or a static `modules.json`
//      manifest URL).
//   3. the patchwork-base static tools bundle deployed to Netlify (below). To
//      boot from an Automerge module-settings doc instead, set
//      VITE_DEFAULT_MODULES (or localStorage.defaultToolsUrl) to an
//      `automerge:` URL.
const DEFAULT_MODULES = "https://patchwork-base.netlify.app/modules.json";

const defaultModules = (import.meta.env.VITE_DEFAULT_MODULES ?? DEFAULT_MODULES)
  .split(",")
  .map((source) => source.trim())
  .filter(Boolean);

await bootPatchworkSite({
  defaultModules,
  accountStorageKey: "tinyPatchworkAccountUrl",
  titleSuffix: "patchwork",
  keyhive: __KEYHIVE__,
});
