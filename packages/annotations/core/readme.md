# Annotations

## Installation

```
npm add jsr:@patchwork/annotations
```

## API

### Defining Annotation Types

Annotation types are identified by their string ID, not by instance. This means two tools can import an annotation type and
bundle that dependency in and it will still

When creating a new annotation name you should choose a unique name similar to tool and datatype ids

```ts
import { defineAnnotationType } from "@patchwork/annotations";

const Comment = defineAnnotationType<string>("patchwork/comment");
const Highlight = defineAnnotationType<{ color: string }>(
  "patchwork/highlight"
);
```

### Adding Annotations

When you add an annotation set to another, the parent receives live updates whenever the child changes. This makes it cheap to combine annotations from different sources—no data is copied, just references. This design supports flexibility: different tools can produce their own annotation sets, and consumers can compose them together however they like.

```ts
import { AnnotationSet } from "@patchwork/annotations";
import { ref } from "@patchwork/refs";

const annotations = new AnnotationSet();

// add a single annotation
const titleRef = ref(handle, "title");
annotations.add(titleRef, Comment("This is neat"));

// add multiple annotations to the same ref
annotations.add(titleRef, [
  Comment("First comment"),
  Highlight({ color: "yellow" }),
]);

// compose annotation sets
const otherAnnotations = new AnnotationSet();
annotations.add(otherAnnotations);
```

### Querying Annotations

```ts
// get all annotations of a type
const commentAnnotations = annotations.ofType(Comment);

for (const [ref, annotation] of commentAnnotations) {
  console.log(ref.toString(), annotation.value);
}

// lookup a specific annotation
const value = comments.lookup(titleRef);

// get all annotations on a specific ref
const titleAnnotations = annotations.onRef(titleRef);

for (const [ref, annotation] of titleAnnotations) {
  console.log(annotation.type.id, annotation.value);
}

// lookup by type
const comment = titleAnnotations.lookup(Comment);
const highlight = titleAnnotations.lookup(Highlight);

// get annotations on children of an array or text ref
const itemsRef = ref(handle, "items");
const childAnnotations = annotations.onChildrenOf(itemsRef);
```

### Removing Annotations

```ts
// remove all annotations of a specific type
annotations.remove(Comment);

// remove all annotations on a ref
annotations.remove(titleRef);

// remove annotations of a specific type on a ref
annotations.remove(titleRef, Comment);
```

### Reactivity

```ts
// subscribe to all changes
const unsubscribe = annotations.subscribe(() => {
  console.log("Annotations changed");
});

// listen to specific events
annotations.on("added", (addedAnnotations) => {
  for (const [ref, annotation] of addedAnnotations) {
    console.log("Added:", annotation.value);
  }
});

annotations.on("removed", (removedAnnotations) => {
  for (const [ref, annotation] of removedAnnotations) {
    console.log("Removed:", annotation.value);
  }
});

// filtered views are also reactive
const comments = annotations.ofType(Comment);
comments.subscribe(() => {
  console.log("Comments changed");
});
```
