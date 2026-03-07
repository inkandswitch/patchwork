import type { SpaceLayout } from "./types";

const STORAGE_PREFIX = "patchwork-space-layout:";

export function loadLayout(accountUrl: string): SpaceLayout | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${accountUrl}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.root?.id) return null;
    return parsed as SpaceLayout;
  } catch {
    return null;
  }
}

export function saveLayout(accountUrl: string, layout: SpaceLayout): void {
  localStorage.setItem(`${STORAGE_PREFIX}${accountUrl}`, JSON.stringify(layout));
}

export function clearLayout(accountUrl: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${accountUrl}`);
}
