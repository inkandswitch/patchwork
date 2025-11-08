import { createSignal } from "solid-js";
import { ReactiveMap } from "@solid-primitives/map";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export const [dragging, setDragging] = createSignal(false);
export const [copyMode, setCopyMode] = createSignal(false);

export type DropPosition = "above" | "below" | "inside" | null;

export const [dropTarget, setDropTarget] = createSignal<{
  id: string;
  position: DropPosition;
} | null>(null);

export type SideboardDragAndDropItem = {
  id: string;
  url: AutomergeUrl;
  type: string;
  name: string;
  source: string;
};

export const dragstack = new ReactiveMap<string, SideboardDragAndDropItem>();

export function isAbove(clientY: number, element: Element) {
  const rect = element.getBoundingClientRect();
  const offset = clientY - rect.top;
  return offset < rect.height / 2;
}

export function clearDropTarget() {
  setDropTarget(null);
}

// Throttle helper to prevent too many updates
let lastDropTargetUpdate = 0;
const THROTTLE_MS = 100; // Update max every 50ms

export function throttledSetDropTarget(
  target: { id: string; position: DropPosition } | null
) {
  const now = Date.now();
  if (now - lastDropTargetUpdate < THROTTLE_MS) {
    return;
  }
  lastDropTargetUpdate = now;

  // Only update if actually changed
  const current = dropTarget();
  if (!current && !target) return;
  if (
    current &&
    target &&
    current.id === target.id &&
    current.position === target.position
  ) {
    return;
  }

  setDropTarget(target);
}
