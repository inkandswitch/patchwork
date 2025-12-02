import type {
  Segment,
  MatchPattern,
  CursorMarker,
  AutomergeRefUrl,
} from "./types";
import { CURSOR_MARKER, KIND } from "./types";
import { parseAutomergeRefUrl } from "./parser";

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

export function isValidAutomergeRefUrl(str: unknown): str is AutomergeRefUrl {
  if (typeof str !== "string" || !str || !str.startsWith("automerge:")) {
    return false;
  }

  try {
    parseAutomergeRefUrl(str as AutomergeRefUrl);
    return true;
  } catch {
    return false;
  }
}
