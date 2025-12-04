import { AnnotationChange, AnnotationFilter } from "./types";

export const filterAnnotationChange = <T>(
  change: AnnotationChange,
  filter: AnnotationFilter
): AnnotationChange => ({
  added: change.added.filter(([ref, annotation]) => filter(ref, annotation)),
  removed: change.removed.filter(([ref, annotation]) =>
    filter(ref, annotation)
  ),
});

export const isChangeEmpty = (change: AnnotationChange): boolean => {
  return change.added.length === 0 && change.removed.length === 0;
};
