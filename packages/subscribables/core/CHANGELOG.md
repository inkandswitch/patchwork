# @inkandswitch/subscribables

## 0.1.0

### Minor Changes

- f8a91ca: ### @inkandswitch/subscribables
  - `Signal`, `SignalValue`, and `SignalObject` types
  - `computed()` for derived subscribables
  - `SubscriberSet` for managing subscriptions
  - `valueOfSignal()` and `isSignalValue()` helpers

  ### @inkandswitch/subscribables-react
  - `useSubscribe()` hook for subscribing to Signal values in React components

  ### @inkandswitch/subscribables-solid
  - `useSubscribe()` hook for subscribing to Signal values in Solid components
  - Uses `createStore` with `reconcile` for SignalValue (granular updates)
  - Uses Solid's `from` for SignalObject

  ### @patchwork/refs-react
  - `useRefValue()` hook for subscribing to Ref values in React

  ### @patchwork/refs
  - Added `remove()` method for deleting from objects, arrays, and text ranges
  - Added `isChildOf()` method for checking parent-child relationships
  - Added `rangePositions` getter for cursor range positions
  - `fromUrl()` now throws if documentId doesn't match handle
  - Exported `Ref` type from main index
  - Ref cache now shared via globalThis across library instances

  ### @inkandswitch/annotations
  - `AnnotationSet` for storing annotations attached to refs
  - `defineAnnotationType()` for creating annotation types
  - Hierarchical composition of annotation sources
  - Query methods: `ofType()`, `onRef()`, `onChildrenOf()`, `onPartOf()`

  ### @inkandswitch/annotations-context
  - Global `window.annotationContext` for sharing annotations across tools
  - Only exposes `add`/`remove` for sources, not individual annotations

  ### @inkandswitch/annotations-comments
  - `CommentThread` annotation type
  - `createCommentThread()`, `createReply()`, `createComment()` helpers
  - `commentThreadsWithRefOfDoc()` for loading threads from documents

  ### @inkandswitch/annotations-diff
  - `Diff` annotation type ("added", "changed", "deleted")
  - `diffAnnotationsOfDoc()` for computing diffs between heads
  - `ViewHeads` annotation type

  ### @inkandswitch/annotations-selection
  - `IsSelected` annotation type
  - `$selectedRefs`, `$selectedDocUrls`, `$selectedDocHandles` computed subscribables
  - `isSelected()` helper
