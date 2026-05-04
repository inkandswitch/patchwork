import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { build as viteBuild } from "vite";
import * as esbuild from "esbuild";

const AUTOMERGE_URL = "automerge:kFcrzeDmr5zXE1jShvxUPsoToAN";
const ENCODED_URL = encodeURIComponent(AUTOMERGE_URL);

describe("patchwork-bundles integration", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(
      path.join(originalCwd, "test/.tmp-integration-")
    );

    // Phase 1: set up project and install the pnpm resolver from github
    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify(
        {
          name: "test-patchwork-bundles",
          version: "0.0.0",
          type: "module",
          dependencies: {
            "pnpm-resolver-patchwork":
              "github:chee/pnpm-resolver-patchwork",
          },
        },
        null,
        2
      )
    );

    // pnpm-workspace.yaml (needed for pnpmfile config)
    await fs.writeFile(
      path.join(tmpDir, "pnpm-workspace.yaml"),
      "pnpmfile: .pnpmfile.mjs\n"
    );

    // .npmrc — avoid strict peer deps issues
    await fs.writeFile(
      path.join(tmpDir, ".npmrc"),
      "strict-peer-dependencies=false\nauto-install-peers=true\n"
    );

    // install resolver first (pnpmfile needs it available)
    execSync("npx pnpm@next-11 install --no-frozen-lockfile", {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 120_000,
    });

    // Phase 2: configure resolver and add automerge + solid-js deps
    await fs.writeFile(
      path.join(tmpDir, ".pnpmfile.mjs"),
      [
        `import { createPnpmPlugin } from "pnpm-resolver-patchwork"`,
        `const patchwork = createPnpmPlugin()`,
        `export const resolvers = [...patchwork.resolvers]`,
        `export const fetchers = [...patchwork.fetchers]`,
        "",
      ].join("\n")
    );

    await fs.writeFile(
      path.join(tmpDir, "package.json"),
      JSON.stringify(
        {
          name: "test-patchwork-bundles",
          version: "0.0.0",
          type: "module",
          dependencies: {
            "pnpm-resolver-patchwork":
              "github:chee/pnpm-resolver-patchwork",
            "my-sideboard-tool": AUTOMERGE_URL,
            "solid-js": "^1.9.9",
          },
        },
        null,
        2
      )
    );

    // install with resolver active — fetches automerge doc + solid-js
    execSync("npx pnpm@next-11 install --no-frozen-lockfile", {
      cwd: tmpDir,
      stdio: "pipe",
      timeout: 120_000,
    });

    // Phase 3: set up fake bootloader for externals list
    const bootloaderDir = path.join(
      tmpDir,
      "node_modules/@inkandswitch/patchwork-bootloader"
    );
    await fs.mkdir(bootloaderDir, { recursive: true });
    await fs.writeFile(
      path.join(bootloaderDir, "package.json"),
      JSON.stringify({
        name: "@inkandswitch/patchwork-bootloader",
        exports: { "./externals": { import: "./externals.js" } },
      })
    );
    await fs.writeFile(
      path.join(bootloaderDir, "externals.js"),
      `const externals = [\n  "solid-js",\n  "solid-js/web",\n  "solid-js/html",\n  "solid-js/store",\n  "solid-js/jsx-runtime",\n  "solid-js/h"\n];\nexport default externals;\n`
    );

    // Phase 4: write source file
    const srcDir = path.join(tmpDir, "src");
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(
      path.join(srcDir, "index.ts"),
      [
        `import { createSignal } from "solid-js";`,
        `import * as sideboard from "my-sideboard-tool";`,
        `console.log(createSignal, sideboard);`,
        "",
      ].join("\n")
    );

    process.chdir(tmpDir);
  }, 180_000);

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("pnpm resolver installed my-sideboard-tool from automerge", () => {
    it("has a package.json with the sideboard package name", async () => {
      const pkgPath = path.join(
        tmpDir,
        "node_modules/my-sideboard-tool/package.json"
      );
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
      expect(pkg.name).toBe("@chee/patchwork-sideboard");
    });

    it("has an exports field with a patchwork condition", async () => {
      const pkgPath = path.join(
        tmpDir,
        "node_modules/my-sideboard-tool/package.json"
      );
      const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
      expect(pkg.exports).toBeDefined();
      expect(pkg.exports["."]).toBeDefined();
      expect(pkg.exports["."].patchwork).toBeDefined();
    });

    it("contains actual dist files from the automerge document", async () => {
      const distDir = path.join(tmpDir, "node_modules/my-sideboard-tool/dist");
      const files = await fs.readdir(distDir);
      expect(files.length).toBeGreaterThan(0);
      // should have js output
      expect(files.some((f) => f.endsWith(".js"))).toBe(true);
    });
  });

  describe("vite build", () => {
    let output: string;

    beforeAll(async () => {
      // Determine what entry point the plugin will resolve to
      const pluginPath = path.resolve(
        originalCwd,
        "packages/bundles/dist/vite.js"
      );
      const { default: vitePlugin } = await import(pluginPath);

      const result = await viteBuild({
        root: tmpDir,
        logLevel: "silent",
        build: {
          lib: {
            entry: path.join(tmpDir, "src/index.ts"),
            formats: ["es"],
            fileName: "index",
          },
          outDir: path.join(tmpDir, "dist-vite"),
          write: true,
          minify: false,
        },
        plugins: [vitePlugin()],
      });

      output = await fs.readFile(
        path.join(tmpDir, "dist-vite/index.mjs"),
        "utf-8"
      );
    }, 60_000);

    it("rewrites automerge dep to service-worker URL", () => {
      expect(output).toContain(ENCODED_URL);
      // Should be an import from /<encoded-url>/...
      expect(output).toMatch(new RegExp(`from ["']/${ENCODED_URL}/`));
    });

    it("externalizes solid-js", () => {
      expect(output).toMatch(/from ["']solid-js["']/);
      // solid-js code should NOT be inlined
      expect(output).not.toContain("createSignal");
    });

    it("does not contain bundled automerge dep code", () => {
      // The automerge dep should be external, not inlined
      expect(output).not.toContain("my-sideboard-tool");
    });
  });

  describe("esbuild build", () => {
    let output: string;

    beforeAll(async () => {
      const pluginPath = path.resolve(
        originalCwd,
        "packages/bundles/dist/esbuild.js"
      );
      const { default: esbuildPlugin } = await import(pluginPath);

      await esbuild.build({
        entryPoints: [path.join(tmpDir, "src/index.ts")],
        bundle: true,
        format: "esm",
        outfile: path.join(tmpDir, "dist-esbuild/index.js"),
        plugins: [esbuildPlugin()],
        logLevel: "silent",
      });

      output = await fs.readFile(
        path.join(tmpDir, "dist-esbuild/index.js"),
        "utf-8"
      );
    }, 60_000);

    it("rewrites automerge dep to service-worker URL", () => {
      expect(output).toContain(ENCODED_URL);
      expect(output).toMatch(new RegExp(`from ["']/${ENCODED_URL}/`));
    });

    it("externalizes solid-js", () => {
      expect(output).toMatch(/from ["']solid-js["']/);
      expect(output).not.toContain("createSignal");
    });

    it("does not contain bundled automerge dep code", () => {
      expect(output).not.toContain("my-sideboard-tool");
    });
  });
});
