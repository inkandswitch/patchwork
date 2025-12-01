/**
 * Example usage of the annotation system
 * 
 * This file demonstrates how to use annotations to track changes and comments
 * in a document-based system.
 */

import { defineAnnotationType, AnnotationSet } from "./src/index";
import { ref, type Ref } from "@patchwork/refs";

// =======================================================================
// Define Annotation types
// =======================================================================

type DiffAdded = { type: "added" };
type ChangedDiff<T> = { type: "changed"; oldValue: T; newValue: T };
type DeletedDiff<T> = { type: "deleted"; oldValue: T };
type Diff<T = unknown> = DiffAdded | ChangedDiff<T> | DeletedDiff<T>;

const Diff = defineAnnotationType<Diff>();
const CommentThread = defineAnnotationType<Ref<any>>();

// =======================================================================
// Create annotations (example - would need actual doc handles)
// =======================================================================

// Example of how you would use it:
// 
// const markdownDoc = (await repo.find(markdownDocUrl)).doc();
// const markdownAnnotations = new AnnotationSet();
// 
// const addedPart = ref(markdownDoc.content, [5, 6]);
// markdownAnnotations.add(addedPart, Diff({ type: "added" }));
// 
// const todoDoc = (await repo.find(todoDocUrl)).doc();
// const todoAnnotations = new AnnotationSet();
// 
// const todoA = ref(todoDoc.todos, { id: "A" });
// const todoB = ref(todoDoc.todos, { id: "B" });
// const threadC = ref(todoDoc.threads, { id: "C" });
// 
// todoAnnotations.add(todoA, Diff({ type: "added" }));
// todoAnnotations.add(todoB, CommentThread(threadC));

// =======================================================================
// Combine annotations
// =======================================================================

// const allAnnotations = markdownAnnotations.merge(todoAnnotations);

// =======================================================================
// Lookup annotations of ref
// =======================================================================

// Example: get diff / comments for todo item
// Each ref can only have one annotation per type
// const getDiff = Diff.from(allAnnotations);
// const getThread = CommentThread.from(allAnnotations);
// 
// const todoA = ref(todoDoc.todos, { id: "A" });
// const diff = getDiff(todoA); // Diff | undefined
// const thread = getThread(todoA); // Ref | undefined

// =======================================================================
// Filter annotations
// =======================================================================

// allAnnotations.ofType(Diff);              // only diff annotations
// allAnnotations.on(ref);                    // only annotations on ref
// allAnnotations.onElementsOf(ref);          // only annotations on elements of ref if ref is an array or text
// allAnnotations.onPartOf(ref);              // only annotations anywhere on the sub tree that ref points to

// =======================================================================
// Iterate over annotations
// =======================================================================

// iterate over all diff annotations
// for (const [ref, diff] of allAnnotations.ofType(Diff)) {
//   // ...
// }

// iterate over diff annotations on content
// const content = ref(markdownDoc.content);
// for (const [ref, diff] of allAnnotations.ofType(Diff).onElementsOf(content)) {
//   // ...
// }

export { Diff, CommentThread };

