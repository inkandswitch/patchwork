import { createEffect, createSignal, on } from "solid-js";

/**
 * Reads a number from localStorage with a default fallback
 */
function getStoredNumber(key: string, defaultValue: number): number {
  const stored = localStorage.getItem(key);
  return stored ? parseInt(stored, 10) : defaultValue;
}

/**
 * Reads a boolean from localStorage (returns true if value is "true")
 */
function getStoredBoolean(key: string): boolean {
  return localStorage.getItem(key) === "true";
}

/**
 * Manages sidebar collapse and width state with localStorage persistence
 */
export function useSidebarState() {
  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = createSignal(
    getStoredBoolean("patchwork:leftSidebarCollapsed")
  );
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = createSignal(
    getStoredBoolean("patchwork:rightSidebarCollapsed")
  );

  // Resizable sidebar width state with localStorage persistence
  const [leftSidebarWidth, setLeftSidebarWidth] = createSignal(
    getStoredNumber("patchwork:leftSidebarWidth", 400)
  );
  const [rightSidebarWidth, setRightSidebarWidth] = createSignal(
    getStoredNumber("patchwork:rightSidebarWidth", 400)
  );

  // Persist each sidebar state to localStorage independently
  createEffect(
    on(isSidebarCollapsed, (value) => {
      localStorage.setItem("patchwork:leftSidebarCollapsed", String(value));
    })
  );

  createEffect(
    on(isRightSidebarCollapsed, (value) => {
      localStorage.setItem("patchwork:rightSidebarCollapsed", String(value));
    })
  );

  createEffect(
    on(leftSidebarWidth, (value) => {
      localStorage.setItem("patchwork:leftSidebarWidth", String(value));
    })
  );

  createEffect(
    on(rightSidebarWidth, (value) => {
      localStorage.setItem("patchwork:rightSidebarWidth", String(value));
    })
  );

  return {
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isRightSidebarCollapsed,
    setIsRightSidebarCollapsed,
    leftSidebarWidth,
    setLeftSidebarWidth,
    rightSidebarWidth,
    setRightSidebarWidth,
  };
}
