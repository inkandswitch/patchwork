import { defineAnnotationType } from "@inkandswitch/annotations";
import { RefOfType, RefUrl } from "@patchwork/refs";

export type CommentThread = {
  id: string;
  refs: RefUrl[];
  isResolved: boolean;
  comments: Comment[];
};

export type DocWithComments = {
  "@comments"?: {
    threads: CommentThread[];
  };
};

export type Comment = {
  id: string;
  content?: string;
  draftContent?: string;
  authorId: string;
  timestamp: number;
};

/**
 * Annotation type for marking refs with a comment thread.
 * The value is a Ref pointing to the Thread object.
 */
// todo: ref should be typed to point to a CommentThread object
export const CommentThread = defineAnnotationType<RefOfType<CommentThread>>(
  "patchwork/commentThread"
);
