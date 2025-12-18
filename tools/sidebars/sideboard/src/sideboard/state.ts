import { createSignal } from "solid-js";

export const [filter, setFilter] = createSignal("");

export function filterMatches(string: string) {
  return !!string?.toLowerCase().includes(filter());
}

export const [renaming, setRenaming] = createSignal("");
