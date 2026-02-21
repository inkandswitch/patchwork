import type { Plugin } from "vite";

export function serviceworker(): Plugin {
  return {
    name: "@patchwork/service-worker",
    async buildStart() {
      const resolved = await this.resolve(
        "@inkandswitch/patchwork-bootloader/service-worker"
      );
      this.emitFile({
        type: "chunk",
        id: resolved!.id,
        fileName: "service-worker.js",
      });
    },
  };
}
