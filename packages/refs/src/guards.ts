import type { Segment, MatchPattern, CursorMarker } from "./types";
import { CURSOR_MARKER, KIND } from "./types";

function isObject(val: unknown): val is object {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

export function isSegment(val: unknown): val is Segment {
  return isObject(val) && KIND in val;
}

export function isMatchPattern(val: unknown): val is MatchPattern {
  return isObject(val) && !isSegment(val);
}

export function isCursorMarker(value: unknown): value is CursorMarker {
  return isObject(value) && CURSOR_MARKER in value;
}
