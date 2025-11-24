import type { Segment } from "./types";
import { KIND } from "./types";

export function isSegment(val: unknown): val is Segment {
  return (
    val !== null && val !== undefined && typeof val === "object" && KIND in val
  );
}

/** Plain object used for id patterns (not a Segment or array) */
export function isPlainObject(obj: unknown): obj is Record<string, any> {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  return !isSegment(obj);
}
