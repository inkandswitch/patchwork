import { TLStoreSnapshot } from "@tldraw/tldraw";
import { DEFAULT_STORE } from "./default_store";
import { tldrawValueToAutomergeValue } from "./TLStoreToAutomerge";

/* a similar pattern to other automerge init functions */
export function init(doc: TLStoreSnapshot) {
  Object.assign(doc, tldrawValueToAutomergeValue(DEFAULT_STORE));
}

export * from "./useAutomergeStore";
