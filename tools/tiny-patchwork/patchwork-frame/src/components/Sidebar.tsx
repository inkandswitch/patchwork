import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Accessor } from "solid-js";

interface SidebarProps {
  side: "left" | "right";
  isCollapsed: Accessor<boolean>;
  width: Accessor<number>;
  toolId?: string;
  docUrl: AutomergeUrl;
  onMouseDown: (side: "left" | "right", e: MouseEvent) => void;
  onToggleClick: (side: "left" | "right", e: MouseEvent) => void;
}

/**
 * Reusable sidebar component for left and right sidebars
 */
export function Sidebar({
  side,
  isCollapsed,
  width,
  toolId,
  docUrl,
  onMouseDown,
  onToggleClick,
}: SidebarProps) {
  const widthStyle = () =>
    `${isCollapsed() ? (side === "right" ? 2 : 0) : width()}px`;
  const flexClass = () =>
    `flex relative ${side === "right" ? "bg-base-100" : ""}`;
  const widthClass = () =>
    isCollapsed() ? (side === "right" ? "w-0.5" : "w-0") : "";

  return (
    <div
      class={`${flexClass()} ${widthClass()}`}
      style={{ width: widthStyle() }}
    >
      {/* Sidebar content when expanded */}
      {side === "left" && toolId && !isCollapsed() && (
        <patchwork-view class="h-full" doc-url={docUrl} tool-id={toolId} />
      )}

      {/* Toggle/resize button - left side shows when expanded */}
      {side === "left" && !isCollapsed() && (
        <button
          onClick={(e) => onToggleClick(side, e)}
          onMouseDown={(e) => onMouseDown(side, e)}
          class="sidebar-toggle sidebar-toggle--resizable"
          aria-label="Toggle or resize sidebar"
          title="Click to toggle, drag to resize"
        />
      )}

      {/* Toggle button when collapsed - left side */}
      {side === "left" && isCollapsed() && (
        <button
          onClick={(e) => onToggleClick(side, e)}
          class="sidebar-toggle"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        />
      )}

      {/* Toggle/resize button - right side shows when expanded */}
      {side === "right" && !isCollapsed() && (
        <button
          onClick={(e) => onToggleClick(side, e)}
          onMouseDown={(e) => onMouseDown(side, e)}
          class="sidebar-toggle sidebar-toggle--resizable"
          aria-label="Toggle or resize sidebar"
          title="Click to toggle, drag to resize"
        />
      )}

      {/* Toggle button when collapsed - right side */}
      {side === "right" && isCollapsed() && (
        <button
          onClick={(e) => onToggleClick(side, e)}
          class="sidebar-toggle"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        />
      )}

      {/* Sidebar content when expanded - right side */}
      {side === "right" && toolId && !isCollapsed() && (
        <patchwork-view doc-url={docUrl} tool-id={toolId} />
      )}
    </div>
  );
}
