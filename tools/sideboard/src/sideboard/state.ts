import { createSignal } from "solid-js";
import { parseHash } from "./util.ts";

export const [filter, setFilter] = createSignal("");
export const [selectedId, setSelectedId] = createSignal<
  string | undefined | null
>(parseHash().documentId);
