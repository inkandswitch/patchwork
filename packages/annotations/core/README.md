# @patchwork/annotations-core

A flexible annotation system for Patchwork that allows you to attach metadata to refs in documents. Annotations can track changes, comments, highlights, or any custom metadata.

**Key constraint**: Each ref can only have one annotation per type. Adding a new annotation of the same type to a ref will replace the existing one.

## Core Concepts

### Annotation Types

Annotation types are defined using `defineAnnotationType<T>()`. Each type is unique and type-safe.

```typescript
import { defineAnnotationType } from "@patchwork/annotations-core";

type DiffAnnotation = { type: "added" } | { type: "deleted" };
const Diff = defineAnnotationType<DiffAnnotation>();

type CommentRef = Ref<CommentThread>;
const Comment = defineAnnotationType<CommentRef>();
```

### AnnotationSet

An `AnnotationSet` stores annotations and provides powerful querying capabilities.

```typescript
import { AnnotationSet } from "@patchwork/annotations-core";
import { ref } from "@patchwork/refs";

const annotations = new AnnotationSet();

// Add annotations
const todoRef = ref(doc, "todos", { id: "A" });
annotations.add(todoRef, Diff({ type: "added" }));
```

## API

### defineAnnotationType<T>()

Creates a new annotation type with the following methods:

- `Type(value: T)` - Create an annotation value
- `Type.from(annotationSet)` - Returns a function to lookup an annotation by ref

```typescript
const Diff = defineAnnotationType<DiffType>();

// Create annotation values
const annotation = Diff({ type: "added" });

// Lookup annotation (returns undefined if not found)
const getDiff = Diff.from(annotationSet);
const diff = getDiff(someRef); // DiffType | undefined
```

### AnnotationSet

#### Internal Storage

The `AnnotationSet` uses an efficient internal storage format:

- Set of ref IDs (using `ref.toString()`)
- Map: `AnnotationType` → Map<refId, value>

The `AnnotationType` function itself is used as the map key, ensuring fast lookups and enforcing the one-annotation-per-type-per-ref constraint.

#### Methods

- `add<T>(ref: Ref<any>, annotation: AnnotationValue<T>): void`

  Add an annotation to a ref. If an annotation of the same type already exists for this ref, it will be replaced.

- `get<T>(type: AnnotationType<T>, ref: Ref<unknown>): T | undefined`

  Get an annotation for a specific ref and type. Returns `undefined` if not found.

- `merge(other: AnnotationSet): AnnotationSet`

  Merge two annotation sets into a new set. If both sets have an annotation of the same type for the same ref, the annotation from `other` takes precedence.

- `ofType<T>(type: AnnotationType<T>): AnnotationSetView<T>`

  Filter annotations by type.

- `on(ref: Ref<any>): AnnotationSetView<any>`

  Filter annotations on a specific ref (exact match).

- `onChildrenOf(ref: Ref<any>): AnnotationSetView<any>`

  Filter annotations on direct children of ref (for arrays/text).

- `onPartOf(ref: Ref<any>): AnnotationSetView<any>`

  Filter annotations anywhere in the subtree that ref points to.

- `toArray(): Array<[Ref<any>, any]>`

  Convert to an array of [ref, value] pairs.

- `[Symbol.iterator](): Iterator<[Ref<any>, any]>`

  Make the set iterable for use in for...of loops.

## Usage Examples

### Basic Usage

```typescript
import {
  defineAnnotationType,
  AnnotationSet,
} from "@patchwork/annotations-core";
import { ref } from "@patchwork/refs";

// Define annotation types
const Diff = defineAnnotationType<{ type: "added" | "deleted" }>();
const Comment = defineAnnotationType<string>();

// Create annotation set
const annotations = new AnnotationSet();

// Add annotations
const todoRef = ref(doc, "todos", 0);
annotations.add(todoRef, Diff({ type: "added" }));
annotations.add(todoRef, Comment("This is a new item"));

// Lookup annotations
const getDiff = Diff.from(annotations);
const diff = getDiff(todoRef); // { type: "added" }

const getComment = Comment.from(annotations);
const comment = getComment(todoRef); // "This is a new item"

// Or use get() directly
const diff2 = annotations.get(Diff, todoRef); // { type: "added" }

// Replacing an annotation (same type, same ref)
annotations.add(todoRef, Diff({ type: "deleted" }));
const newDiff = getDiff(todoRef); // { type: "deleted" } (replaced)
```

### Filtering and Iteration

```typescript
// Get all diff annotations
for (const [ref, diff] of annotations.ofType(Diff)) {
  console.log("Diff on", ref.url, ":", diff);
}

// Get annotations on a specific ref
const todoRef = ref(doc, "todos", 0);
for (const [ref, value] of annotations.on(todoRef)) {
  console.log("Annotation:", value);
}

// Get annotations on elements of an array
const todosRef = ref(doc, "todos");
for (const [ref, diff] of annotations.ofType(Diff).onChildrenOf(todosRef)) {
  console.log("Todo item", ref, "has diff:", diff);
}

// Get annotations anywhere in a subtree
const documentRef = ref(doc);
for (const [ref, value] of annotations.onPartOf(documentRef)) {
  console.log("Found annotation in document:", value);
}
```

### Merging Annotation Sets

```typescript
const docAnnotations = new AnnotationSet();
const todoAnnotations = new AnnotationSet();

// Add annotations to each set...

// Merge them
const allAnnotations = docAnnotations.merge(todoAnnotations);

// Query the merged set
const getDiff = Diff.from(allAnnotations);
const diff = getDiff(someRef);
```

### Chain Filters

```typescript
// Combine multiple filters
const content = ref(doc, "content");
const diffs = annotations.ofType(Diff).onChildrenOf(content).toArray();
```

## Type Safety

The annotation system is fully type-safe:

```typescript
type MyDiff = { type: "added"; timestamp: number } | { type: "deleted" };
const Diff = defineAnnotationType<MyDiff>();

const annotations = new AnnotationSet();
const ref1 = ref(doc, "item", 0);

// Type-safe annotation creation
annotations.add(ref1, Diff({ type: "added", timestamp: Date.now() }));

// Type-safe lookup
const getDiff = Diff.from(annotations);
const diff = getDiff(ref1); // MyDiff | undefined

// Type-safe iteration
for (const [ref, diff] of annotations.ofType(Diff)) {
  // diff is typed as MyDiff
  if (diff.type === "added") {
    console.log(diff.timestamp);
  }
}
```
