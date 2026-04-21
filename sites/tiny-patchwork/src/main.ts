import "./global.css";

import { bootPatchworkSite } from "@inkandswitch/patchwork-bootloader/site";
import type { AutomergeUrl } from "@automerge/automerge-repo";

// Published tools are registered in this module-settings doc via
// `pnpm register` from each tool's own repo (see patchwork-tools and
// patchwork-core). Can be overridden for development or forked tool sets
// by setting `localStorage.defaultToolsUrl` to another automerge: URL.
const DEFAULT_MODULES_URL =
  "automerge:axLMmZNW8uogPudjwcab7svmJWr" as AutomergeUrl;

await bootPatchworkSite({
  defaultModulesUrl: DEFAULT_MODULES_URL,
  accountStorageKey: "tinyPatchworkAccountUrl",
  titleSuffix: "patchwork",
});
