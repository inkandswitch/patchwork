import { createUnplugin } from "unplugin";
import { resolve } from "node:path";
import {
  readPackageJson,
  parseBareSpecifier,
  isBareSpecifier,
  resolveDepEntryPoint,
} from "./utils.js";
import { getImportableUrlFromAutomergeUrl } from "@inkandswitch/patchwork-filesystem";
import externals from "@inkandswitch/patchwork-bootloader/externals";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { resolveOptions, type PatchworkBundleOptions } from "./types.js";

export const patchworkBundles = createUnplugin(
  (rawOptions?: PatchworkBundleOptions) => {
    const options = resolveOptions(rawOptions);
    let deps: Record<string, string>;

    return {
      name: "patchwork-bundles",
      enforce: "pre",

      buildStart() {
        const pkgPath = resolve(process.cwd(), options.packageJsonPath);
        const pkgJson = readPackageJson(pkgPath);
        deps = pkgJson.dependencies ?? {};
      },

      resolveId(id: string) {
        if (!isBareSpecifier(id)) return undefined;

        // Bootloader externals — always external (served via importmap)
        if (externals.includes(id)) {
          return { id, external: true };
        }

        const { pkgName, subpath } = parseBareSpecifier(id);

        if (pkgName !== id && externals.includes(pkgName)) {
          return { id, external: true };
        }

        const version = deps[pkgName];
        if (!version) return undefined;

        // Automerge deps — rewrite to service worker URLs
        if (version.startsWith("automerge:")) {
          if (options.rewrite.automerge === "patchwork") {
            const entryPoint = resolveDepEntryPoint(pkgName, subpath);
            const url = getImportableUrlFromAutomergeUrl(
              version as AutomergeUrl,
              entryPoint
            );
            return { id: url, external: true };
          }
          return undefined;
        }

        // npm fallback — optionally rewrite to esm.sh
        if (options.rewrite.npm === "esm.sh") {
          const cleanVersion = version.replace(/^[\^~>=<\s]+/, "");
          const esmId = subpath === "." ? pkgName : id;
          return {
            id: `https://esm.sh/${esmId}@${cleanVersion}`,
            external: true,
          };
        }

        return undefined;
      },
    };
  }
);

export default patchworkBundles;
export type { PatchworkBundleOptions } from "./types.js";
