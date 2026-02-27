import { createSignal } from "solid-js";

export const [filter, setFilter] = createSignal("");

export function filterMatches(string: string) {
  const lower = string?.toLowerCase();
  return !!lower && filter().split(/\s+/).filter(Boolean).every(term => lower.includes(term));
}

export const [renaming, setRenaming] = createSignal("");
