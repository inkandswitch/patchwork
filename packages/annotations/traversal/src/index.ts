import { PatchworkViewElement } from "@patchwork/elements";
import { AnnotationSet } from "@patchwork/annotations";

const ANNOTATIONS_SYMBOL = Symbol("annotations");

export const attachAnnotations = (
  element: PatchworkViewElement,
  annotations: AnnotationSet
) => {
  (element as any)[ANNOTATIONS_SYMBOL] = annotations;
};

export const getAnnotations = (
  element: PatchworkViewElement
): AnnotationSet => {
  return (element as any)[ANNOTATIONS_SYMBOL];
};

export const queryAllAnnotations = (
  element: PatchworkViewElement
): AnnotationSet => {};
