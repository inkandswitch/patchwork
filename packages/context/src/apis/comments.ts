import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { CONTEXT, defineField } from "../core";
import { contextComputation } from "../core/computation";
import { IdRef, loadRef, Ref, RefWith, SerializedRef } from "../core/refs";
import { memoize } from "../utils/memoize";

export type DocWithComments = {
  "@comments"?: Comment[];
};

export type Comment = {
  refs: SerializedRef[];
  isDraft: boolean;
  id: string;
  content?: string;
  draftContent?: string;
  contactUrl: AutomergeUrl;
  timestamp: number;
};

// todo: add support for collection fields
const CommentsSymbol = Symbol("comments");
export type Comments = typeof CommentsSymbol;
export const Comments = defineField<Comments, Ref<Comment>>(
  "comments",
  CommentsSymbol
);

export const getComments = memoize(
  (ref: Ref) =>
    contextComputation(() => {
      const comments = CONTEXT.resolve(ref).get(Comments);
      return comments ? [comments] : [];
    }),
  (ref: Ref) => ref.toId()
);

export const getCommentsOfDoc = (docHandle: DocHandle<DocWithComments>) => {
  const refsWithComments: RefWith<Comments>[] = [];

  const comments = docHandle.doc()["@comments"];

  if (!comments) {
    return [];
  }

  for (const comment of comments) {
    const commentRef = new IdRef<Comment>(
      docHandle,
      ["@comments"],
      comment.id,
      "id"
    );

    for (const serializedRef of comment.refs) {
      const ref = loadRef(docHandle, serializedRef);

      refsWithComments.push(ref.with(Comments(commentRef)));
    }
  }

  return refsWithComments;
};

export const createComment = ({
  refs,
  contactUrl,
}: {
  refs: Ref[];
  content: string;
  contactUrl: AutomergeUrl;
}): RefWith<Comments> => {
  if (refs.length === 0) {
    throw new Error("A comments needs to be attached to at least one ref");
  }

  const docRef = refs[0].docRef as Ref<DocWithComments, DocWithComments>;

  for (const ref of refs) {
    if (!ref.docRef.isEqual(docRef)) {
      throw new Error(
        "Creating comments across documents is currently not supported"
      );
    }
  }

  const commentId = crypto.randomUUID();

  docRef.change((doc) => {
    if (!doc["@comments"]) {
      doc["@comments"] = [];
    }

    doc["@comments"].push({
      refs: refs.map((ref) => ref.serialize()),
      isDraft: true,
      id: crypto.randomUUID(),
      contactUrl,
      timestamp: Date.now(),
    });
  });

  return new IdRef(docRef.docHandle, ["@comments"], commentId, "id");
};

export const allComments = contextComputation(() => CONTEXT.refsWith(Comments));
