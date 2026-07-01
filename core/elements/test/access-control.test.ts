import { afterEach, describe, expect, it, vi } from "vitest";
import { Repo, type AutomergeUrl } from "@automerge/automerge-repo";
import { SyncDenylist } from "../src/isolation/bridges/repo-bridge.js";
import {
  populateDenylist,
  denylistIfSensitive,
} from "../src/isolation/bridges/access-control.js";

/**
 * Covers the two denylist vulnerabilities:
 *  - completeness of the protected set (account doc, module-settings docs incl.
 *    the user's own from the account doc, and transitive tool source);
 *  - the lazy classifier recognizing those by identity/membership/type/cache,
 *    while NOT over-blocking user-content folders (provenance, not shape).
 */

const repos: Repo[] = [];
function makeRepo(): Repo {
  const repo = new Repo({});
  repos.push(repo);
  return repo;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(repos.map((r) => r.shutdown().catch(() => {})));
  repos.length = 0;
});

/** A folder doc { title, docs[] }. Used for both tool-source and user content. */
function createFolder(repo: Repo, childUrls: AutomergeUrl[] = []): AutomergeUrl {
  const handle = repo.create<any>();
  handle.change((d: any) => {
    d.title = "folder";
    d.docs = childUrls.map((url) => ({ name: "child", type: "file", url }));
  });
  return handle.url;
}

/** A module-settings doc referencing the given module-entry (folder) URLs. */
function createModuleSettings(
  repo: Repo,
  moduleUrls: AutomergeUrl[]
): AutomergeUrl {
  const handle = repo.create<any>();
  handle.change((d: any) => {
    d["@patchwork"] = { type: "patchwork:module-settings" };
    d.modules = moduleUrls;
  });
  return handle.url;
}

function createBranches(repo: Repo, branchUrls: AutomergeUrl[]): AutomergeUrl {
  const handle = repo.create<any>();
  handle.change((d: any) => {
    d["@patchwork"] = { type: "branches" };
    d.branches = Object.fromEntries(branchUrls.map((u, i) => [`b${i}`, u]));
  });
  return handle.url;
}

/** Stub the window globals the denylist reads. */
function stubWindow(opts: {
  accountUrl?: AutomergeUrl;
  accountDoc?: Record<string, unknown>;
  watcherUrls?: Record<string, AutomergeUrl>;
}) {
  vi.stubGlobal("window", {
    accountDocHandle: opts.accountUrl
      ? { url: opts.accountUrl, doc: () => opts.accountDoc ?? {} }
      : undefined,
    patchwork: { packages: { urls: opts.watcherUrls ?? {} } },
  });
}

describe("denylist population (protected-set completeness)", () => {
  it("denylists the account doc, the user's module settings (from the account doc), and transitive tool source", async () => {
    const repo = makeRepo();

    // Tool source: a module folder with a child source file.
    const sourceChild = repo.create<any>().url;
    const moduleFolder = createFolder(repo, [sourceChild]);
    // The USER's module settings — referenced only from the account doc, NOT
    // present in the watcher snapshot (the P2 scenario).
    const userSettings = createModuleSettings(repo, [moduleFolder]);
    const accountUrl = repo.create<any>().url;

    stubWindow({
      accountUrl,
      accountDoc: { moduleSettingsUrl: userSettings },
      watcherUrls: {}, // watcher hasn't been wired with the user settings yet
    });

    const denylist = new SyncDenylist();
    await populateDenylist(repo, denylist);

    expect(denylist.hasUrl(accountUrl)).toBe(true);
    expect(denylist.hasUrl(userSettings)).toBe(true);
    expect(denylist.hasUrl(moduleFolder)).toBe(true);
    expect(denylist.hasUrl(sourceChild)).toBe(true);
  });
});

describe("denylistIfSensitive (lazy classifier)", () => {
  it("recognizes the account doc by identity even if populate never ran", async () => {
    const repo = makeRepo();
    const accountUrl = repo.create<any>().url;
    stubWindow({ accountUrl, accountDoc: {} });

    const denylist = new SyncDenylist();
    expect(await denylistIfSensitive(repo, accountUrl, denylist)).toBe(true);
    expect(denylist.hasUrl(accountUrl)).toBe(true);
  });

  it("recognizes a branches doc by type and denylists its branches", async () => {
    const repo = makeRepo();
    const branchFolder = createFolder(repo);
    const branches = createBranches(repo, [branchFolder]);
    stubWindow({});

    const denylist = new SyncDenylist();
    expect(await denylistIfSensitive(repo, branches, denylist)).toBe(true);
    expect(denylist.hasUrl(branches)).toBe(true);
    expect(denylist.hasUrl(branchFolder)).toBe(true);
  });

  it("recognizes a tool-source folder via the populated denylist (provenance), and does NOT block a user-content folder of identical shape", async () => {
    const repo = makeRepo();

    const toolSourceFolder = createFolder(repo);
    const userSettings = createModuleSettings(repo, [toolSourceFolder]);
    const accountUrl = repo.create<any>().url;
    stubWindow({
      accountUrl,
      accountDoc: { moduleSettingsUrl: userSettings },
    });

    const denylist = new SyncDenylist();
    await populateDenylist(repo, denylist);

    // Tool-source folder: caught (it was reached from module settings → on the
    // denylist), even though it has no distinguishing type.
    expect(await denylistIfSensitive(repo, toolSourceFolder, denylist)).toBe(
      true
    );

    // A structurally identical user-content folder, NOT reachable from module
    // settings, must remain allowlistable.
    const userFolder = createFolder(repo, [repo.create<any>().url]);
    expect(await denylistIfSensitive(repo, userFolder, denylist)).toBe(false);
  });
});

describe("getDenylist singleton", () => {
  it("returns the same instance and reports ready after population", async () => {
    // Imported lazily so the module-level singleton isn't shared with the
    // other suites' expectations.
    const { getDenylist } = await import(
      "../src/isolation/bridges/access-control.js"
    );
    const repo = makeRepo();
    stubWindow({ accountUrl: repo.create<any>().url, accountDoc: {} });

    const a = getDenylist(repo);
    const b = getDenylist(repo);
    expect(a).toBe(b); // same singleton, no re-populate
    await a.whenReady();
    expect(a.isReady).toBe(true);
  });
});
