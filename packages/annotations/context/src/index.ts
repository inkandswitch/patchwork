import { AnnotationSet, AnnotationSource } from "@patchwork/annotations";

declare global {
  interface Window {
    annotationContext: AnnotationContext;
  }
}

/**
 * A constrained interface for the shared annotation context.
 *
 * Unlike a full AnnotationSet, this only exposes `add` and `remove` for sources,
 * not for individual annotations. The intent is that tools should NOT mutate
 * the global context directly by adding annotations one-by-one. Instead, each
 * tool should maintain its own local AnnotationSet, perform mutations there,
 * and then register that entire set as a source on the shared context.
 */
type AnnotationContext = Omit<AnnotationSet, "add" | "remove"> & {
  add(source: AnnotationSource): void;
  remove(source: AnnotationSource): void;
};

export let context: AnnotationContext;

/**
 * We attach the annotation context to `window` so that multiple tools can
 * bundle this library independently while still sharing the same context
 * instance. This avoids needing to externalize the library—each tool can
 * bundle it in, and they'll all converge on the same global context.
 */
if (window.annotationContext) {
  context = window.annotationContext;
} else {
  window.annotationContext = context = new AnnotationSet();
}
