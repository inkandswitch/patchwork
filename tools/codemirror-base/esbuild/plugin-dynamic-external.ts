import type { PluginBuild } from "esbuild";

export default function dynamicExternal(filter: RegExp) {
  return {
    name: "dynamic-external",
    setup(build: PluginBuild) {
      build.onResolve({ filter }, (args) => {
        return { path: args.path, external: true };
      });
    },
  };
}

// make everything external except for relative paths
export const eternal = dynamicExternal(/^[^./]/);
