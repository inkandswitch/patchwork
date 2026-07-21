import type { AutomergeUrl } from "@automerge/automerge-repo";
import setup, {
  hideLoadingAnimation,
  showErrorScreen,
  showLoadingAnimation,
} from "@inkandswitch/patchwork";

// Published tools are registered in this module-settings doc via
// `pnpm register` from each tool's own repo (see patchwork-tools and
// patchwork-core). Can be overridden for development or forked tool sets
// by setting `localStorage.systemPackageListURL` to another automerge: URL.
const DEFAULT_MODULES_URL =
  "automerge:3XRXFS96oVXe5D4joMyQWAfNeFNN" as AutomergeUrl;

showLoadingAnimation();

window.patchwork = await setup({
  packageListURL: DEFAULT_MODULES_URL,
  accountKey: "gaiosAccountUrl",
  name: "GAIOS",
}).catch((error) => {
  showErrorScreen(error, { contact: "chee@inkandswitch.com" });
  throw error;
});

hideLoadingAnimation();
