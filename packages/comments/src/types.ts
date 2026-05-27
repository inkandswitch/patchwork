import type { RefUrl } from "@automerge/automerge-repo";

export type Comment = {
  id: string;
  content?: string;
  draftContent?: string;
  contactUrl: string;
  timestamp: number;
};

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
