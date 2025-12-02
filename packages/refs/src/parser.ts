import * as Automerge from "@automerge/automerge";
import type { AutomergeRefUrl, Segment } from "./types";
import { KIND } from "./types";

const URL_PREFIX = "automerge:";
const ID_PREFIX = ":";
const RANGE_SEPARATOR = "-";

/**
 * Parse a URL path string into segments.
 *
 * @example
 * parsePath("todos/0/title") → [{ kind: "key", key: "todos" }, ...]
 * parsePath("todos/{"id":"abc"}") → [{ kind: "key", key: "todos" }, { kind: "match", match: { id: "abc" } }]
 * parsePath("note/:cursor1-:cursor2") → [..., { kind: "cursors", start: cursor1, end: cursor2 }]
 */
export function parsePath(path: string): Segment[] {
  if (!path) return [];

  // Remove leading/trailing slashes
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    throw new Error(
      "Invalid path: path cannot be empty or consist only of slashes"
    );
  }

  // Check for double slashes (empty segments)
  if (trimmed.includes("//")) {
    throw new Error("Invalid path: contains empty segment (double slash)");
  }

  return trimmed.split("/").map(parseSegment);
}

/**
 * Parse a single path segment string into a Segment object.
 */
export function parseSegment(segment: string): Segment {
  // Check for cursor range: ":cursor1-:cursor2"
  if (segment.includes(RANGE_SEPARATOR)) {
    return parseCursorRange(segment);
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
 * Parse a cursor range segment like ":cursor1-:cursor2".
 */
export function parseCursorRange(segment: string): Segment {
  const parts = segment.split(RANGE_SEPARATOR);

  if (parts.length !== 2) {
    throw new Error(
      `Invalid cursor range: ${segment}. Expected format: ":cursor1-:cursor2"`
    );
  }

  const [first, second] = parts;

  if (!first.startsWith(ID_PREFIX) || !second.startsWith(ID_PREFIX)) {
    throw new Error(
      `Invalid cursor range: ${segment}. Cursors must be prefixed with "${ID_PREFIX}"`
    );
  }

  return {
    [KIND]: "cursors",
    start: first.slice(ID_PREFIX.length) as Automerge.Cursor,
    end: second.slice(ID_PREFIX.length) as Automerge.Cursor,
  };
}

/**
 * Parse a JSON object segment like '{"status":"done"}'.
 */
export function parseJson(segment: string): Segment {
  try {
    const parsed = JSON.parse(segment);
    return { [KIND]: "match", match: parsed };
  } catch {
    throw new Error(`Invalid JSON segment: ${segment}`);
  }
}

/**
 * Serialize a segment back to its string representation.
 *
 * @example
 * serializeSegment({ [KIND]: "key", key: "todos" }) → "todos"
 * serializeSegment({ [KIND]: "index", index: 0 }) → "0"
 * serializeSegment({ [KIND]: "match", match: { id: "abc" } }) → '{"id":"abc"}'
 * serializeSegment({ [KIND]: "cursors", start, end }) → ":cursor1-:cursor2"
 */
export function serializeSegment(segment: Segment): string {
  switch (segment[KIND]) {
    case "key":
      return segment.key;

    case "index":
      return String(segment.index);

    case "match":
      return JSON.stringify(segment.match);

    case "cursors":
      return `${ID_PREFIX}${segment.start}${RANGE_SEPARATOR}${ID_PREFIX}${segment.end}`;

    default:
      segment satisfies never;
      throw new Error(`Unknown segment kind: ${segment[KIND]}`);
  }
}

/**
 * Serialize an array of segments to a path string.
 *
 * @example
 * serializePath([{ [KIND]: "key", key: "todos" }, { [KIND]: "index", index: 0 }]) → "todos/0"
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
 *
 * @example
 * serializeHeads(["abc", "def"]) → "#abc|def"
 * serializeHeads(undefined) → ""
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
    throw new Error(
      `Invalid Automerge ref URL: ${url}\n` +
        `Expected format: automerge:documentId/path/to/value#head1|head2`
    );
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
