export type {
  PathSegment,
  RefOptions,
  DynamicSegment,
  ChangeEvent,
  ChangeCallback,
  PathBuilder,
} from "./types";

export { Ref } from "./ref";

export { splice, updateText, isCursor } from "./utils";
export { at, isDynamic } from "./at";
export { ref } from "./factory";
