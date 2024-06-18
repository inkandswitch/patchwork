import * as esbuild from "esbuild";
import svgr from "esbuild-plugin-svgr";

await esbuild.build({
  format: "esm",
  entryPoints: ["src/os/main.tsx", "src/os/sdk.ts"],
  bundle: true,
  outdir: "dist",
  plugins: [svgr()],
  external: ["@automerge/automerge-wasm"],
});
