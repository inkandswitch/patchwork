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
import { DocPath } from "./router/DocLink";
import { Plugin, getPluginRegistry } from "./plugins";
import { getMatchingPlugins } from "./plugins";

// To construct well-typed tools, we need ToolTyped with specific type
// parameters. But then we need Tool, which means "ToolTyped with unknown but
// well-defined type parameters". This is what's known as an existential type,
// which TypeScript doesn't have. In hackish but reasonable lieu of that, we
// just stuff a bunch of unknowns in there.
export type ToolImplementation = ToolTyped<
  HasVersionControlMetadata<unknown, unknown>,
  unknown,
  unknown
>;

export type ToolDescription = Plugin & {
  type: "patchwork:tool";
  supportedDataTypes: "*" | string[];
  name: string;
  icon?: IconType;
  load: () => Promise<
    ToolTyped<HasVersionControlMetadata<unknown, unknown>, unknown, unknown>
  >;
};

export type Tool = Plugin<ToolDescription, ToolImplementation>;

export type ToolTyped<D extends HasVersionControlMetadata<A, V>, A, V> = {
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
): ToolImplementation {
  console.warn(
    "makeTool is deprecated: it does nothing but a cast to ToolImplementation"
  );
  return tool as ToolImplementation;
}

export const isTool = (value: unknown): value is Tool => {
  return (
    value !== null &&
    typeof value === "object" &&
    "type" in value &&
    (value as Tool).type === "patchwork:tool"
  );
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

export const toolsForDataType = (dataType: string | undefined): Tool[] => {
  if (!dataType) {
    return [];
  }

  return getMatchingPlugins<Tool>("tools", "supportedDataTypes", dataType);
};

/**
 * Check if a tool is compatible with a given data type
 */
export const isToolCompatibleWithDataType = (
  tool: Tool | undefined,
  dataTypeId: string | undefined
): boolean => {
  if (!tool || !dataTypeId) return false;

  return (
    tool.supportedDataTypes === "*" ||
    (Array.isArray(tool.supportedDataTypes) &&
      tool.supportedDataTypes.includes(dataTypeId))
  );
};

/**
 * Find the best compatible tool for a data type from a list of tools
 * If the currently selected tool is compatible, it will be returned
 * Otherwise, the first compatible tool will be returned
 */
export const findCompatibleToolForDataType = (
  currentTool: Tool | undefined,
  dataTypeId: string | undefined
): Tool | undefined => {
  // If no data type ID, we can't determine compatibility
  if (!dataTypeId) return undefined;

  // If current tool is compatible, keep using it
  if (isToolCompatibleWithDataType(currentTool, dataTypeId)) {
    return currentTool;
  }

  const tools = toolsForDataType(dataTypeId);
  return tools[0];
};
