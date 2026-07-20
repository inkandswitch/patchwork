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
      icons: { source: "public/gaios.png" },
    }),
  ],
});
