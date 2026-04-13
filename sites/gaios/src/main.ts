import "./global.css";

import type { AutomergeUrl } from "@automerge/automerge-repo";
import { bootPatchworkSite } from "@inkandswitch/patchwork-bootloader/site";

// Published tools are registered in this module-settings doc via
// `pnpm register` from each tool's own repo (see patchwork-tools and
// patchwork-core). Can be overridden for development or forked tool sets
// by setting `localStorage.defaultToolsUrl` to another automerge: URL.
const DEFAULT_MODULES_URL =
  "automerge:3XRXFS96oVXe5D4joMyQWAfNeFNN" as AutomergeUrl;

await bootPatchworkSite({
  defaultModulesUrl: DEFAULT_MODULES_URL,
  accountStorageKey: "gaiosAccountUrl",
  titleSuffix: "GAIOS",
  keyhive: true,
});
