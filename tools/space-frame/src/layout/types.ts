export type SpaceChild = SpaceNode | PipeNode;

export type SpaceNode = {
  id: string;
  direction?: "horizontal" | "vertical";
  size?: number;
  fixedSize?: number;
  content?: SpaceContent;
  children?: SpaceChild[];
  collapsible?: boolean;
  collapsed?: boolean;
};

export type PipeNode = {
  id: string;
  type: "pipe";
  transform: string;
  config?: Record<string, unknown>;
  expanded?: boolean;
};

export type SpaceContent =
  | { type: "view"; docUrl?: string; toolId?: string }
  | { type: "preview" }
  | { type: "picker" };

export type SpaceLayout = {
  root: SpaceNode;
};

export function isPipeNode(child: SpaceChild): child is PipeNode {
  return "type" in child && child.type === "pipe";
}

export function isSpaceNode(child: SpaceChild): child is SpaceNode {
  return !isPipeNode(child);
}
