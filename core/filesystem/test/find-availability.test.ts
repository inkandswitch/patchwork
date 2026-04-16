/**
 * Diagnostic tests for repo.find() availability in automerge-repo
 * subduction.9 — isolating the Tab ↔ SW sync architecture.
 *
 * These tests probe the DocumentQuery lifecycle to determine under
 * what conditions find() resolves, rejects, or hangs forever.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  Repo,
  generateAutomergeUrl,
  type PeerId,
  type SharePolicy,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";

// ── Helpers ────────────────────────────────────────────────────────────

const shareAll: SharePolicy = async () => true;

function pause(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Race a promise against a timeout — returns the result or throws. */
function withTimeout<T>(p: Promise<T>, ms: number, label = ""): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`timed out after ${ms}ms${label ? `: ${label}` : ""}`)
          ),
        ms
      )
    ),
  ]);
}

interface TestDoc {
  foo: string;
  bar?: string;
}

interface FolderTestDoc {
  title: string;
  docs: Array<{ name: string; url: string; type: string }>;
}

// Track repos for cleanup
const repos: Repo[] = [];

function createRepo(opts: ConstructorParameters<typeof Repo>[0] = {}): Repo {
  const repo = new Repo(opts);
  repos.push(repo);
  return repo;
}

afterEach(async () => {
  await Promise.all(repos.map((r) => r.shutdown().catch(() => {})));
  repos.length = 0;
});

// ── Tests ──────────────────────────────────────────────────────────────

