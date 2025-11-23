import type * as Automerge from "@automerge/automerge";
import type { PathSegment } from "./types";
import { QUERY, ID } from "./types";

export function isPathSegment(val: unknown): val is PathSegment {
  return (
    val !== null &&
    val !== undefined &&
    typeof val === "object" &&
    (QUERY in val || ID in val)
  );
}

/** Plain object used for where clauses (not a PathSegment or array) */
export function isPlainObject(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  return !(QUERY in obj || ID in obj);
}

export function isNumericRange(range: unknown): range is [number, number] {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number"
  );
}

/** Cursors are strings in format: "number@alphanumeric" */
export function isCursorRange(
  range: unknown
): range is [Automerge.Cursor, Automerge.Cursor] {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "string" &&
    typeof range[1] === "string" &&
    /^\d+@[a-zA-Z0-9]+$/.test(range[0]) &&
    /^\d+@[a-zA-Z0-9]+$/.test(range[1])
  );
}
