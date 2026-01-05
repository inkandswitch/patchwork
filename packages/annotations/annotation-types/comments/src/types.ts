import { defineAnnotationType } from "@inkandswitch/annotations";
import { RefOfType, RefUrl } from "@patchwork/refs";
import { Ref } from "@patchwork/refs";

export type CommentThread = {
  id: string;
  refs: Ref[];
  isResolved: boolean;
  comments: Comment[];
};

export type SerializedCommentThread = Omit<CommentThread, "refs"> & {
  refs: RefUrl[];
};

export type DocWithComments = {
  "@comments"?: {
    threads: SerializedCommentThread[];
  };
};

export type Comment = {
  id: string;
  content?: string;
  draftContent?: string;
  contactUrl: string;
  timestamp: number;
};

/**
 * Annotation type for marking refs with a comment thread.
 * The value is a Ref pointing to the Thread object.
 */
// todo: ref should be typed to point to a CommentThread object
export const CommentThread = defineAnnotationType<
  RefOfType<SerializedCommentThread>
>("patchwork/commentThread");
