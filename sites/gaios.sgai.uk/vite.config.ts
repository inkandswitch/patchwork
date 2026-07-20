import { defineConfig } from "vite";
import patchwork from "@inkandswitch/patchwork-bootloader/vite";

export default defineConfig({
  plugins: [
    patchwork({
      siteName: "gaios",
      title: "GAIOS",
      description:
        "local-first collaborative & malleable software environment",
      keyhive: process.env.KEYHIVE === "true",
      themeColor: { light: "#ffffff", dark: "#ffffff" },
      syncServers: [
        "https://subduction.sync.inkandswitch.com",
        "https://sync3.automerge.org",
      ],
      icons: { source: "public/gaios.png" },
    }),
  ],
});
