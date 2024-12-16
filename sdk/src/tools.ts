import {
  Annotation,
  AnnotationGroupWithUIState,
  AnnotationWithUIState,
  CommentState,
  HasVersionControlMetadata,
} from "./versionControl";
import {
  ActorId,
  AutomergeUrl,
  DocHandle,
  Heads,
} from "@automerge/automerge-repo";
import React from "react";
import { IconType } from "./ui/icons";
import { DocPath } from "@patchwork/folder";
import { DataType, isDataType } from "./datatypes";
import { isArray } from "lodash";

// To construct well-typed tools, we need ToolTyped with specific type
// parameters. But then we need Tool, which means "ToolTyped with unknown but
// well-defined type parameters". This is what's known as an existential type,
// which TypeScript doesn't have. In hackish but reasonable lieu of that, we
// just stuff a bunch of unknowns in there.

export type Tool = ToolTyped<
  HasVersionControlMetadata<unknown, unknown>,
  unknown,
  unknown
>;

export type DeferredTool = {
  id: string;
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: IconType;
  load(): Promise<Tool>;
};

export type ToolTyped<D extends HasVersionControlMetadata<A, V>, A, V> = {
  id: string;
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: IconType;
  EditorComponent: React.FC<EditorProps<A, V>>;
  AnnotationsViewComponent?: React.FC<AnnotationsViewProps<D, A, V>>;
  /** whether this tool has support for rendering comments inline or if it
   * relies exclusively on the review sidebar to show comments */
  supportsInlineComments?: boolean;

  /** wether this tool supports a display mode where parts of the document without annotations are collapsed
   * what this means exactly for a specific datatype is up to the tool to decide */
  supportsCollapseContentWithoutAnnotations?: boolean;
};

/** Forgets the type parameters of a ToolTyped so that it can be used as a Tool */
export function makeTool<D extends HasVersionControlMetadata<A, V>, A, V>(
  tool: ToolTyped<D, A, V>
): Tool {
  return tool as Tool;
}

const GlobalTools: Record<string, Tool> = {};
export const registerTool = async (tool: DeferredTool) => {
  const { id } = tool;
  console.log("registering tool", id, tool);
  if (GlobalTools[id]) {
    console.warn("Replacing tool", tool);
  }
  GlobalTools[id] = await tool.load();
};

export const isTool = (value: unknown): value is DeferredTool => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    (value as DeferredTool).type === "patchwork:tool"
  );
};

export const isDeferredTool = (value: unknown): value is DeferredTool => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    (value as DeferredTool).type === "patchwork:tool" &&
    "load" in value &&
    (value as DeferredTool).load instanceof Function
  );
};

export const allTools = () => {
  return { ...GlobalTools };
};

export const toolsForDataType = (
  dataType: DataType | string | undefined
): Tool[] => {
  if (!dataType) {
    return [];
  }

  if (isDataType(dataType)) {
    dataType = dataType.id;
  }

  const specificTools = Object.values(GlobalTools).filter((tool) =>
    tool.supportedDataTypes.includes(dataType)
  );

  const genericTools = Object.values(GlobalTools).filter((tool) =>
    tool.supportedDataTypes.includes("*")
  );

  return [...specificTools, ...genericTools];
};

export const toolById = (id: string | undefined): Tool | undefined => {
  if (!id) {
    return undefined;
  }
  return GlobalTools[id];
};

export type EditorProps<A, V> = {
  docPath: DocPath;
  docUrl: AutomergeUrl;
  docHeads?: Heads;
  activeDiscussionIds?: string[];

  /** These props are used to display annotations (diff highlights and comment highlights)
   *  and report back to the environment which anchors are currently selected or hovered
   */
  annotations?: AnnotationWithUIState<A, V>[];
  setSelectedAnchors?: (anchors: A[]) => void;
  setHoveredAnchor?: (anchor: A | null) => void;

  /** just some metadata to help render authors */
  actorIdToAuthor?: Record<ActorId, AutomergeUrl>; // todo: can we replace that with memoize?

  /** A typical editor only needs to deal with annotations, not annotation groups.
   *  The exception is if you want to display comments in the editor itself,
   *  as we do in the essay editor comments sidebar.
   */
  annotationGroups?: AnnotationGroupWithUIState<A, V>[];
  setSelectedAnnotationGroupId?: (groupId: string | undefined) => void;
  setHoveredAnnotationGroupId?: (groupId: string | undefined) => void;

  setCommentState?: (state: CommentState<A> | undefined) => void;

  hideInlineComments?: boolean;
  collapseContentWithoutChanges?: boolean;

  // HACK
  mainDocUrl: AutomergeUrl;
  activeBranchUrl?: AutomergeUrl;
};

export type AnnotationsViewProps<
  D extends HasVersionControlMetadata<TAnchor, TAnchorValue>,
  TAnchor,
  TAnchorValue
> = {
  doc: D;
  handle: DocHandle<D>;
  annotations: Annotation<TAnchor, TAnchorValue>[];
};
