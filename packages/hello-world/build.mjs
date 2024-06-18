import * as esbuild from "esbuild";

await esbuild.build({
  format: "esm",
  entryPoints: ["src/index.ts"],
  bundle: true,
  outdir: "dist",
  external: [
    "@patchwork/sdk",
    "@automerge/automerge",
    "@automerge/automerge-repo",
    "@automerge/automerge-repo-react-hooks",
    "@automerge/automerge-wasm",
    "react",
  ],
});
