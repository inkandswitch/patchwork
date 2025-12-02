import type { Segment, MatchPattern, CursorMarker } from "./types";
import { CURSOR_MARKER, KIND } from "./types";

function isObject(val: unknown): val is object {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

export function isSegment(val: unknown): val is Segment {
  return isObject(val) && KIND in val;
}

export function isCursorMarker(val: unknown): val is CursorMarker {
  return isObject(val) && CURSOR_MARKER in val;
}

export function isMatchPattern(val: unknown): val is MatchPattern {
  return !isSegment(val) && !isCursorMarker(val);
}
