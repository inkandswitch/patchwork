import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { resolve as resolveExports } from "resolve.exports";

/**
 * Read and parse a package.json file.
 */
export function readPackageJson(path: string): Record<string, any> {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Parse a bare import specifier into package name and subpath.
 *
 * - `"abc"` → `{ pkgName: "abc", subpath: "." }`
 * - `"abc/utils"` → `{ pkgName: "abc", subpath: "./utils" }`
 * - `"@scope/pkg"` → `{ pkgName: "@scope/pkg", subpath: "." }`
 * - `"@scope/pkg/utils"` → `{ pkgName: "@scope/pkg", subpath: "./utils" }`
 */
export function parseBareSpecifier(id: string): {
  pkgName: string;
  subpath: string;
} {
  const firstSlash = id.indexOf("/");
  const isScoped = id.startsWith("@");

  if (isScoped) {
    const secondSlash = id.indexOf("/", firstSlash + 1);
    if (secondSlash === -1) {
      return { pkgName: id, subpath: "." };
    }
    return {
      pkgName: id.slice(0, secondSlash),
      subpath: "./" + id.slice(secondSlash + 1),
    };
  }

  if (firstSlash === -1) {
    return { pkgName: id, subpath: "." };
  }

  return {
    pkgName: id.slice(0, firstSlash),
    subpath: "./" + id.slice(firstSlash + 1),
  };
}

/**
 * Returns true if the specifier is a bare import (not relative, absolute,
 * or a protocol URL).
 */
export function isBareSpecifier(id: string): boolean {
  return (
    id.length > 0 &&
    !id.startsWith(".") &&
    !id.startsWith("/") &&
    !id.includes(":")
  );
}

/**
 * Resolve a dependency's entry point by reading its package.json from
 * `node_modules/` and resolving through its `exports` field.
 *
 * Returns the resolved path relative to the package root (e.g. `"./dist/index.js"`),
 * or the subpath itself if resolution fails.
 */
export function resolveDepEntryPoint(
  pkgName: string,
  subpath: string = ".",
  conditions: string[] = ["patchwork", "browser", "import"]
): string {
  try {
    const depPkgJsonPath = resolvePath(
      process.cwd(),
      "node_modules",
      pkgName,
      "package.json"
    );
    const depPkgJson = readPackageJson(depPkgJsonPath);

    const resolved = resolveExports(depPkgJson, subpath, { conditions });
    if (resolved && resolved[0]) {
      return resolved[0];
    }

    // Fallback to "main" for root export
    if (subpath === "." && typeof depPkgJson.main === "string") {
      return depPkgJson.main;
    }
  } catch {
    // If we can't read the dep's package.json, just pass through the subpath
  }

  return subpath;
}