describe("repo.find() availability", () => {
  // ─── Test 1: Baseline — find() on same repo ──────────────────────
  it("find() resolves for a doc created on the same repo", async () => {
    const repo = createRepo({
      peerId: "solo" as PeerId,
    });

    const handle = repo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "hello";
    });

    const found = await withTimeout(repo.find<TestDoc>(handle.url), 5000);
    expect(found.doc().foo).toBe("hello");
  });

  // ─── Test 2: find() between two repos via MessageChannel ─────────
  it("find() resolves between two repos connected via MessageChannel", async () => {
    const { port1, port2 } = new MessageChannel();

    const repoA = createRepo({
      peerId: "a" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    const repoB = createRepo({
      peerId: "b" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const handle = repoA.create<TestDoc>();
    handle.change((d) => {
      d.foo = "synced";
    });

    // Give the adapters a moment to connect
    await pause(100);

    const found = await withTimeout(
      repoB.find<TestDoc>(handle.url),
      5000,
      "repoB.find via MessageChannel"
    );
    expect(found.doc().foo).toBe("synced");
  });

  // ─── Test 3: find() rejects when no peers are connected ──────────
  it("find() rejects with 'unavailable' when no peer has the doc", async () => {
    const { port1 } = new MessageChannel();

    const repo = createRepo({
      peerId: "lonely" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    // Use a valid URL that nobody has
    const fakeUrl = generateAutomergeUrl();

    await expect(
      withTimeout(repo.find<TestDoc>(fakeUrl), 5000, "find nonexistent doc")
    ).rejects.toThrow(/unavailable|timed out/);
  });

  // ─── Test 4: networkSubsystem.whenReady() with MessageChannel ────
  describe("networkSubsystem.whenReady()", () => {
    it("resolves when both sides of the MessageChannel are connected", async () => {
      const { port1, port2 } = new MessageChannel();

      const repoA = createRepo({
        peerId: "a" as PeerId,
        network: [new MessageChannelNetworkAdapter(port1)],
      });

      const repoB = createRepo({
        peerId: "b" as PeerId,
        network: [new MessageChannelNetworkAdapter(port2)],
      });

      // Both should resolve
      await withTimeout(
        repoA.networkSubsystem.whenReady(),
        5000,
        "repoA.networkSubsystem.whenReady"
      );
      await withTimeout(
        repoB.networkSubsystem.whenReady(),
        5000,
        "repoB.networkSubsystem.whenReady"
      );
    });

    it("resolves when only one side of the MessageChannel exists (dangling port)", async () => {
      const { port1 } = new MessageChannel();

      const repo = createRepo({
        peerId: "dangling" as PeerId,
        network: [new MessageChannelNetworkAdapter(port1)],
      });

      // Does whenReady() resolve even if port2 was never given to a Repo?
      // This simulates the case where the SW hasn't connected yet.
      await withTimeout(
        repo.networkSubsystem.whenReady(),
        5000,
        "dangling port whenReady"
      );
    });
  });

  // ─── Test 5: find() when MessageChannel added AFTER find() call ──
  it("find() resolves when MessageChannel peer connects after find() is called", async () => {
    const { port1, port2 } = new MessageChannel();

    // Create tab repo with its side of the MessageChannel
    const tabRepo = createRepo({
      peerId: "tab" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    // Create SW repo WITHOUT network initially — doc is local to SW
    const swRepo = createRepo({
      peerId: "sw" as PeerId,
      sharePolicy: shareAll,
    });

    const handle = swRepo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "from-sw";
    });

    // Tab calls find() BEFORE the SW connects its MessageChannel
    const findPromise = tabRepo.find<TestDoc>(handle.url);

    // Wait a moment, then connect the SW side
    await pause(500);
    swRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(port2)
    );

    // Give some time for sync
    await pause(100);

    // Does the previously-started find() now resolve?
    const found = await withTimeout(
      findPromise,
      10000,
      "find after late MessageChannel connect"
    );
    expect(found.doc().foo).toBe("from-sw");
  });

  // ─── Test 6: find() with delayed document creation on remote ─────
  it("find() resolves when the remote creates the doc after find() is called", async () => {
    const { port1, port2 } = new MessageChannel();

    const tabRepo = createRepo({
      peerId: "tab" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    const swRepo = createRepo({
      peerId: "sw" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    // Let adapters connect
    await pause(100);

    // Create doc on SW first, get URL
    const handle = swRepo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "late-create";
    });

    // Tab finds the doc (it exists on the remote but was just created)
    const found = await withTimeout(
      tabRepo.find<TestDoc>(handle.url),
      5000,
      "find doc created after channel connect"
    );
    expect(found.doc().foo).toBe("late-create");
  });

  // ─── Test 7: Retry after unavailable ─────────────────────────────
  it("a second find() succeeds after the first one rejected with unavailable", async () => {
    const { port1, port2 } = new MessageChannel();

    // Tab repo with dangling port (port2 not connected to anything)
    const tabRepo = createRepo({
      peerId: "tab" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    // SW repo (not yet connected)
    const swRepo = createRepo({
      peerId: "sw" as PeerId,
      sharePolicy: shareAll,
    });

    const handle = swRepo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "retry-me";
    });

    // First find() — should reject because no peer has it
    // (The query may either reject with "unavailable" or hang — we test both)
    let firstFailed = false;
    try {
      await withTimeout(
        tabRepo.find<TestDoc>(handle.url),
        3000,
        "first find (expected to fail)"
      );
    } catch {
      firstFailed = true;
    }
    expect(firstFailed).toBe(true);

    // Now connect the SW via port2
    swRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(port2)
    );
    await pause(200);

    // Second find() — should succeed because the SW is now connected
    const found = await withTimeout(
      tabRepo.find<TestDoc>(handle.url),
      5000,
      "second find after SW connects"
    );
    expect(found.doc().foo).toBe("retry-me");
  });

  // ─── Test 8: find() never settles diagnosis ──────────────────────
  it("diagnose: find() behavior when no source can provide the doc", async () => {
    const { port1, port2 } = new MessageChannel();

    const tabRepo = createRepo({
      peerId: "tab" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    // Connect both sides but neither has the doc
    createRepo({
      peerId: "sw" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    await pause(100);

    const fakeUrl = generateAutomergeUrl();

    // Does find() for a nonexistent doc eventually settle (reject)?
    // Or does it hang forever?
    await expect(
      withTimeout(
        tabRepo.find<TestDoc>(fakeUrl),
        10000,
        "find nonexistent doc with connected peer"
      )
    ).rejects.toThrow(/unavailable|timed out/);
  });

  // ─── Test 9: find() behavior with NO network adapters ────────────
  it("find() for an unknown doc on a repo with no network", async () => {
    const repo = createRepo({
      peerId: "isolated" as PeerId,
    });

    const fakeUrl = generateAutomergeUrl();

    // With no network and no storage, find() should settle quickly
    await expect(
      withTimeout(repo.find<TestDoc>(fakeUrl), 5000, "find on isolated repo")
    ).rejects.toThrow(/unavailable|timed out/);
  });

  // ─── Test 10: Simulated patchwork architecture ───────────────────
  // Tab (no subduction) ←MessageChannel→ SW (with doc in memory)
  it("patchwork architecture: Tab repo finds doc via SW relay", async () => {
    const { port1, port2 } = new MessageChannel();

    // SW-side Repo: has the doc, connected via MessageChannel
    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    // Create a folder-like doc on the SW side (simulating what prefetch does)
    const folderHandle = swRepo.create<FolderTestDoc>();
    folderHandle.change((d) => {
      d.title = "test-tool";
      d.docs = [
        { name: "package.json", url: "automerge:fake-pkg", type: "file" },
      ];
    });

    // Tab-side Repo: no subduction endpoints, syncs via MessageChannel to SW
    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    // Wait for MessageChannel connection to establish
    await pause(200);

    // Tab tries to find the folder doc (this is what ModuleWatcher does)
    const found = await withTimeout(
      tabRepo.find<FolderTestDoc>(folderHandle.url),
      5000,
      "tab finds folder doc via SW MessageChannel"
    );

    expect(found.doc().title).toBe("test-tool");
    expect(found.doc().docs).toHaveLength(1);
    expect(found.doc().docs[0].name).toBe("package.json");
  });

  // ─── Test 11: Patchwork startup race ─────────────────────────────
  // The exact race condition: tab calls find() while SW is still syncing
  it("patchwork startup race: find() called before SW has the doc, SW gets it later", async () => {
    const { port1, port2 } = new MessageChannel();

    // Both repos connected via MessageChannel from the start
    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    await pause(100); // let adapters connect

    // Tab calls find() for a doc that doesn't exist yet
    // (simulating ModuleWatcher firing before SW prefetch completes)
    let resolvedUrl: AutomergeUrl | undefined;

    // SW creates the doc "later" (simulating Subduction sync completing)
    const folderHandle = swRepo.create<FolderTestDoc>();
    folderHandle.change((d) => {
      d.title = "late-tool";
      d.docs = [];
    });
    resolvedUrl = folderHandle.url;

    // Tab should be able to find it (SW syncs to tab via MessageChannel)
    const found = await withTimeout(
      tabRepo.find<FolderTestDoc>(resolvedUrl),
      5000,
      "tab finds doc that SW creates after connection"
    );
    expect(found.doc().title).toBe("late-tool");
  });

  // ─── Test 12: The exact failure pattern ──────────────────────────
  // Tab repo calls find() for a URL. SW doesn't have it yet.
  // After a delay, SW receives the doc (simulating Subduction sync).
  // Does the tab's find() ever resolve?
  it("critical: tab find() settles after SW receives doc via delayed creation", async () => {
    const { port1, port2 } = new MessageChannel();

    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    await pause(100); // let MessageChannel connect

    // Pre-generate a URL by creating on a third isolated repo
    const seedRepo = createRepo({ peerId: "seed" as PeerId });
    const seedHandle = seedRepo.create<TestDoc>();
    seedHandle.change((d) => {
      d.foo = "seed-data";
    });
    const targetUrl = seedHandle.url;

    // Tab starts looking for the doc (neither tab nor SW have it)
    const findPromise = tabRepo.find<TestDoc>(targetUrl);

    // After 1 second, SW "receives" the doc (simulating Subduction sync)
    // We do this by creating a connected pair: seed → SW
    await pause(1000);
    const { port1: seedToSw, port2: swFromSeed } = new MessageChannel();
    seedRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(seedToSw)
    );
    swRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(swFromSeed)
    );

    // Give time for seed → SW → tab sync chain
    // The question: does the tab's find() resolve?
    const found = await withTimeout(
      findPromise,
      10000,
      "tab find() after SW receives doc from seed"
    );
    expect(found.doc().foo).toBe("seed-data");
  });

  // ─── Test 13: Exact patchwork scenario ───────────────────────────
  // Tab calls find(). SW peer says "unavailable". Tab's query stays
  // in "loading" (thanks to upstream fix #1). SW later gets the doc
  // from a third repo (simulating Subduction). Does the SW re-send
  // data to the tab, and does the tab's find() resolve?
  //
  // This tests the full cycle:
  //   1. Tab → SW: "do you have X?" (sync request)
  //   2. SW → Tab: "no" (doc-unavailable)
  //   3. [time passes] SW gets X from Subduction (seed repo)
  //   4. SW → Tab: [sync message with data]  ← THIS is what we're testing
  //   5. Tab's find() resolves
  it("SW pushes doc to tab after initial doc-unavailable", async () => {
    const { port1, port2 } = new MessageChannel();

    // Both repos connected from the start
    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    await pause(100); // let MessageChannel connect

    // Create doc on an isolated repo (simulates: doc exists only on Subduction server)
    const seedRepo = createRepo({ peerId: "seed" as PeerId });
    const seedHandle = seedRepo.create<TestDoc>();
    seedHandle.change((d) => {
      d.foo = "from-subduction";
    });
    const targetUrl = seedHandle.url;

    // Tab calls find() — neither tab nor SW have it
    const findPromise = tabRepo.find<TestDoc>(targetUrl);

    // Wait for the SW to respond "doc-unavailable" to the tab.
    // The sync protocol exchange is fast (~50ms).
    await pause(500);

    // Verify the tab's find() hasn't resolved yet
    let resolved = false;
    findPromise
      .then(() => {
        resolved = true;
      })
      .catch(() => {});
    expect(resolved).toBe(false);

    // Now simulate Subduction sync: seed repo connects to SW
    const { port1: seedToSw, port2: swFromSeed } = new MessageChannel();
    seedRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(seedToSw)
    );
    swRepo.networkSubsystem.addNetworkAdapter(
      new MessageChannelNetworkAdapter(swFromSeed)
    );

    // SW gets the doc from seed. The critical question:
    // Does the SW then push it to the tab?
    const found = await withTimeout(
      findPromise,
      10000,
      "tab find() after SW gets doc from seed (post doc-unavailable)"
    );
    expect(found.doc().foo).toBe("from-subduction");
  });

  // ─── Test 14: Same as 13 but tab calls find() AFTER SW gets doc ──
  // This verifies the simpler case: if the SW already has the doc,
  // a fresh find() from the tab should resolve quickly.
  it("tab find() resolves when SW already has doc from prior sync", async () => {
    const { port1, port2 } = new MessageChannel();

    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    await pause(100); // let MessageChannel connect

    // SW already has the doc (simulates: prefetch completed)
    const handle = swRepo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "already-prefetched";
    });

    // Wait for the sync protocol to exchange initial state
    await pause(200);

    // Tab calls find() — SW already has it
    const found = await withTimeout(
      tabRepo.find<TestDoc>(handle.url),
      5000,
      "tab find() when SW already has doc"
    );
    expect(found.doc().foo).toBe("already-prefetched");
  });

  // ─── Test 15: Multiple rapid find() calls for same doc ───────────
  // The ModuleWatcher calls find() for all 26 tools concurrently.
  // Verify multiple find() calls for the same doc don't interfere.
  it("concurrent find() calls from tab all resolve when SW gets doc", async () => {
    const { port1, port2 } = new MessageChannel();

    const swRepo = createRepo({
      peerId: "service-worker" as PeerId,
      network: [new MessageChannelNetworkAdapter(port2)],
      sharePolicy: shareAll,
    });

    const tabRepo = createRepo({
      peerId: "tab-main" as PeerId,
      network: [new MessageChannelNetworkAdapter(port1)],
      sharePolicy: shareAll,
    });

    await pause(100);

    // SW has the doc
    const handle = swRepo.create<TestDoc>();
    handle.change((d) => {
      d.foo = "concurrent";
    });

    await pause(200);

    // Multiple concurrent find() calls from the tab
    const results = await withTimeout(
      Promise.all([
        tabRepo.find<TestDoc>(handle.url),
        tabRepo.find<TestDoc>(handle.url),
        tabRepo.find<TestDoc>(handle.url),
      ]),
      5000,
      "concurrent find() calls"
    );

    for (const r of results) {
      expect(r.doc().foo).toBe("concurrent");
    }
  });
});
