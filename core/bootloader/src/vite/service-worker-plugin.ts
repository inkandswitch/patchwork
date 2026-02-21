import { type Plugin, transformWithEsbuild } from "vite";
import type { RollupFsModule } from "rollup";

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
      const transformation = await transformWithEsbuild(
        file,
        serviceWorkerExport,
        { format: "iife" }
      );
      this.emitFile({
        type: "prebuilt-chunk",
        fileName: "service-worker.js",
        code: transformation.code,
        map: transformation.map,
      });
    },
  };
}
