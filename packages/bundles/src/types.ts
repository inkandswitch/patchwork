export interface PatchworkBundleOptions {
  /** Path to the project's package.json. Default: "./package.json" relative to cwd */
  packageJsonPath?: string;

  rewrite?: {
    /**
     * How to handle dependencies with `automerge:` version specifiers.
     * - `"patchwork"` (default): rewrite bare imports to service-worker URLs
     *   (`/{encodeURIComponent("automerge:docid")}/resolved/entry.js`),
     *   resolving through the dep's package.json exports with the `"patchwork"` condition.
     * - `"bundle"`: include the dependency code in the bundle normally.
     */
    automerge?: "patchwork" | "bundle";

    /**
     * How to handle npm dependencies (deps that aren't `automerge:` URLs
     * and aren't in the bootloader externals list).
     * - `"bundle"` (default): bundle them normally.
     * - `"esm.sh"`: rewrite to `https://esm.sh/<pkg>@<version>` external URLs.
     */
    npm?: "esm.sh" | "bundle";
  };
}

export interface ResolvedOptions {
  packageJsonPath: string;
  rewrite: {
    automerge: "patchwork" | "bundle";
    npm: "esm.sh" | "bundle";
  };
}

export function resolveOptions(raw?: PatchworkBundleOptions): ResolvedOptions {
  return {
    packageJsonPath: raw?.packageJsonPath ?? "./package.json",
    rewrite: {
      automerge: raw?.rewrite?.automerge ?? "patchwork",
      npm: raw?.rewrite?.npm ?? "bundle",
    },
  };
}
