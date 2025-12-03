import { AnnotationCollection } from "./annotation-collection";

/* Event types emitted by AnnotationSets and AnnotationViews */
export type AnnotationEvents = {
  added: (annotations: AnnotationCollection) => void;
  removed: (annotations: AnnotationCollection) => void;
};
