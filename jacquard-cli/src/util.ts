import { FolderDoc } from "@/packages/folder";
import * as A from "@automerge/automerge";
import {
  AutomergeUrl,
  Doc,
  DocHandle,
  StorageId,
} from "@automerge/automerge-repo";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { isBinaryFileSync } from "isbinaryfile";

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
  fileBuffer: Buffer,
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

export const sha256 = (buffer: Buffer) =>
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

export const isBinaryFile = (filePath: string) => {
  // fits is a binary format for images often used in astronomy,
  // the format has a human readable ASCII header which trips up the generic is binary function
  // so we need to handle it as a special case
  const BINARY_FILE_EXTENSIONS = [".fits"];
  return (
    isBinaryFileSync(filePath) ||
    BINARY_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext))
  );
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
