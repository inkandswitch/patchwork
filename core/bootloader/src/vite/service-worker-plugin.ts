import { stripTypeScriptTypes } from "node:module";
import type { Plugin } from "vite";

export function serviceworker(): Plugin {
  const serviceWorkerExport =
    "@inkandswitch/patchwork-bootloader/service-worker";
  return {
    name: "@patchwork/vite",
    async buildStart() {
      const exportPath = await this.resolve(serviceWorkerExport);
      const file = await this.fs.readFile(exportPath!.id, {
        encoding: "utf8",
      });
      this.emitFile({
        type: "prebuilt-chunk",
        fileName: "service-worker.js",
        code: stripTypeScriptTypes(file, { mode: "strip" }),
      });
    },
  };
}
