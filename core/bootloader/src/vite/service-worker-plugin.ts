import { type Plugin, transformWithEsbuild } from "vite";
import { type ResolvedId, type RollupFsModule } from "rollup";

export function serviceworker(): Plugin {
  const moduleId = "service-worker.js";
  const path = `/${moduleId}`;
  const ids = [moduleId, path];
  const serviceWorkerExport = "@patchwork/bootloader/service-worker";
  async function transform(
    resolve: (source: string) => Promise<ResolvedId | null>,
    fs: RollupFsModule
  ) {
    const exportPath = await resolve(serviceWorkerExport);
    const file = await fs.readFile(exportPath!.id, {
      encoding: "utf8",
    });
    const transformation = await transformWithEsbuild(
      file,
      serviceWorkerExport,
      { format: "iife" }
    );
    return transformation;
  }
  return {
    name: "@patchwork/vite",
    async buildStart() {
      if (this.environment.mode == "build") {
        const trans = await transform(this.resolve.bind(this), this.fs);
        this.emitFile({
          type: "prebuilt-chunk",
          fileName: path.slice(1),
          code: trans.code,
          map: trans.map,
        });
      }
    },
    resolveId(id) {
      if (ids.includes(id)) {
        return moduleId;
      }
    },
    async load(id) {
      if (ids.includes(id)) {
        return transform(this.resolve.bind(this), this.fs);
      }
    },
  };
}
