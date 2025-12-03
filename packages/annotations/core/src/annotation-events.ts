import { AnnotationsCollection } from "./annotation-collection";

/* Event types emitted by AnnotationSets and AnnotationViews */
export type AnnotationEvents = {
  added: (annotations: AnnotationsCollection) => void;
  removed: (annotations: AnnotationsCollection) => void;
};
