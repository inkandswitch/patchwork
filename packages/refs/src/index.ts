// Re-export core types
export type {
  PathSegment,
  RefOptions,
  DynamicSegment,
  ChangeEvent,
  ChangeCallback,
  PathBuilder,
} from "./types";

// Re-export Ref class
export { Ref } from "./ref";

// Re-export text mutation helpers
export { splice, updateText } from "./utils";

// Re-export at() function
export { at, isDynamic } from "./at";

// Re-export ref() factory
export { ref } from "./factory";
