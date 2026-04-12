import type { Plugin } from "@inkandswitch/patchwork-plugins";
import { toolify } from "@inkandswitch/patchwork-react";

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "dev-swap",
    name: "Dev Swap",
    icon: "FlaskConical",
    supportedDatatypes: ["account"],
    tags: ["context-tool"],
    async load() {
      const { DevSwapPanel } = await import("./DevSwapPanel");
      const { restoreDevSwaps, loadDevSwaps } = await import("./dev-swap-engine");

      // Eagerly restore dev swaps on tool load, not panel mount.
      // This ensures dev plugins are registered with -dev IDs before
      // PatchworkFrame tries to render them.
      const swaps = loadDevSwaps();
      if (Object.keys(swaps).length > 0) {
        if ((window as any).patchwork?.repo) {
          const { repo, accountDocHandle } = (window as any).patchwork;
          restoreDevSwaps(repo, accountDocHandle).catch(console.error);
        } else {
          console.warn("[dev-swap] window.patchwork not available, dev swaps will restore on panel mount");
        }
      }

      return toolify(DevSwapPanel);
    },
  },
];
