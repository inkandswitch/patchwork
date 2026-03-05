export type SpaceLayout = {
  items: SpaceItem[];
  pipes: Pipe[];
};

export type SpaceContent =
  | { type: "view"; docUrl?: string; toolId?: string }
  | { type: "preview" }
  | { type: "group"; children: SpaceItem[]; pipes: Pipe[] };

export type SpaceItem = {
  id: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
  collapsible?: boolean;
  collapsed?: boolean;
  content: SpaceContent;
};

export type Pipe = {
  id: string;
  from: string;
  to: string;
  transforms: TransformStep[];
};

export type TransformStep = {
  id: string;
  type: string;
  config?: Record<string, unknown>;
};
