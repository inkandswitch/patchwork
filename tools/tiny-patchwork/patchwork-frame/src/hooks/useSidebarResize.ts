import { onCleanup, onMount } from "solid-js";
import type { Setter } from "solid-js";

interface UseSidebarResizeParams {
  setLeftSidebarWidth: Setter<number>;
  setRightSidebarWidth: Setter<number>;
  setIsSidebarCollapsed: Setter<boolean>;
  setIsRightSidebarCollapsed: Setter<boolean>;
  minWidth: number;
  maxWidth: number;
  dragThreshold: number;
}

/**
 * Manages sidebar resize and toggle interactions
 */
export function useSidebarResize({
  setLeftSidebarWidth,
  setRightSidebarWidth,
  setIsSidebarCollapsed,
  setIsRightSidebarCollapsed,
  minWidth,
  maxWidth,
  dragThreshold,
}: UseSidebarResizeParams) {
  // Non-reactive refs for drag state
  let isResizing: "left" | "right" | null = null;
  let dragStartPos: { x: number; y: number } | null = null;
  let hasDragged = false;

  const handleMouseDown = (side: "left" | "right", e: MouseEvent) => {
    e.preventDefault();
    dragStartPos = { x: e.clientX, y: e.clientY };
    hasDragged = false;
    isResizing = side;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseUp = () => {
    isResizing = null;
    dragStartPos = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !dragStartPos) return;

    // Check if we've moved enough to consider it a drag
    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
      hasDragged = true;
    }

    if (isResizing === "left") {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setLeftSidebarWidth(newWidth);
    } else if (isResizing === "right") {
      const newWidth = Math.max(
        minWidth,
        Math.min(maxWidth, window.innerWidth - e.clientX)
      );
      setRightSidebarWidth(newWidth);
    }
  };

  const handleToggleClick = (side: "left" | "right", e: MouseEvent) => {
    // Only toggle if we didn't drag
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      // Reset the flag for next interaction
      hasDragged = false;
      return;
    }

    if (side === "left") {
      setIsSidebarCollapsed((prev) => !prev);
    } else {
      setIsRightSidebarCollapsed((prev) => !prev);
    }
  };

  onMount(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    onCleanup(() => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Reset body styles if component unmounts during drag
      if (isResizing) {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        isResizing = null;
      }
    });
  });

  return {
    handleMouseDown,
    handleToggleClick,
  };
}
