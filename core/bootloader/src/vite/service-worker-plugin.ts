import type { Plugin } from "vite";
import { builtins } from "./importmap-plugin.js";

export function serviceworker(): Plugin {
  let swEntryId: string | undefined;

  return {
    name: "@patchwork/service-worker",
    enforce: "pre",
    async buildStart() {
      const resolved = await this.resolve(
        "@inkandswitch/patchwork-bootloader/service-worker"
      );
      swEntryId = resolved!.id;
      this.emitFile({
        type: "chunk",
        id: resolved!.id,
        fileName: "service-worker.js",
      });
    },
    resolveId(source, importer) {
      if (importer && swEntryId && importer === swEntryId && source in builtins) {
        return { id: builtins[source], external: true };
      }
    },
  };
}
