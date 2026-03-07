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
 * Reusable sidebar component for left and right sidebars.
 * Props are accessed via `props.x` (not destructured) to preserve Solid reactivity.
 */
export function Sidebar(props: SidebarProps) {
  const widthStyle = () =>
    `${props.isCollapsed() ? (props.side === "right" ? 2 : 0) : props.width()}px`;
  const flexClass = () =>
    `flex relative ${props.side === "right" ? "bg-base-100" : ""}`;
  const widthClass = () =>
    props.isCollapsed() ? (props.side === "right" ? "w-0.5" : "w-0") : "";

  return (
    <div
      class={`${flexClass()} ${widthClass()}`}
      style={{ width: widthStyle() }}
    >
      {/* Sidebar content when expanded */}
      {props.side === "left" && props.toolId && !props.isCollapsed() && (
        <patchwork-view class="h-full" doc-url={props.docUrl} tool-id={props.toolId} />
      )}

      {/* Toggle/resize button - left side shows when expanded */}
      {props.side === "left" && !props.isCollapsed() && (
        <button
          onClick={(e) => props.onToggleClick(props.side, e)}
          onMouseDown={(e) => props.onMouseDown(props.side, e)}
          class="sidebar-toggle sidebar-toggle--resizable"
          aria-label="Toggle or resize sidebar"
          title="Click to toggle, drag to resize"
        />
      )}

      {/* Toggle button when collapsed - left side */}
      {props.side === "left" && props.isCollapsed() && (
        <button
          onClick={(e) => props.onToggleClick(props.side, e)}
          class="sidebar-toggle"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        />
      )}

      {/* Toggle/resize button - right side shows when expanded */}
      {props.side === "right" && !props.isCollapsed() && (
        <button
          onClick={(e) => props.onToggleClick(props.side, e)}
          onMouseDown={(e) => props.onMouseDown(props.side, e)}
          class="sidebar-toggle sidebar-toggle--resizable"
          aria-label="Toggle or resize sidebar"
          title="Click to toggle, drag to resize"
        />
      )}

      {/* Toggle button when collapsed - right side */}
      {props.side === "right" && props.isCollapsed() && (
        <button
          onClick={(e) => props.onToggleClick(props.side, e)}
          class="sidebar-toggle"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        />
      )}

      {/* Sidebar content when expanded - right side */}
      {props.side === "right" && props.toolId && !props.isCollapsed() && (
        <patchwork-view doc-url={props.docUrl} tool-id={props.toolId} />
      )}
    </div>
  );
}
