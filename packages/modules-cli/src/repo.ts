import * as Automerge from "@automerge/automerge";
import {
  Repo,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

const STORAGE_DIR = path.join(os.homedir(), ".patchwork-modules");
const DEFAULT_SYNC_SERVER = "wss://sync3.automerge.org";

export async function createRepo(
  syncServer = DEFAULT_SYNC_SERVER
): Promise<Repo> {
  Automerge.init();

  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const repo = new Repo({
    storage: new NodeFSStorageAdapter(STORAGE_DIR),
    network: [new WebSocketClientAdapter(syncServer)],
  });

  return repo;
}

export async function findDoc<T>(
  repo: Repo,
  url: AutomergeUrl
): Promise<DocHandle<T>> {
  const handle = await repo.find<T>(url);
  await handle.whenReady();
  return handle;
}

/** Wait a bit for network sync to propagate */
export function waitForSync(ms = 3000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
