import * as Automerge from "@automerge/automerge";
import type { Segment } from "./types";
import { KIND } from "./types";

const URL_PREFIX = "automerge:";

/**
 * Branded type for Automerge ref URLs.
 * A string in the format: `automerge:documentId/path#heads`
 */
export type AutomergeRefUrl = string & { readonly __brand: "AutomergeRefUrl" };

/**
 * Parse a URL path string into segments.
 *
 * @example
 * parsePath("todos/0/title") → [{ kind: "key", key: "todos" }, ...]
 * parsePath("todos/$abc123") → [{ kind: "key", key: "todos" }, { kind: "stable_index", id: "abc123" }]
 * parsePath("note/0-10") → [..., { kind: "range", start: 0, end: 10 }]
 */
export function parsePath(path: string): Segment[] {
  if (!path) return [];
  if (path === "/") {
    throw new Error("Invalid path: '/' is not allowed");
  }

  return path.split("/").map((segment): Segment => {
    if (!segment) {
      throw new Error("Invalid path: empty segment");
    }
    return parseSegment(segment);
  });
}

/**
 * Parse a single path segment string into a Segment object.
 */
export function parseSegment(segment: string): Segment {
  // Check for range (contains dash): "0-10" or "$cursor1-$cursor2"
  if (segment.includes("-")) {
    return parseRange(segment);
  }

  if (segment.startsWith("$")) {
    return { [KIND]: "stable_index", id: segment.slice(1) };
  }

  if (segment.startsWith("{")) {
    return parseJson(segment);
  }

  if (/^\d+$/.test(segment)) {
    return { [KIND]: "index", index: parseInt(segment, 10) };
  }

  return { [KIND]: "key", key: segment };
}

/**
 * Parse a range segment like "0-10" or "$cursor1-$cursor2".
 */
export function parseRange(segment: string): Segment {
  const parts = segment.split("-");

  if (parts.length !== 2) {
    throw new Error(`Invalid range: ${segment}. Expected format: "start-end"`);
  }

  const [first, second] = parts;

  if (first.startsWith("$") && second.startsWith("$")) {
    return {
      [KIND]: "stable_range",
      start: first.slice(1) as Automerge.Cursor,
      end: second.slice(1) as Automerge.Cursor,
    };
  }

  const start = parseInt(first, 10);
  const end = parseInt(second, 10);

  if (isNaN(start) || isNaN(end)) {
    throw new Error(`Invalid numeric range: ${segment}`);
  }

  return { [KIND]: "range", start, end };
}

/**
 * Parse a JSON object segment like '{"status":"done"}'.
 */
export function parseJson(segment: string): Segment {
  try {
    const parsed = JSON.parse(segment);
    return { [KIND]: "query", idPattern: parsed };
  } catch (e) {
    throw new Error(`Invalid JSON segment: ${segment}`);
  }
}

/**
 * Serialize a segment back to its string representation.
 */
export function serializeSegment(segment: Segment): string {
  switch (segment[KIND]) {
    case "key":
      return segment.key;

    case "index":
      return String(segment.index);

    case "stable_index":
      return `$${segment.id}`;

    case "query":
      return JSON.stringify(segment.idPattern);

    case "range":
      return `${segment.start}-${segment.end}`;

    case "stable_range":
      return `$${segment.start}-$${segment.end}`;

    default:
      segment satisfies never;
      throw new Error(`Unknown segment kind: ${segment[KIND]}`);
  }
}

/**
 * Serialize an array of segments to a path string.
 */
export function serializePath(segments: Segment[]): string {
  return segments.map(serializeSegment).join("/");
}

/**
 * Parse heads parameter from URL string.
 * Uses pipe "|" separator to match automerge-repo convention.
 *
 * @example
 * parseHeads("abc|def") → ["abc", "def"]
 * parseHeads(undefined) → undefined
 */
export function parseHeads(headsStr: string | undefined): string[] | undefined {
  return headsStr ? headsStr.split("|") : undefined;
}

/**
 * Serialize heads to URL string format.
 * Uses pipe "|" separator to match automerge-repo convention.
 */
export function serializeHeads(heads: string[] | undefined): string {
  return heads ? `#${heads.join("|")}` : "";
}

/**
 * Construct a full Automerge ref URL from components.
 * Uses pipe "|" separator for heads to match automerge-repo convention.
 *
 * @example
 * stringifyAutomergeRefUrl("abc123", [{ kind: "key", key: "todos" }], ["head1", "head2"])
 * → "automerge:abc123/todos#head1|head2"
 */
export function stringifyAutomergeRefUrl(
  documentId: string,
  segments: Segment[],
  heads?: string[]
): AutomergeRefUrl {
  const pathStr = serializePath(segments);
  const headsStr = serializeHeads(heads);
  return `${URL_PREFIX}${documentId}/${pathStr}${headsStr}` as AutomergeRefUrl;
}

/**
 * Parsed components of an Automerge ref URL.
 */
export interface ParsedAutomergeRefUrl {
  documentId: string;
  segments: Segment[];
  heads?: string[];
}

/**
 * Parse a full Automerge ref URL into its components.
 * Uses pipe "|" separator for heads to match automerge-repo convention.
 *
 * @example
 * parseAutomergeRefUrl("automerge:abc123/todos/0/title#head1|head2")
 * → { documentId: "abc123", segments: [...], heads: ["head1", "head2"] }
 */
export function parseAutomergeRefUrl(
  url: AutomergeRefUrl
): ParsedAutomergeRefUrl {
  // Check for multiple heads sections
  const [baseUrl, headsSection, ...rest] = url.split("#");
  if (rest.length > 0) {
    throw new Error(
      "Invalid Automerge ref URL: contains multiple heads sections"
    );
  }

  // Parse the base URL
  const match = baseUrl.match(/^automerge:([^/]+)(?:\/(.*))?$/);
  if (!match) {
    throw new Error(`Invalid Automerge ref URL: ${url}`);
  }

  const [, documentId, pathStr] = match;

  return {
    documentId,
    segments: pathStr ? parsePath(pathStr) : [],
    heads: parseHeads(headsSection),
  };
}

/**
 * Check if a string is a valid Automerge ref URL.
 * Acts as a type guard in TypeScript.
 */
export function isValidAutomergeRefUrl(str: unknown): str is AutomergeRefUrl {
  if (typeof str !== "string" || !str || !str.startsWith(URL_PREFIX)) {
    return false;
  }

  try {
    parseAutomergeRefUrl(str as AutomergeRefUrl);
    return true;
  } catch {
    return false;
  }
}
