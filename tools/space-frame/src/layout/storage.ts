import type { SpaceLayout } from "./types";

const STORAGE_PREFIX = "patchwork-space-layout:";
const CELL_SIZE_KEY = "patchwork-space-cell-size";

export function getLayoutKey(accountUrl: string): string {
  return `${STORAGE_PREFIX}${accountUrl}`;
}

export function loadLayout(accountUrl: string): SpaceLayout | null {
  try {
    const raw = localStorage.getItem(getLayoutKey(accountUrl));
    if (!raw) return null;
    return JSON.parse(raw) as SpaceLayout;
  } catch {
    return null;
  }
}

export function saveLayout(accountUrl: string, layout: SpaceLayout): void {
  localStorage.setItem(getLayoutKey(accountUrl), JSON.stringify(layout));
}

export function getTargetCellSize(): number {
  const stored = localStorage.getItem(CELL_SIZE_KEY);
  return stored ? Number(stored) : 80;
}

export function setTargetCellSize(size: number): void {
  localStorage.setItem(CELL_SIZE_KEY, String(size));
}

export function computeGrid(
  width: number,
  height: number,
  targetSize?: number
): { cols: number; rows: number } {
  const size = targetSize ?? getTargetCellSize();
  return {
    cols: Math.max(4, Math.round(width / size)),
    rows: Math.max(4, Math.round(height / size)),
  };
}
