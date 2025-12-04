import { PatchworkViewElement } from "@patchwork/elements";
import { AnnotationSet, AnnotationSource } from "@patchwork/annotations";

const ANNOTATIONS_SYMBOL = Symbol("annotations");

export const attachAnnotations = (
  element: PatchworkViewElement,
  source: AnnotationSource
) => {
  (element as any)[ANNOTATIONS_SYMBOL] = source;
};

export const getAnnotations = (
  element: PatchworkViewElement
): AnnotationSource | undefined => {
  return (element as any)[ANNOTATIONS_SYMBOL];
};

// Cache for the shared annotation set
let cachedAllAnnotations: AnnotationSet | null = null;
let observer: MutationObserver | null = null;
// Track elements and their annotation sets for removal
const trackedElements = new WeakMap<PatchworkViewElement, AnnotationSource>();

export const getAllAnnotations = (): AnnotationSet => {
  // Return cached instance if already created
  if (cachedAllAnnotations) {
    return cachedAllAnnotations;
  }

  // Create the shared annotation set
  cachedAllAnnotations = new AnnotationSet();

  // Helper to add annotations from an element if it has them
  const addAnnotationsFromElement = (element: PatchworkViewElement) => {
    if (trackedElements.has(element)) return;

    const annotations = getAnnotations(element);
    if (annotations) {
      trackedElements.set(element, annotations);
      cachedAllAnnotations!.add(annotations);
    }
  };

  // Helper to remove annotations from an element
  const removeAnnotationsFromElement = (element: PatchworkViewElement) => {
    const annotations = trackedElements.get(element);
    if (annotations) {
      cachedAllAnnotations!.remove(annotations);
      trackedElements.delete(element);
    }
  };

  // Find and add all existing patchwork-view elements
  const existingElements = document.querySelectorAll("patchwork-view");
  Array.from(existingElements).forEach((element) => {
    addAnnotationsFromElement(element as PatchworkViewElement);
  });

  // Set up MutationObserver to watch for patchwork-view elements being added/removed
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes
      Array.from(mutation.addedNodes).forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if the node itself is a patchwork-view
          if (node.tagName.toLowerCase() === "patchwork-view") {
            addAnnotationsFromElement(node as PatchworkViewElement);
          }
          // Check for patchwork-view elements within the added node
          const nestedElements = node.querySelectorAll("patchwork-view");
          Array.from(nestedElements).forEach((element) => {
            addAnnotationsFromElement(element as PatchworkViewElement);
          });
        }
      });

      // Check removed nodes
      Array.from(mutation.removedNodes).forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if the node itself is a patchwork-view
          if (node.tagName.toLowerCase() === "patchwork-view") {
            removeAnnotationsFromElement(node as PatchworkViewElement);
          }
          // Check for patchwork-view elements within the removed node
          const nestedElements = node.querySelectorAll("patchwork-view");
          Array.from(nestedElements).forEach((element) => {
            removeAnnotationsFromElement(element as PatchworkViewElement);
          });
        }
      });
    }
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return cachedAllAnnotations;
};
