---
"@inkandswitch/patchwork-comments": minor
---

Renamed from `@inkandswitch/annotations-comments` and republished as a
standalone package (no longer part of the annotations stack).

Exports schema types and write helpers for Patchwork comment threads:

- Types: `Comment`, `CommentThread`, `DocWithComments` (documents store
  threads under a top-level `"@comments"` field).
- Helpers: `createCommentThread(refs)`, `createReply({ threadRef, content,
  contactUrl })`, and `createComment({ refs, content, contactUrl })`, all
  operating directly on `automerge-repo` `Ref`s / `DocHandle`s.
