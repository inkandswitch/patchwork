#!/usr/bin/env node
/**
 * Register tool URLs in a Patchwork module settings document.
 *
 * Connects to the Subduction sync server, finds the module settings document,
 * and replaces its `modules` array with the provided URLs. If the document
 * is unavailable on the server, creates a fresh one and prints the new URL.
 *
 * Usage:
 *   node scripts/register-modules.mjs <settings-url> <tool-url> [tool-url...]
 *
 * Environment:
 *   SUBDUCTION_SERVER  WebSocket URL (default: wss://subduction.sync.inkandswitch.com)
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error(
    "Usage: register-modules.mjs <settings-url> <tool-url> [tool-url...]"
  );
  process.exit(1);
}

const createNew = args[0] === "--create";
const settingsUrl = createNew ? null : args[0];
const toolUrls = createNew ? args.slice(1) : args.slice(1);

const SUBDUCTION_SERVER =
  process.env.SUBDUCTION_SERVER || "wss://subduction.sync.inkandswitch.com";

const SYNC_TIMEOUT = 30_000;

async function main() {
  // Initialize Subduction Wasm before constructing the Repo.
  // The Repo constructor imports @automerge/automerge-subduction/slim,
  // which may resolve to a different pnpm store path than the bare
  // @automerge/automerge-subduction specifier. We must init the EXACT
  // copy that the Repo will use.
  //
  // Strategy: resolve the slim entry point from the Repo's perspective
  // (using createRequire from the Repo's dist directory), then import
  // the corresponding node.js init entry point via its real filesystem path.
  {
    const { createRequire } = await import("module");
    const { realpathSync } = await import("fs");
    try {
      // Find where @automerge/automerge-repo lives
      const repoRequire = createRequire(
        await import.meta.resolve("@automerge/automerge-repo")
      );
      // Resolve the slim entry point from the Repo's perspective
      const slimPath = repoRequire.resolve(
        "@automerge/automerge-subduction/slim"
      );
      // Navigate to the node.js init entry point in the same package
      const nodeInitPath = join(dirname(slimPath), "node.js");
      const realPath = realpathSync(nodeInitPath);
      await import("file://" + realPath);
    } catch {
      // Fallback: import the bare specifier (works if there's only one copy)
      await import("@automerge/automerge-subduction");
    }
  }

  const { Repo } = await import("@automerge/automerge-repo");
  const { NodeFSStorageAdapter } =
    await import("@automerge/automerge-repo-storage-nodefs");

  const storagePath = join(
    rootDir,
    "node_modules",
    ".cache",
    "register-modules-storage"
  );
  const storage = new NodeFSStorageAdapter(storagePath);

  const repo = new Repo({
    storage,
    subductionWebsocketEndpoints: [SUBDUCTION_SERVER],
    periodicSyncInterval: 2000,
    batchSyncInterval: 0,
  });

  let handle;
  let created = false;

  if (createNew) {
    // Create a fresh settings doc
    console.log(
      `Creating new module settings document with ${toolUrls.length} modules...`
    );
    handle = repo.create({ modules: toolUrls });
    created = true;
    console.log(`Created: ${handle.url}`);
  } else {
    // Try to find the existing settings document
    console.log(`Finding settings doc: ${settingsUrl}`);
    try {
      handle = await Promise.race([
        repo.find(settingsUrl),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timed out loading settings doc")),
            SYNC_TIMEOUT
          )
        ),
      ]);

      const doc = handle.doc();
      console.log(
        `Loaded settings doc (current modules: ${(doc.modules || []).length})`
      );

      // Replace the modules array
      handle.change((d) => {
        if (d.modules) {
          while (d.modules.length > 0) {
            d.modules.deleteAt(0);
          }
        } else {
          d.modules = [];
        }
        for (const url of toolUrls) {
          d.modules.push(url);
        }
      });

      console.log(`Set ${toolUrls.length} module(s) in ${settingsUrl}`);
    } catch (err) {
      // Document unavailable on the server — create a fresh one
      const isUnavailable =
        err.message?.includes("unavailable") ||
        err.message?.includes("Timed out");

      if (!isUnavailable) throw err;

      console.warn(`Settings doc unavailable, creating fresh document...`);
      handle = repo.create({ modules: toolUrls });
      created = true;
      console.log(`Created new settings doc: ${handle.url}`);
      console.warn(
        `\n  *** ACTION REQUIRED ***\n` +
          `  Update SETTINGS_URL in scripts/publish-all-tools.sh\n` +
          `  and defaultToolsUrl in sites/tiny-patchwork/src/main.ts\n` +
          `  to: ${handle.url}\n`
      );
    }
  } // end else (not --create)

  // Wait for sync to settle via head-stability polling
  console.log("Syncing with server...");
  let stableCount = 0;
  let lastHeads = "";
  const start = Date.now();

  while (stableCount < 3 && Date.now() - start < SYNC_TIMEOUT) {
    await new Promise((r) => setTimeout(r, 500));
    const currentHeads = JSON.stringify(handle.heads());
    if (currentHeads === lastHeads) {
      stableCount++;
    } else {
      stableCount = 0;
      lastHeads = currentHeads;
    }
  }

  if (stableCount >= 3) {
    console.log("Sync complete.");
  } else {
    console.warn(
      "Warning: sync may not have completed (timed out waiting for stable heads)."
    );
  }

  if (created) {
    console.log(`Module settings URL: ${handle.url}`);
  }

  await repo.shutdown();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
