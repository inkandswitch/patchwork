import { AnnotationsViewProps, useCurrentAccount } from "..";
import { ContactAvatar } from "../components";
import { getRelativeTimeString } from "../versionControl";
import { MarkdownInput } from "../markdown";
import { Button } from "../ui";
import {
  AnnotationGroupWithUIState,
  CommentState,
  HasVersionControlMetadata,
} from "../versionControl";
import { next as A, uuid } from "@automerge/automerge";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { Check, MessageCircle, PencilIcon } from "lucide-react";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { getAnnotationGroupId } from "../versionControl";
import { applyCursorPatches, CursorPatch } from "../versionControl";

export interface AnnotationGroupViewProps<
  D extends HasVersionControlMetadata<T, V>,
  T = unknown,
  V = unknown
> {
  doc: D;
  domRef?: MutableRefObject<HTMLDivElement>;
  handle: DocHandle<D>;
  annotationGroup: AnnotationGroupWithUIState<T, V>;
  AnnotationsViewComponent?: React.FC<AnnotationsViewProps<D, T, V>>;
  onSelectNext: () => void;
  onSelectPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  setIsHovered: (isHovered: boolean) => void;
  setIsSelected: (isSelected: boolean) => void;
  setCommentState?: (state: CommentState<T> | undefined) => void;
  readonly?: boolean;
  enableScrollSync?: boolean; // todo: this shouldn't be a flag
  hideInlineCommentAnnotations?: boolean;
}
export const AnnotationGroupView = <
  D extends HasVersionControlMetadata<T, V>,
  T = unknown,
  V = unknown
