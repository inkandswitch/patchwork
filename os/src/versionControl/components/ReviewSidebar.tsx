import { Button } from "@/shadcn/ui/button";
import { Tool } from "@/tools";
import {
  AnnotationGroupWithUIState,
  CommentState,
  HasVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { DocHandle } from "@automerge/automerge-repo";
import React from "react";
import { getAnnotationGroupId } from "../annotations";
import { AnnotationGroupView } from "./AnnotationGroupView";

type ReviewSidebarProps = {
  doc: HasVersionControlMetadata<unknown, unknown>;
  handle: DocHandle<HasVersionControlMetadata<unknown, unknown>>;
  tool: Tool;
  readonly?: boolean;
  selectedAnchors: unknown[];
  annotationGroups: AnnotationGroupWithUIState<unknown, unknown>[];
  setSelectedAnnotationGroupId: (id: string | undefined) => void;
  setHoveredAnnotationGroupId: (id: string | undefined) => void;
  isCommentInputFocused: boolean;
  setIsCommentInputFocused: (isFocused: boolean) => void;
  setCommentState: (state: CommentState<unknown> | undefined) => void;
};

export type PositionMap = Record<string, { top: number; bottom: number }>;

export const ReviewSidebar = React.memo(
  ({
    doc,
    handle,
    readonly,
    tool,
    annotationGroups,
    selectedAnchors,
    setSelectedAnnotationGroupId,
    setHoveredAnnotationGroupId,
    setCommentState,
  }: ReviewSidebarProps) => {
    const editingComment = annotationGroups.some(
      (group) =>
        group.comment?.type === "create" || group.comment?.type === "edit"
    );

    return (
      <div className="h-full flex flex-col">
        <div className="bg-gray-50 flex-1 p-2 flex flex-col z-20 m-h-[100%] overflow-y-auto overflow-x-visible">
          {annotationGroups.map((annotationGroup, index) => {
            const id = getAnnotationGroupId(annotationGroup);
            return (
              <AnnotationGroupView
                doc={doc}
                readonly={readonly}
                handle={handle}
                AnnotationsViewComponent={tool.AnnotationsViewComponent}
                key={id}
                annotationGroup={annotationGroup}
                setIsHovered={(isHovered) => {
                  setHoveredAnnotationGroupId(isHovered ? id : undefined);
                }}
                setIsSelected={(isSelected) => {
                  setSelectedAnnotationGroupId(isSelected ? id : undefined);
                }}
                onSelectNext={() => {
                  const nextAnnotation = annotationGroups[index + 1];
                  if (nextAnnotation) {
                    setSelectedAnnotationGroupId(
                      getAnnotationGroupId(nextAnnotation)
                    );
                  }
                }}
                onSelectPrev={() => {
                  const prevAnnotation = annotationGroups[index - 1];
                  if (prevAnnotation) {
                    setSelectedAnnotationGroupId(
                      getAnnotationGroupId(prevAnnotation)
                    );
                  }
                }}
                setCommentState={setCommentState}
                hasNext={index < annotationGroups.length - 1}
                hasPrev={index > 0}
                enableScrollSync
              />
            );
          })}
        </div>

        {!readonly && (
          <div className="bg-gray-50 z-10 px-2 py-4 flex flex-col gap-3 border-b border-gray-200 ">
            <Button
              variant="outline"
              disabled={editingComment}
              onClick={() => {
                setCommentState({
                  type: "create",
                  target:
                    selectedAnchors.length > 0 ? selectedAnchors : undefined,
                });
              }}
            >
              Add comment {selectedAnchors.length > 0 ? "on selection" : ""}
              <span className="text-gray-400 ml-2 text-xs">
                (⌘ + shift + m)
              </span>
            </Button>
          </div>
        )}
      </div>
    );
  }
);
