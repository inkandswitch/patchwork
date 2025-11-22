/**
 * Type guards for path segments and related types.
 * Internal utilities - not exported from package.
 */

import type * as Automerge from "@automerge/automerge";
import type { DynamicSegment } from "./types";

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

/**
 * Type guard to check if a segment is dynamic (wrapped in at()).
 */
export function isDynamic(segment: any): segment is DynamicSegment<any> {
  return (
    segment !== null &&
    segment !== undefined &&
    typeof segment === "object" &&
    segment.__dynamic === true
  );
}