>({
  doc,
  domRef,
  handle,
  annotationGroup,
  AnnotationsViewComponent,
  setIsHovered,
  setIsSelected,
  hasNext,
  hasPrev,
  onSelectNext,
  onSelectPrev,
  setCommentState,
  enableScrollSync,
  hideInlineCommentAnnotations,
  readonly = false,
}: AnnotationGroupViewProps<D, T, V>) => {
  const account = useCurrentAccount();
  const [height, setHeight] = useState<number>();
  const [isBeingResolved, setIsBeingResolved] = useState(false);
  const localRef: MutableRefObject<HTMLDivElement | null> = useRef(null); // Use useRef to create a local ref

  const isExpanded = annotationGroup.state === "expanded";
  const isFocused = annotationGroup.state !== "neutral";
  const isRevertable =
    // all change annotations have inverse patches
    annotationGroup.annotations.every(
      (annotation) =>
        annotation.type === "highlighted" || annotation.inversePatches
    ) &&
    // ... and the annotation group consists not only of highlight annotations
    annotationGroup.annotations.some(
      (annotation) => annotation.type !== "highlighted"
    );
  const hasComment = annotationGroup.discussion || annotationGroup.comment;

  const setRef = useCallback(
    (element: HTMLDivElement) => {
      localRef.current = element; // Assign the element to the local ref

      if (domRef) {
        // Forward the ref to the parent
        domRef.current = element;
      }
    },
    [domRef]
  );

  const onRevert = useCallback(() => {
    const patches = annotationGroup.annotations.flatMap((annotation) =>
      "inversePatches" in annotation && annotation.inversePatches
        ? annotation.inversePatches
        : ([] as CursorPatch[])
    );

    handle.change((doc) => {
      applyCursorPatches(doc, patches);
    });
  }, [annotationGroup.annotations, handle]);

  const onResolveDiscussion = useCallback(() => {
    handle.change((doc) => {
      const discussionId = annotationGroup.discussion?.id;
      if (!discussionId) {
        return;
      }

      doc.discussions[discussionId].resolved = true;
    });

    if (hasNext) {
      onSelectNext();
    } else if (hasPrev) {
      onSelectPrev();
    }
  }, [
    annotationGroup.discussion?.id,
    handle,
    hasNext,
    hasPrev,
    onSelectNext,
    onSelectPrev,
  ]);

  const onStartResolve = useCallback(() => {
    if (!localRef.current?.clientHeight) {
      return;
    }

    setHeight(localRef.current.clientHeight);
    // delay, so height is set first for transition
    requestAnimationFrame(() => {
      setIsBeingResolved(true);
    });
  }, []);

  const onReply = useCallback(() => {
    if (!setCommentState) {
      return;
    }

    setCommentState({
      type: "create",
      target: getAnnotationGroupId(annotationGroup),
    });
  }, [annotationGroup, setCommentState]);

  const onUpdateCommentContentWithId = useCallback(
    (id: string, content: string) => {
      const discussionId = annotationGroup.discussion?.id;

      if (!discussionId) {
        return;
      }

      handle.change((doc) => {
        const index = doc.discussions[discussionId].comments.findIndex(
          (comment) => comment.id === id
        );

        A.updateText(
          doc,
          ["discussions", discussionId, "comments", index, "content"],
          content
        );
      });
    },
    [annotationGroup.discussion?.id, handle]
  );

  const addCommentToAnnotationGroup = useCallback(
    (content: string) => {
      if (!account) {
        return;
      }

      handle.change((doc) => {
        let discussions = doc.discussions;

        // convert docs without discussions
        if (!discussions) {
          doc.discussions = {};
          discussions = doc.discussions;
        }

        let discussionId: string;

        if (annotationGroup.discussion?.id) {
          discussionId = annotationGroup.discussion?.id;
        } else {
          discussionId = uuid();
          discussions[discussionId] = {
            id: discussionId,
            heads: handle.heads(),
            comments: [],
            resolved: false,
            anchors: annotationGroup.annotations.map(
              (annotation) => annotation.anchor
            ),
          };
        }

        discussions[discussionId].comments.push({
          id: uuid(),
          content,
          contactUrl: account.contactHandle.url,
          timestamp: Date.now(),
        });
      });
    },
    [
      account,
      annotationGroup.annotations,
      annotationGroup.discussion?.id,
      handle,
    ]
  );

  // handle keyboard shortcuts
  /*
   * k / ctrl + p / cmd + p : select previous discussion
   * j / ctrl + n / cmd + n: select next discussion
   * cmd + r / ctrl + r : resolve
   * cmd + enter / ctrl + enter : reply
   * cmd + backspace / ctrl + backspace : revert
   */
  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const onKeydown = (evt: KeyboardEvent) => {
      const isMetaOrControlPressed = evt.ctrlKey || evt.metaKey;

      // select previous discussion
      if (evt.key === "k" || (evt.key === "p" && isMetaOrControlPressed)) {
        onSelectPrev();
        return;
      }

      // select next discussion
      if (evt.key === "j" || evt.key === "n") {
        onSelectNext();
        return;
      }

      if (!readonly) {
        if (evt.key === "r" && isMetaOrControlPressed) {
          onStartResolve();
          evt.preventDefault();
          evt.stopPropagation();
        }

        if (evt.key === "Backspace" && isRevertable && isMetaOrControlPressed) {
          onRevert();
          evt.preventDefault();
          evt.stopPropagation();
        }

        if (evt.key === "Enter" && isMetaOrControlPressed && setCommentState) {
          setCommentState({
            type: "create",
            target: getAnnotationGroupId(annotationGroup),
          });
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    };

    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("keydown", onKeydown);
    };
  }, [
    readonly,
    isRevertable,
    isExpanded,
    onSelectNext,
    onSelectPrev,
    onStartResolve,
    onRevert,
    setCommentState,
    annotationGroup,
  ]);

  // Scroll this annotation group into view when it's expanded.
  // This handles two distinct interactions:
  // 1) when the annotation group is selected from within a doc editor,
  //    the sidebar scrolls to make it visible
  // 2) When the user selects an annotation group within the sidebar,
  //    this ensures that the entire annotation group is made visible.
  //    If it's already fully visible nothing happens; but if it's only
  //    partially visible then this makes it fully visible.
  useEffect(() => {
    if (isExpanded && enableScrollSync) {
      localRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isExpanded, enableScrollSync]);

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      ref={setRef}
      className={`pt-2 transition-all ${
        isBeingResolved ? "overflow-hidden" : ""
      }`}
      style={
        height !== undefined
          ? {
              height: isBeingResolved ? "0" : `${height}px`,
            }
          : undefined
      }
      onTransitionEnd={() => {
        if (isBeingResolved) {
          onResolveDiscussion();
        }
      }}
    >
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsSelected(true)}
        className="flex flex-col gap-1"
      >
        <div
          className={`flex flex-col gap-2 bg-white rounded-sm p-2 border-2 ${
            isFocused
              ? "border-blue-600 shadow-lg"
              : annotationGroup.state === "focused"
              ? "border-blue-600 shadow-lg"
              : ""
          }`}
        >
          {(!hideInlineCommentAnnotations || !hasComment) &&
            (AnnotationsViewComponent ? (
              <AnnotationsViewComponent
                doc={doc}
                handle={handle}
                annotations={annotationGroup.annotations}
              />
            ) : (
              <div className="text-gray-500 text-xs italic">
                No view available for this edit
              </div>
            ))}

          <div className="mx-1.5 cursor-default">
            {annotationGroup.discussion?.comments.map((comment) => (
              <DiscussionCommentView
                contactUrl={comment.contactUrl}
                timestamp={comment.timestamp}
                content={comment.content}
                key={comment.id}
                readonly={readonly || !setCommentState}
                docHandle={handle}
                onChangeContent={(content) =>
                  onUpdateCommentContentWithId(comment.id, content)
                }
                isBeingEdited={
                  annotationGroup.comment?.type === "edit" &&
                  annotationGroup.comment?.commentId === comment.id
                }
                setIsBeingEdited={(isBeingEdited) => {
                  if (!setCommentState) {
                    return;
                  }

                  setCommentState(
                    isBeingEdited
                      ? { type: "edit", commentId: comment.id }
                      : undefined
                  );
                }}
              />
            ))}
          </div>
          {!readonly &&
            setCommentState &&
            annotationGroup.comment?.type === "create" &&
            account && (
              <DiscussionCommentView
                contactUrl={account.contactHandle.url}
                docHandle={handle}
                onChangeContent={(content) => {
                  setCommentState(undefined);
                  addCommentToAnnotationGroup(content);
                }}
                readonly={readonly}
                isBeingEdited={true}
                setIsBeingEdited={() => {
                  setCommentState(undefined);
                }}
              />
            )}
        </div>
        {!readonly && (
          <div
            className={`overflow-hidden transition-all flex items-center gap-2 ${
              isExpanded && !annotationGroup.comment
                ? "h-[43px] opacity-100 mt-2"
                : "h-[0px] opacity-0"
            }`}
          >
            <Button
              variant="ghost"
              className="select-none px-2 flex flex-col w-fi"
              onClick={onReply}
            >
              <div className="flex text-gray-600 gap-2">
                <MessageCircle size={16} /> Reply
              </div>
              <span className="text-gray-400 text-xs w-full text-center">
                (⌘ + ⏎)
              </span>
            </Button>

            {annotationGroup.discussion && (
              <Button
                variant="ghost"
                className="select-none px-2 flex flex-col w-fi"
                onClick={onStartResolve}
              >
                <div className="flex text-gray-600 gap-2">
                  <Check size={16} /> Resolve
                </div>
                <span className="text-gray-400 text-xs w-full text-center">
                  (⌘ + R)
                </span>
              </Button>
            )}

            {isRevertable && (
              <Button
                variant="ghost"
                className="select-none px-2 flex flex-col w-fi"
                onClick={onRevert}
              >
                <div className="flex text-gray-600 gap-2">
                  <Check size={16} /> Revert
                </div>
                <span className="text-gray-400 text-xs w-full text-center">
                  (⌘ + ⌫)
                </span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscussionCommentView = ({
  contactUrl,
  timestamp,
  content = "",
  docHandle,
  onChangeContent,
  isBeingEdited,
  setIsBeingEdited,
  readonly,
}: {
  contactUrl: AutomergeUrl;
  timestamp?: number;
  content?: string;
  onChangeContent: (value: string) => void;
  docHandle: DocHandle<unknown>;
  isBeingEdited: boolean;
  setIsBeingEdited: (isBeingEdited: boolean) => void;
  readonly: boolean;
}) => {
  const [isBeingHovered, setIsBeingHovered] = useState(false);
  const [updatedText, setUpdatedContent] = useState<string>();
  const account = useCurrentAccount();
  const isOwnComment = account?.contactHandle.url === contactUrl;

  return (
    <div
      onMouseEnter={() => setIsBeingHovered(true)}
      onMouseLeave={() => setIsBeingHovered(false)}
    >
      <div className="flex items-center justify-between text-sm cursor-default">
        <div className="flex items-center gap-2">
          <ContactAvatar url={contactUrl} showName={true} size="sm" />

          {timestamp !== undefined && (
            <div className="text-xs text-gray-400">
              {getRelativeTimeString(timestamp)}
            </div>
          )}
        </div>

        {isOwnComment && !readonly && (
          <Button
            variant="ghost"
            size="sm"
            className={!isBeingHovered || isBeingEdited ? "invisible" : ""}
            onClick={() => {
              setIsBeingEdited(true);
              setUpdatedContent(content);
            }}
          >
            <PencilIcon size={14} />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div
          className={`text-sm ${
            isBeingEdited
              ? "border border-1 rounded-sm px-2 border-gray-300 min-h-20"
              : "border-white"
          }`}
          onKeyDownCapture={(event) => {
            // stop navigation key presses from bubbling up
            if (
              event.key === "k" ||
              event.key === "j" ||
              event.key === "p" ||
              event.key === "n"
            ) {
              event.stopPropagation();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setIsBeingEdited(false);
              return;
            }

            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              event.stopPropagation();
              onChangeContent(updatedText ?? "");
              setIsBeingEdited(false);
              return;
            }
          }}
        >
          <MarkdownInput
            autoFocus
            value={content}
            onChange={isBeingEdited ? setUpdatedContent : undefined}
            docHandle={docHandle}
          />
        </div>

        {isBeingEdited && (
          <div className="flex gap-1 justify-end">
            <Button
              variant="default"
              onClick={() => {
                onChangeContent(updatedText ?? "");
                setIsBeingEdited(false);
                setUpdatedContent(undefined);
              }}
            >
              Comment
              <span className="text-gray-400 ml-1 text-xs">(⌘ + ⏎)</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setIsBeingEdited(false);
                setUpdatedContent(undefined);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="right"></div>
      </div>
    </div>
  );
};
