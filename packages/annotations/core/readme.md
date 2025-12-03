# Annotations

## Installation

```
npm add jsr:@patchwork/annotations
```

## API

```ts
const Comment = defineAnnotation<string>();

// add annotations

const partWithComment = ref(doc.content, cursor(0, 2));

const annotations = new AnnotationSet();

annotations.add(partWithComment, Comment("this is neat"));

// get diff annotations on conent

const content = ref(doc.content);

const diffAnnotations = annotations.onChildrenOf(content).ofType(Diff);

for (const [ref, diff] of diffAnnotations) {
  console.log(ref, diff);
}

// get annotations on a single ref

const todo = ref(doc.todos, { id: 1 });

const todoAnnotations = annotations.onRef(todo);

for (const annotation of todoAnnotations) {
  console.log(annotation.type, annotation.value);
}

// reactivity

const unsubscribe = annotation.ofType(Diff).subscribe((diffAnnotations) => {});
```

annotations.add(diffAnnotation)

annotations.change(() => {
annotations.clear();
annotations.add();
})
