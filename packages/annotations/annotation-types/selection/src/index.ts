import { defineAnnotationType } from "@patchwork/annotations";

/**
 * Annotation type for marking refs as selected.
 */
export const IsSelected = defineAnnotationType<boolean>("patchwork/isSelected");
