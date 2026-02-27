/**
 * Creates a Repo instance with Subduction for Node.js.
 *
 * Uses:
 * - NodeFSStorageAdapter for persistent storage
 * - SubductionStorageBridge to wrap storage for Subduction
 * - NodeFSSigner for Ed25519 signing with file persistence
 * - SubductionWebSocket for sync server connection
 */

import {
  Repo,
  setSubductionModule,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import {
  SubductionStorageBridge,
  initSubductionModule,
} from "@automerge/automerge-repo-subduction-bridge";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

import { NodeFSSigner, setPeerIdConstructor } from "./node-signer.js";

const STORAGE_DIR = path.join(os.homedir(), ".patchwork-modules");
const DEFAULT_SYNC_SERVER = "wss://hel.subduction.keyhive.org";

let repoInstance: Repo | null = null;
let subductionInstance: any = null;

export async function createRepo(
  syncServer = DEFAULT_SYNC_SERVER
): Promise<Repo> {
  // Return cached instance if available
  if (repoInstance) {
    return repoInstance;
  }

  // Ensure storage directory exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // Dynamic import of subduction module (it's a wasm module)
  const subductionModule = await import("@automerge/automerge-subduction");
  const { Subduction, SubductionWebSocket, PeerId } = subductionModule;

  // Initialize wasm and register module
  // For Node.js builds, the wasm is typically auto-initialized
  // but we call initSubductionModule to register it with the bridges
  initSubductionModule(subductionModule);
  setSubductionModule(subductionModule);

  // Set up PeerId constructor for our signer
  setPeerIdConstructor(PeerId);

  // Create signer (persisted to disk)
  const signer = await NodeFSSigner.setup(STORAGE_DIR);
  console.log(`Using peer ID: ${signer.peerId().toString()}`);

  // Create storage bridge wrapping NodeFS adapter
  const storageAdapter = new NodeFSStorageAdapter(STORAGE_DIR);
  const storage = new SubductionStorageBridge(storageAdapter);

  // Hydrate Subduction from storage
  const subduction = await Subduction.hydrate(signer, storage);
  subductionInstance = subduction;

  // Connect to sync server
  try {
    const conn = await SubductionWebSocket.tryDiscover(
      new URL(syncServer),
      signer
    );
    await subduction.attach(conn);
    console.log(`Connected to sync server: ${syncServer}`);
  } catch (e) {
    console.warn(`Could not connect to sync server ${syncServer}:`, e);
    console.warn("Running in offline mode");
  }

  // Create Repo with Subduction
  const repo = new Repo({
    subduction,
    peerId: `modules-cli-${Math.random().toString(36).slice(2)}` as any,
  });

  repoInstance = repo;
  return repo;
}

export async function findDoc<T>(
  repo: Repo,
  url: AutomergeUrl
): Promise<DocHandle<T>> {
  // repo.find() now returns a Promise that resolves when the document is ready
  const handle = await repo.find<T>(url);
  return handle;
}

/**
 * Wait for sync operations to complete.
 * This now waits for the Subduction storage bridge to settle.
 */
export async function waitForSync(ms = 3000): Promise<void> {
  // Give network time to propagate
  await new Promise((resolve) => setTimeout(resolve, ms));

  // If we have a subduction instance with storage that supports awaitSettled, use it
  if (subductionInstance?.storage?.awaitSettled) {
    await subductionInstance.storage.awaitSettled();
  }
}

/**
 * Gracefully disconnect from sync server.
 */
export async function disconnect(): Promise<void> {
  if (subductionInstance) {
    await subductionInstance.disconnectAll();
  }
}
