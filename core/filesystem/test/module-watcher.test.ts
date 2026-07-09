import { afterEach, describe, expect, it, vi } from "vitest";
import type { Repo } from "@automerge/automerge-repo/slim";
import { ModuleWatcher } from "../src/module-watcher.js";

/**
 * These tests exercise the static-HTTP-manifest source support added to
 * ModuleWatcher. They avoid any Automerge repo interaction: manifest sources
 * are fetched over HTTP and their (non-automerge) module entries are loaded via
 * plain dynamic `import()`, which we satisfy here with `data:` URLs.
 */

const AUTOMERGE_URL = "automerge:2uZrhZ7G2NJxryZSMWSdDNFCke8C";

function stubFetchManifest(manifestByUrl: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const url = String(input);
      const body = manifestByUrl[url];
      if (body === undefined) {
        return { ok: false, status: 404 } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => body,
      } as Response;
    })
  );
}

function dataModule(source: string): string {
  return `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ModuleWatcher static manifest sources", () => {
  it("resolves relative module URLs against the manifest URL and leaves automerge/absolute URLs untouched", async () => {
    const manifestUrl = "http://example.test/sub/modules.json";
    stubFetchManifest({
      [manifestUrl]: {
        modules: [
          "./tools/file/dist/index.js",
          "https://cdn.example.test/tool/index.js",
          AUTOMERGE_URL,
        ],
      },
    });

    const onLoad = vi.fn();
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: manifestUrl },
      onLoad
    );
    await watcher.doneLoading;

    expect(watcher.staticManifests.system.modules).toEqual([
      "http://example.test/sub/tools/file/dist/index.js",
      "https://cdn.example.test/tool/index.js",
      AUTOMERGE_URL,
    ]);
  });

  it("imports modules listed in a static manifest and announces their plugins", async () => {
    const manifestUrl = "http://example.test/modules.json";
    const moduleUrl = dataModule(
      "export const plugins = [{ type: 'patchwork:tool', id: 'demo' }]"
    );
    stubFetchManifest({
      [manifestUrl]: { modules: [moduleUrl] },
    });

    const loaded: Array<{ name: string; mod: any }> = [];
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: manifestUrl },
      (name, mod) => loaded.push({ name, mod })
    );
    await watcher.doneLoading;

    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe(moduleUrl);
    expect(loaded[0].mod.plugins).toEqual([
      { type: "patchwork:tool", id: "demo" },
    ]);
  });

  it("unions module entries across multiple manifest sources", async () => {
    const systemUrl = "http://example.test/system.json";
    const userUrl = "http://example.test/user.json";
    const a = dataModule("export const plugins = [{ id: 'a' }]");
    const b = dataModule("export const plugins = [{ id: 'b' }]");
    stubFetchManifest({
      [systemUrl]: { modules: [a] },
      [userUrl]: { modules: [b] },
    });

    const ids = new Set<string>();
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: systemUrl, user: userUrl },
      (_name, mod) => {
        for (const p of mod.plugins) ids.add(p.id);
      }
    );
    await watcher.doneLoading;

    expect(ids).toEqual(new Set(["a", "b"]));
  });
});

describe("ModuleWatcher http package resolution", () => {
  it("resolves a trailing-slash directory module via its package.json exports", async () => {
    const manifestUrl = "http://example.test/modules.json";
    const packageUrl = "https://cdn.example.test/mytool/";
    const entryModule = dataModule(
      "export const plugins = [{ type: 'patchwork:tool', id: 'pkg' }]"
    );
    stubFetchManifest({
      [manifestUrl]: { modules: [packageUrl] },
      "https://cdn.example.test/mytool/package.json": {
        exports: { ".": entryModule },
      },
    });

    const loaded: Array<{ name: string; mod: any }> = [];
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: manifestUrl },
      (name, mod) => loaded.push({ name, mod })
    );
    await watcher.doneLoading;

    expect(loaded).toHaveLength(1);
    expect(loaded[0].mod.plugins).toEqual([
      { type: "patchwork:tool", id: "pkg" },
    ]);
  });

  it("treats a directory URL without a trailing slash as a package root and falls back to `main`", async () => {
    const manifestUrl = "http://example.test/modules.json";
    const packageUrl = "https://cdn.example.test/mytool";
    const entryModule = dataModule(
      "export const plugins = [{ type: 'patchwork:tool', id: 'main' }]"
    );
    stubFetchManifest({
      [manifestUrl]: { modules: [packageUrl] },
      "https://cdn.example.test/mytool/package.json": { main: entryModule },
    });

    const loaded: Array<{ name: string; mod: any }> = [];
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: manifestUrl },
      (name, mod) => loaded.push({ name, mod })
    );
    await watcher.doneLoading;

    expect(loaded).toHaveLength(1);
    expect(loaded[0].mod.plugins).toEqual([
      { type: "patchwork:tool", id: "main" },
    ]);
  });

  it("imports a direct module-file URL as-is, without probing for a package.json", async () => {
    const manifestUrl = "http://example.test/modules.json";
    const moduleUrl = "https://cdn.example.test/mytool/index.js";
    const fetch = vi.fn(async (input: string) => {
      const url = String(input);
      if (url === manifestUrl) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ modules: [moduleUrl] }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
    vi.stubGlobal("fetch", fetch);

    // A `.js` URL never triggers a package.json lookup — importing the URL
    // directly is left to the loader (which rejects the http scheme in node).
    const watcher = new ModuleWatcher(
      {} as unknown as Repo,
      { system: manifestUrl },
      () => {}
    );
    await watcher.doneLoading;

    expect(
      fetch.mock.calls.some(([u]) => String(u).endsWith("package.json"))
    ).toBe(false);
  });
});
