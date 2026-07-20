import {
  type DocHandle,
  type Repo,
  isImmutableString,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo/slim";
import type { FolderDoc } from "./types.js";
import { getType } from "./metadata.js";

export type Resolved = {
  content: string | Uint8Array;
  type: string;
};

export interface FolderStrategy {
  matches(doc: unknown): boolean;
  resolve(
    repo: Repo,
    handle: DocHandle<unknown>,
    parts: string[],
    visited: Set<string>
  ): Promise<Resolved | undefined>;
}

// ── folder strategy: FolderDoc with docs[] ──

const folderStrategy: FolderStrategy = {
  matches(doc) {
    return (
      !!doc &&
      typeof doc === "object" &&
      "docs" in doc &&
      Array.isArray((doc as { docs: unknown }).docs)
    );
  },
  async resolve(repo, handle, parts, visited) {
    const folder = handle.doc() as FolderDoc | undefined;
    if (!folder?.docs) return undefined;

    const part = parts[0];
    const docLink = folder.docs.find((doc) => doc.name === part);
    if (!docLink) return undefined;

    const next = await repo.find(docLink.url);
    return resolvePathInternal(repo, next, parts.slice(1), visited);
  },
};

// ── directory strategy: @patchwork.type === "directory", key map walk ──

const directoryStrategy: FolderStrategy = {
  matches(doc) {
    return getType(doc as Parameters<typeof getType>[0]) === "directory";
  },
  async resolve(repo, handle, parts, visited) {
    return walkDirectoryDoc(repo, handle.doc(), parts, visited);
  },
};

async function walkDirectoryDoc(
  repo: Repo,
  node: unknown,
  parts: string[],
  visited: Set<string>
): Promise<Resolved | undefined> {
  if (typeof node === "string" && isValidAutomergeUrl(node)) {
    // Following a url consumes no parts, so revisiting the same url with the
    // same remaining parts is a cycle.
    const key = `${node}|${parts.join("/")}`;
    if (visited.has(key)) return undefined;
    visited.add(key);
    const next = await repo.find(node);
    return resolvePathInternal(repo, next, parts, visited);
  }

  if (parts.length === 0) {
    return materialize(repo, node, undefined, visited);
  }

  if (!node || typeof node !== "object" || node instanceof Uint8Array) {
    return undefined;
  }

  // Longest-prefix match: try "main/dist/index.js", then "main/dist", then "main"
  const obj = node as Record<string, unknown>;
  for (let i = parts.length; i >= 1; i--) {
    const key = parts.slice(0, i).join("/");
    if (key in obj) {
      return walkDirectoryDoc(repo, obj[key], parts.slice(i), visited);
    }
  }
  return undefined;
}

// ── materialize: turn a final value into Resolved ──
//
// rule of thumb: bytes pass through, anything else gets JSON.stringify'd unless
// a .mimeType hint is in scope (FileDoc-shape provides one). default mime is
// application/json so strings without a hint become valid JSON.

async function materialize(
  repo: Repo,
  node: unknown,
  typeHint?: string,
  visited: Set<string> = new Set()
): Promise<Resolved | undefined> {
  // Follow automerge urls
  if (typeof node === "string" && isValidAutomergeUrl(node)) {
    if (visited.has(node)) return undefined;
    visited.add(node);
    const next = await repo.find(node);
    return materialize(repo, next.doc(), typeHint, visited);
  }

  // FileDoc-shape: object with .content (and optional .mimeType)
  if (
    node &&
    typeof node === "object" &&
    !Array.isArray(node) &&
    !(node instanceof Uint8Array) &&
    !isImmutableString(node) &&
    "content" in node
  ) {
    const obj = node as { content?: unknown; mimeType?: string };
    return materialize(repo, obj.content, obj.mimeType ?? typeHint, visited);
  }

  if (node instanceof Uint8Array) {
    return { content: node, type: typeHint ?? "application/octet-stream" };
  }

  // String with a mime hint: pass through. Without: JSON-encode so the response
  // body matches the declared application/json type.
  if (typeof node === "string") {
    if (typeHint) return { content: node, type: typeHint };
    return { content: JSON.stringify(node), type: "application/json" };
  }

  if (isImmutableString(node)) {
    const s = String(node);
    if (typeHint) return { content: s, type: typeHint };
    return { content: JSON.stringify(s), type: "application/json" };
  }

  // numbers, booleans, plain objects, arrays — JSON.stringify
  if (
    typeof node === "number" ||
    typeof node === "boolean" ||
    (node && typeof node === "object")
  ) {
    try {
      return {
        content: JSON.stringify(node),
        type: typeHint ?? "application/json",
      };
    } catch {
      return undefined;
    }
  }

  return undefined;
}

// ── dispatch ──

const STRATEGIES: FolderStrategy[] = [directoryStrategy, folderStrategy];

async function resolvePathInternal(
  repo: Repo,
  handle: DocHandle<unknown>,
  parts: string[],
  visited: Set<string>
): Promise<Resolved | undefined> {
  // Path exhausted — materialize this doc
  if (parts.length === 0) {
    return materialize(repo, handle.doc(), undefined, visited);
  }

  const doc = handle.doc();
  for (const strategy of STRATEGIES) {
    if (strategy.matches(doc)) {
      return strategy.resolve(repo, handle, parts, visited);
    }
  }
  return undefined;
}

export async function resolvePath(
  repo: Repo,
  rootHandle: DocHandle<unknown>,
  parts: string[]
): Promise<Resolved | undefined> {
  return resolvePathInternal(repo, rootHandle, parts, new Set());
}
