import { type Plugin, transformWithEsbuild } from "vite";

export function serviceworker(): Plugin {
  const moduleId = "service-worker.js";
  const path = `/${moduleId}`;
  const ids = [moduleId, path];
  const serviceWorkerExport = "@patchwork/bootloader/service-worker";
  return {
    name: "@patchwork/vite",
    resolveId(id) {
      if (ids.includes(id)) {
        return moduleId;
      }
    },
    async load(id) {
      if (ids.includes(id)) {
        const exportPath = await this.resolve(serviceWorkerExport);
        const file = await this.fs.readFile(exportPath!.id, {
          encoding: "utf8",
        });
        const transformation = await transformWithEsbuild(
          file,
          serviceWorkerExport,
          { format: "iife" }
        );
        return transformation;
      }
    },
  };
}
