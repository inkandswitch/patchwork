import "./styles.css";
import type { DocHandle } from "@automerge/automerge-repo";
import type { ToolElement } from "@inkandswitch/patchwork-plugins";

const LEFT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`;

const RIGHT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/></svg>`;

/**
 * Walk up through shadow DOM boundaries to reach the layout root
 * where .sidebar-toggle buttons live (PatchworkFrame's render root).
 */
function getLayoutRoot(element: HTMLElement): Document | ShadowRoot {
  let root: Document | ShadowRoot = element.getRootNode() as
    | Document
    | ShadowRoot;
  if (root instanceof ShadowRoot) {
    root = root.host.getRootNode() as Document | ShadowRoot;
  }
  return root;
}

/**
 * Find the .sidebar-toggle button for the given side.
 * Left sidebar's toggle is the first one, right sidebar's is the last.
 */
function findSidebarToggle(
  root: Document | ShadowRoot,
  side: "left" | "right"
): HTMLElement | null {
  const toggles = root.querySelectorAll(".sidebar-toggle");
  if (toggles.length === 0) return null;
  if (side === "left") return toggles[0] as HTMLElement;
  return toggles[toggles.length - 1] as HTMLElement;
}

/**
 * When a sidebar is collapsed, its toggle button does NOT have the
 * --resizable modifier class.
 */
function isSidebarCollapsed(toggle: HTMLElement): boolean {
  return !toggle.classList.contains("sidebar-toggle--resizable");
}

export function createSidebarToggle(side: "left" | "right") {
  return function renderSidebarToggle(
    _handle: DocHandle<unknown>,
    element: ToolElement
  ) {
    const button = document.createElement("button");
    button.className = "sidebar-toggle-icon";
    button.innerHTML = side === "left" ? LEFT_ICON : RIGHT_ICON;
    button.title = `Open ${side === "left" ? "account" : "context"} sidebar`;
    element.appendChild(button);

    const root = getLayoutRoot(element);

    function update() {
      const toggle = findSidebarToggle(root, side);
      if (!toggle) {
        button.style.display = "none";
        return;
      }
      const collapsed = isSidebarCollapsed(toggle);
      button.style.display = collapsed ? "" : "none";
    }

    button.addEventListener("click", () => {
      const toggle = findSidebarToggle(root, side);
      if (toggle) {
        toggle.click();
        setTimeout(update, 50);
      }
    });

    // Observe the layout for DOM changes (React swaps toggle buttons
    // on sidebar state change, and modifies class/style attributes)
    const mainLayout = root.querySelector("body > patchwork-view");
    let observer: MutationObserver | null = null;

    if (mainLayout) {
      observer = new MutationObserver(update);
      observer.observe(mainLayout, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }

    update();

    return () => {
      observer?.disconnect();
    };
  };
}
