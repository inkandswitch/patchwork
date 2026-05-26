import { defineAnnotationType } from "@inkandswitch/annotations";
import type { Ref, RefUrl } from "@automerge/automerge-repo";

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
  contactUrl: string;
  timestamp: number;
};

/**
 * Annotation type for marking refs with a comment thread.
 * The value is a Ref pointing to the Thread object.
 */
export const CommentThread = defineAnnotationType<Ref<CommentThread>>(
  "patchwork/commentThread"
);
