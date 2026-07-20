import patchwork from "@inkandswitch/patchwork";

const DEFAULT_PACKAGE_LIST =
  "https://base.pkg.patchwork.inkandswitch.com/modules.json";

const packageListURL = (
  import.meta.env.PATCHWORK_SYSTEM_PACKAGE_LIST_URL ||
  import.meta.env.VITE_DEFAULT_MODULES ||
  DEFAULT_PACKAGE_LIST
)
  .split(",")
  .map((source) => source.trim())
  .filter(Boolean);

await patchwork({
  packageListURL,
  accountKey: "tinyPatchworkAccountUrl",
  name: "patchwork",
  keyhive: __KEYHIVE__,
});
