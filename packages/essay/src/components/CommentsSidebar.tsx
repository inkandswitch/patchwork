import { next as A } from "@automerge/automerge";
import { AnnotationGroupWithPosition } from "../utils";
import { Button } from "@patchwork/sdk/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@patchwork/sdk/ui";
import {
  getAnnotationGroupId,
  CommentState,
} from "@patchwork/sdk/versionControl";
import { DocHandle } from "@automerge/automerge-repo";
import { MessageCircle } from "lucide-react";
import { TextSelection } from "./MarkdownDocEditor";
import { MarkdownDoc } from "../datatype";
import { EssayAnnotations } from "./EssayAnnotations";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import { AnnotationGroupView } from "@patchwork/sdk/components/AnnotationGroupView";

export const CommentsSidebar = ({
  doc,
  handle,
  readonly,
  selection,
  hasEditorFocus,
  hideInlineComments,
  annotationGroupsWithPosition,
  setSelectedAnnotationGroupId,
  setHoveredAnnotationGroupId,
  setCommentState,
}: {
  doc: MarkdownDoc;
  handle: DocHandle<MarkdownDoc>;
  readonly?: boolean;
  selection: TextSelection | undefined;
  hasEditorFocus: boolean;
  hideInlineComments: boolean;
  annotationGroupsWithPosition: AnnotationGroupWithPosition[];
  setSelectedAnnotationGroupId: ((id: string | undefined) => void) | undefined;
  setHoveredAnnotationGroupId: ((id: string | undefined) => void) | undefined;
  setCommentState?: (state: CommentState<TextAnchor> | undefined) => void;
}) => {
  return (
    <div className="relative">
      {!hideInlineComments &&
        annotationGroupsWithPosition.map((annotationGroup, index) => {
          const id = getAnnotationGroupId(annotationGroup);

          return (
            <div
              key={id}
              className={`absolute transition-all ease-in-out w-[350px] ${
                annotationGroup.state === "expanded" ? "z-50" : "z-0"
              }`}
              style={{
                top: annotationGroup.yCoord,
              }}
            >
              <AnnotationGroupView
                doc={doc}
                handle={handle}
                readonly={readonly}
                annotationGroup={annotationGroup}
                AnnotationsViewComponent={EssayAnnotations}
                setIsHovered={(isHovered) => {
                  setHoveredAnnotationGroupId?.(isHovered ? id : undefined);
                }}
                setIsSelected={(isSelected) => {
                  setSelectedAnnotationGroupId?.(isSelected ? id : undefined);
                }}
                onSelectNext={() => {
                  const nextAnnotation =
                    annotationGroupsWithPosition[index + 1];
                  if (nextAnnotation) {
                    setSelectedAnnotationGroupId?.(
                      getAnnotationGroupId(nextAnnotation)
                    );
                  }
                }}
                onSelectPrev={() => {
                  const prevAnnotation =
                    annotationGroupsWithPosition[index - 1];
                  if (prevAnnotation) {
                    setSelectedAnnotationGroupId?.(
                      getAnnotationGroupId(prevAnnotation)
                    );
                  }
                }}
                hasNext={index < annotationGroupsWithPosition.length - 1}
                hasPrev={index > 0}
                setCommentState={setCommentState}
                hideInlineCommentAnnotations={true}
              />
            </div>
          );
        })}

      {selection && selection.from !== selection.to && hasEditorFocus && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger
              className="absolute"
              style={{
                top: selection.yCoord + 24,
                left: -60,
              }}
              asChild
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // todo: remove this once cursors can point to sides of characters
                  // can't point after last character so we use the last character instead
                  const to = Math.min(doc.content.length - 1, selection.to);

                  setCommentState?.({
                    type: "create",
                    target: [
                      {
                        fromCursor: A.getCursor(
                          doc,
                          ["content"],
                          selection.from
                        ),
                        toCursor: A.getCursor(doc, ["content"], to),
                      },
                    ],
                  });
                }}
              >
                <MessageCircle size={20} className="text-gray-400" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex gap-2">
              <span>comment</span>
              <span className="text-gray-400 text-xs">(⌘ + shift + M)</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
