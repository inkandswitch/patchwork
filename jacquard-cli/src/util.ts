import { FolderDoc } from "@patchwork/folder";
import * as A from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  DocHandle,
  Repo,
  StorageId,
} from "@automerge/automerge-repo";
import fs from "fs";
import { PassThrough } from "node:stream";
import { inspect } from "node:util";
import path from "path";
import { fetchOmOnFixedBranch } from "@patchwork/sdk/versionControl";
import { asyncComputedPromise } from "@patchwork/sdk/async-signals";
import os from "os";

export function getBuildMetadataDocUrl(folderDoc: Doc<FolderDoc>) {
  return folderDoc.docs.find((link) => link.name === "Build Metadata")?.url;
}

export async function waitForSync(
  handlesToWaitOn: DocHandle<unknown>[],
  syncServerStorageId: StorageId | undefined
) {
  if (!syncServerStorageId) {
    console.log("No sync server storage ID provided. Waiting forever...");
    return new Promise(() => {});
  }

  console.log("Waiting for sync...");
  await Promise.all(
    handlesToWaitOn.map(
      (handle) =>
        new Promise((resolve) => {
          const newHeads = handle.heads();
          const remoteHeads = handle.getRemoteHeads(syncServerStorageId);

          // If the remote heads are already up to date, we can resolve immediately.
          if (A.equals(newHeads, remoteHeads)) {
            resolve(true);
          }

          // Otherwise, we wait to receive updated an remote-heads event
          handle.on("remote-heads", ({ storageId, heads }) => {
            if (
              storageId === syncServerStorageId &&
              A.equals(newHeads, heads)
            ) {
              resolve(true);
            }
          });
        })
    )
  );
}

type JacquardProjectConfig = {
  projectFolderUrl?: AutomergeUrl;
  syncServer?: {
    url?: string;
    storageId?: StorageId;
  };
  activeBranchUrl?: AutomergeUrl;
  runPrefix?: string;
};

export const getJacquardConfig = () => {
  const currentDir = process.cwd();

  const configFilePath = path.join(currentDir, "jacquard.json");

  if (fs.existsSync(configFilePath)) {
    try {
      const configFileContents = fs.readFileSync(configFilePath, "utf8");
      return JSON.parse(configFileContents) as JacquardProjectConfig;
    } catch (error) {
      console.warn("invalid jacquard.json file");
      return null;
    }
  } else {
    return null;
  }
};

export const sleep = async (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
};

export const addPrefix = (prefix: string | undefined, str: string) =>
  prefix ? `${prefix} ${str}` : str;

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export async function interceptOutput<T>(
  {
    onStdout,
    onStderr,
  }: {
    onStdout?: (data: Uint8Array | string) => void;
    onStderr?: (data: Uint8Array | string) => void;
  },
  cb: () => Promise<T>
): Promise<T> {
  const originalStdout = process.stdout;
  // @ts-ignore
  process.stdout = new PassThrough();
  process.stdout.pipe(originalStdout);
  process.stdout.on("data", (data) => {
    onStdout?.(data);
  });

  const originalStderr = process.stderr;
  // @ts-ignore
  process.stderr = new PassThrough();
  process.stderr.pipe(originalStderr);
  process.stderr.on("data", (data) => {
    onStderr?.(data);
  });

  // At least in Bun, console.log and console.error don't ask for
  // process.stdout/stderr, so we need to intercept them separately.

  const originalConsoleLog = console.log;
  console.log = (...args: any) => {
    // TODO: imperfect stringification
    const output = args.map(stringifyForConsole).join(" ") + "\n";
    onStdout?.(output);
    originalConsoleLog(...args);
  };

  const originalConsoleError = console.error;
  console.error = (...args: any) => {
    // TODO: imperfect stringification
    const output = args.map(stringifyForConsole).join(" ") + "\n";
    onStderr?.(output);
    originalConsoleError(...args);
  };

  try {
    return await cb();
  } finally {
    process.stdout.end();
    process.stderr.end();
    process.stdout = originalStdout;
    process.stderr = originalStderr;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  }
}

function stringifyForConsole(data: any): string {
  if (typeof data === "string") {
    return data;
  } else {
    return inspect(data, { depth: null, colors: true });
  }
}

// a little test of interceptOutput...

// const stdouts: string[] = [];
// const stderrs: string[] = [];
// interceptOutput(
//   {
//     onStdout: (data) => {
//       stdouts.push(data.toString());
//     },
//     onStderr: (data) => {
//       stderrs.push(data.toString());
//     },
//   },
//   async () => {
//     console.log("hello");
//     process.stdout.write("world\n");
//     console.error("error");
//     process.stderr.write("error2\n");
//     await Promise.resolve();
//   }
// );
// console.log("stdouts", stdouts);
// console.log("stderrs", stderrs);

export const replaceExtension = (filePath: string, newExtension: string) => {
  const extension = path.extname(filePath);
  return `${filePath.slice(0, -extension.length)}.${newExtension}`;
};

/**
 * Doc-reactive. Like repo.find, but considers the active branch.
 */
export const fetchOmOnCLIActiveBranch = <T>(
  docUrl: AutomergeUrl,
  repo: Repo
) => {
  const config = getJacquardConfig();
  const branchUrl = config?.activeBranchUrl;
  return fetchOmOnFixedBranch<T>(docUrl, branchUrl, repo);
};

export const omOnCLIActiveBranchPromise = async <T>(
  docUrl: AutomergeUrl,
  repo: Repo
) => {
  return asyncComputedPromise(() => fetchOmOnCLIActiveBranch<T>(docUrl, repo));
};

// Config file storage
const CONFIG_FILE_PATH = path.join(os.homedir(), ".jacquard", "config.json");

export interface JacquardConfig {
  accountUrl?: AutomergeUrl;
  parentFolderUrl?: AutomergeUrl;
}

export function getConfig(): JacquardConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE_PATH)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, "utf-8"));
  } catch (error) {
    return {};
  }
}

export function setConfig(config: Partial<JacquardConfig>) {
  const dir = path.dirname(CONFIG_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const existingConfig = getConfig();
  const newConfig = { ...existingConfig, ...config };

  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));
}

export function getStoredAccountUrl(): AutomergeUrl | undefined {
  return getConfig().accountUrl;
}

export function setStoredAccountUrl(accountUrl: AutomergeUrl) {
  setConfig({ accountUrl });
}

export function getStoredParentFolderUrl(): AutomergeUrl | undefined {
  return getConfig().parentFolderUrl;
}

export function setStoredParentFolderUrl(parentFolderUrl: AutomergeUrl) {
  setConfig({ parentFolderUrl });
}
