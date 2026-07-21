import { defineConfig } from "vite";

const studio = process.env.PATCHWORK_BUILD_MODE === "studio";

const { default: patchwork } = await import("@inkandswitch/patchwork/vite");

export default defineConfig({
  plugins: [
    patchwork({
      siteName: "patchwork.inkandswitch.com",
      title: "Patchwork",
      description: "local-first collaborative malleable software environment",
      syncServers:
        process.env.KEYHIVE === "true"
          ? {
              keyhive:
                process.env.KEYHIVE_SYNC_SERVER === "true"
                  ? "keyhive"
                  : "subduction",
            }
          : undefined,
      themeColor: { light: "#f8f8f8", dark: "#181e24" },
      icons: {
        source: "public/patchwork.svg",
        maskIcon: "public/mask.svg",
      },
    }),
  ],
});
