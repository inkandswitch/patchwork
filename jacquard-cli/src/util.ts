import { FolderDoc } from "@/packages/folder";
import * as A from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  DocHandle,
  StorageId,
} from "@automerge/automerge-repo";
import crypto from "crypto";
import fs from "fs";
import { isBinaryFileSync } from "isbinaryfile";
import path from "path";
import { FileContent } from "../../packages/file/src/datatype";
import { PassThrough } from "node:stream";
import { inspect } from "node:util";

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

  console.log("Waiting for files to sync...");
  return Promise.all(
    handlesToWaitOn.map(
      (handle) =>
        new Promise((resolve) => {
          const newHeads = A.getHeads(handle.docSync()!); // TODO: JAH strict fix
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

type JacquardConfig = {
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
      return JSON.parse(configFileContents) as JacquardConfig;
    } catch (error) {
      console.warn("invalid jacquard.json file");
      return null;
    }
  } else {
    return null;
  }
};

const ENDPOINT_URL = "https://file-server-txxa.onrender.com/file";

export const uploadFile = async (
  fileBuffer: Uint8Array,
  mimeType: string | false
): Promise<string> => {
  try {
    const response = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const responseData = await response.json();
    return responseData.url as string;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const sha256 = (buffer: Uint8Array) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

export const sleep = async (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
};

export const fetchFile = async (url: string): Promise<Uint8Array> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

export const addPrefix = (prefix: string | undefined, str: string) =>
  prefix ? `${prefix} ${str}` : str;

const isBinaryFileJacquard = (filePath: string) => {
  // extensions that are binary but not detected by isbinaryfile
  const BINARY_FILE_EXTENSIONS = [
    // fits is a binary format for images often used in astronomy,
    // the format has a human readable ASCII header which trips up isbinaryfile
    ".fits",
  ];
  return (
    isBinaryFileSync(filePath) ||
    BINARY_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext))
  );
};

export const readFileContent = (
  filePath: string
): FileContent & { type: "binary" | "text" } => {
  if (isBinaryFileJacquard(filePath)) {
    return { type: "binary", value: fs.readFileSync(filePath) };
  } else {
    return { type: "text", value: fs.readFileSync(filePath, "utf8") };
  }
};

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
