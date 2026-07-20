import { defineConfig } from "vite";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";

export default defineConfig({
  plugins: [
    patchwork({
      siteName: "patchwork.inkandswitch.com",
      title: "Patchwork",
      description:
        "local-first collaborative & malleable software environment",
      keyhive: process.env.KEYHIVE === "true",
      // Default sync server is sub. Build with KEYHIVE_SYNC_SERVER=true to
      // target keyhive.sync.automerge.org instead.
      keyhiveSyncServer: process.env.KEYHIVE_SYNC_SERVER === "true",
      themeColor: { light: "#f8f8f8", dark: "#181e24" },
      syncServers: [
        "https://subduction.sync.inkandswitch.com",
        "https://sync3.automerge.org",
      ],
      icons: { source: "public/icon-512x512.png" },
    }),
  ],
});
