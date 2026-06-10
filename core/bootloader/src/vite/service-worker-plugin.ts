import type { Plugin } from "vite";
import { builtins } from "./importmap-plugin.js";

// The service worker and the automerge shared worker are emitted as their
// own chunks. Their heavy imports are marked external and resolved to
// /packages/... URLs (both workers are created with type:"module", so the
// browser fetches those as regular network requests).
const workers = [
  {
    specifier: "@inkandswitch/patchwork-bootloader/service-worker",
    fileName: "service-worker.js",
  },
  {
    specifier: "@inkandswitch/patchwork-bootloader/automerge-worker",
    fileName: "automerge-worker.js",
  },
];

export function serviceworker(): Plugin {
  const entryIds = new Set<string>();

  return {
    name: "@patchwork/service-worker",
    enforce: "pre",
    async buildStart() {
      for (const { specifier, fileName } of workers) {
        const resolved = await this.resolve(specifier);
        entryIds.add(resolved!.id);
        this.emitFile({
          type: "chunk",
          id: resolved!.id,
          fileName,
        });
      }
    },
    resolveId(source, importer) {
      if (importer && entryIds.has(importer) && source in builtins) {
        return { id: builtins[source], external: true };
      }
    },
  };
}
