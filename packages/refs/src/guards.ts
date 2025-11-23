/**
 * Type guards for path segments and related types.
 * Internal utilities - not exported from package.
 */

import type * as Automerge from "@automerge/automerge";
import type { PathSegment } from "./types";
import { QUERY, ID } from "./types";

/**
 * Check if a value is a PathSegment (has QUERY or ID symbol).
 */
export function isPathSegment(val: unknown): val is PathSegment {
  return (
    val !== null &&
    val !== undefined &&
    typeof val === "object" &&
    (QUERY in val || ID in val)
  );
}

/**
 * Check if a value is a plain object (not a PathSegment, array, or other special object).
 * Used to distinguish where clauses from PathSegments.
 */
export function isPlainObject(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  // Not a PathSegment - doesn't have our symbols
  return !(QUERY in obj || ID in obj);
}

/**
 * Type guard to check if a value is a pair of numbers (numeric range).
 */
export function isNumericRange(range: unknown): range is [number, number] {
  return (
    Array.isArray(range) &&
    range.length === 2 &&
    typeof range[0] === "number" &&
    typeof range[1] === "number"
  );
}

/**
 * Type guard to check if a value is a pair of Automerge Cursors.
 * Cursors are strings in the format: "number@alphanumeric"
 * Example: "2@fe74e7d3d9d2f00bf7096f6a1eb64afb"
 */
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
