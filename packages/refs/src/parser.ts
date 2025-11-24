import * as Automerge from "@automerge/automerge";
import type { Segment } from "./types";
import { KIND } from "./types";

/**
 * Parse a URL path string into segments.
 *
 * @example
 * parsePath("todos/0/title") → [{ kind: "key", key: "todos" }, ...]
 * parsePath("todos/$abc123") → [{ kind: "key", key: "todos" }, { kind: "stable_index", id: "abc123" }]
 */
export function parsePath(path: string): Segment[] {
  if (!path || path === "/") return [];

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
  if (segment.startsWith("$")) {
    return { [KIND]: "stable_index", id: segment.slice(1) };
  }

  if (segment.startsWith("[")) {
    return parseRange(segment);
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
 * Parse a range segment like "[0,10]" or "[$cursor1,$cursor2]".
 */
export function parseRange(segment: string): Segment {
  const content = segment.slice(1, -1);
  const parts = content.split(",");

  if (parts.length !== 2) {
    throw new Error(`Invalid range: ${segment}`);
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
    return { [KIND]: "query", clause: parsed };
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
      return JSON.stringify(segment.clause);

    case "range":
      return `[${segment.start},${segment.end}]`;

    case "stable_range":
      return `[$${segment.start},$${segment.end}]`;

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
 *
 * @example
 * parseHeads("abc,def") → ["abc", "def"]
 * parseHeads(undefined) → undefined
 */
export function parseHeads(headsStr: string | undefined): string[] | undefined {
  return headsStr ? headsStr.split(",") : undefined;
}

/**
 * Serialize heads to URL string format.
 */
export function serializeHeads(heads: string[] | undefined): string {
  return heads ? `#${heads.join(",")}` : "";
}

/**
 * Construct a full automerge URL from components.
 *
 * @example
 * serializeUrl("abc123", [{ kind: "key", key: "todos" }], ["head1"])
 * → "automerge:abc123/todos#head1"
 */
export function serializeUrl(
  docId: string,
  segments: Segment[],
  heads?: string[]
): string {
  const pathStr = serializePath(segments);
  const headsStr = serializeHeads(heads);
  return `automerge:${docId}/${pathStr}${headsStr}`;
}

/**
 * Parsed components of an Automerge URL.
 */
export interface ParsedUrl {
  docId: string;
  segments: Segment[];
  heads?: string[];
}

/**
 * Parse a full Automerge URL into its components.
 *
 * @example
 * parseUrl("automerge:abc123/todos/0/title#head1,head2")
 * → { docId: "abc123", segments: [...], heads: ["head1", "head2"] }
 */
export function parseUrl(url: string): ParsedUrl {
  const match = url.match(/^automerge:([^/#]+)(?:\/([^#]*))?(?:#(.+))?$/);
  if (!match) {
    throw new Error(`Invalid Automerge URL: ${url}`);
  }

  const [, docId, pathStr, headsStr] = match;

  return {
    docId,
    segments: pathStr ? parsePath(pathStr) : [],
    heads: parseHeads(headsStr),
  };
}
