import { type Ref } from "@patchwork/refs";

/**
 * Represents an annotation type with its unique identifier
 */
export type AnnotationType<T> = {
  (value: T): AnnotationValue<T>;
  from(annotationSet: AnnotationSet): (ref: Ref<unknown>) => T | undefined;
};

/**
 * An annotation value with its type information
 */
export type AnnotationValue<T> = {
  type: AnnotationType<T>;
  value: T;
};

/**
 * Defines a new annotation type
 */
export function defineAnnotationType<T>(): AnnotationType<T> {
  const annotationType = ((value: T): AnnotationValue<T> => {
    return {
      type: annotationType,
      value,
    };
  }) as AnnotationType<T>;

  annotationType.from = (annotationSet: AnnotationSet) => {
    return (ref: Ref<unknown>): T | undefined => {
      return annotationSet.get(annotationType, ref);
    };
  };

  return annotationType;
}

/**
 * A set of annotations that can be queried and filtered
 *
 * Internal storage:
 * - Set of ref IDs (using ref.toString())
 * - Map: AnnotationType -> Map<refId, value>
 *
 * Each ref can only have one annotation per type.
 */
export class AnnotationSet {
  // Set of all ref IDs
  private refIds: Set<string> = new Set();

  // Map: AnnotationType -> Map<refId, value>
  private annotations: Map<AnnotationType<any>, Map<string, unknown>> =
    new Map();

  // Map: refId -> Ref instance (for reconstruction)
  private refs: Map<string, Ref<any>> = new Map();

  /**
   * Add an annotation to a ref.
   * If an annotation of the same type already exists for this ref, it will be replaced.
   */
  add<T>(ref: Ref<any>, annotation: AnnotationValue<T>): void {
    const refId = ref.toString();
    const type = annotation.type;

    // Track the ref ID
    this.refIds.add(refId);
    this.refs.set(refId, ref);

    // Get or create the map for this annotation type
    let typeMap = this.annotations.get(type);
    if (!typeMap) {
      typeMap = new Map();
      this.annotations.set(type, typeMap);
    }

    // Set the annotation value (replaces if exists)
    typeMap.set(refId, annotation.value);
  }

  /**
   * Get an annotation for a ref and type
   */
  get<T>(type: AnnotationType<T>, ref: Ref<unknown>): T | undefined {
    const refId = ref.toString();

    const typeMap = this.annotations.get(type);
    if (!typeMap) return undefined;

    return typeMap.get(refId) as T | undefined;
  }

  /**
   * Merge another annotation set into a new set.
   * If both sets have an annotation of the same type for the same ref,
   * the annotation from 'other' takes precedence.
   */
  merge(other: AnnotationSet): AnnotationSet {
    const merged = new AnnotationSet();

    // Copy all annotations from this set
    for (const [type, typeMap] of this.annotations) {
      const newTypeMap = new Map(typeMap);
      merged.annotations.set(type, newTypeMap);
    }

    // Copy refs
    merged.refIds = new Set(this.refIds);
    merged.refs = new Map(this.refs);

    // Merge annotations from other set (overwriting conflicts)
    for (const [type, typeMap] of other.annotations) {
      let mergedTypeMap = merged.annotations.get(type);
      if (!mergedTypeMap) {
        mergedTypeMap = new Map();
        merged.annotations.set(type, mergedTypeMap);
      }

      for (const [refId, value] of typeMap) {
        mergedTypeMap.set(refId, value);
      }
    }

    // Merge refs
    for (const refId of other.refIds) {
      merged.refIds.add(refId);
    }
    for (const [refId, ref] of other.refs) {
      merged.refs.set(refId, ref);
    }

    return merged;
  }

  /**
   * Filter annotations by type
   */
  ofType<T>(type: AnnotationType<T>): AnnotationSetView<T> {
    const typeMap = this.annotations.get(type);

    if (!typeMap) {
      return new AnnotationSetView([], this.refs);
    }

    const entries: Array<[string, T]> = [];
    for (const [refId, value] of typeMap) {
      entries.push([refId, value as T]);
    }

    return new AnnotationSetView(entries, this.refs);
  }

  /**
   * Filter annotations on a specific ref (exact match)
   */
  on(ref: Ref<any>): AnnotationSetView<unknown> {
    const refId = ref.toString();
    const entries: Array<[string, unknown]> = [];

    // Collect all annotations for this ref across all types
    for (const typeMap of this.annotations.values()) {
      const value = typeMap.get(refId);
      if (value !== undefined) {
        entries.push([refId, value]);
      }
    }

    return new AnnotationSetView(entries, this.refs);
  }

  /**
   * Filter annotations on elements of a ref (if ref is an array or text)
   */
  onElementsOf(ref: Ref<string | Array<unknown>>): AnnotationSetView<unknown> {
    const entries: Array<[string, unknown]> = [];

    // Check each ref to see if it's a direct child
    for (const [refId, annotatedRef] of this.refs) {
      if (this.isDirectChild(annotatedRef, ref)) {
        // Collect all annotations for this ref
        for (const typeMap of this.annotations.values()) {
          const value = typeMap.get(refId);
          if (value !== undefined) {
            entries.push([refId, value]);
          }
        }
      }
    }

    return new AnnotationSetView(entries, this.refs);
  }

  /**
   * Filter annotations anywhere on the subtree that ref points to
   */
  onPartOf(ref: Ref<unknown>): AnnotationSetView<unknown> {
    const entries: Array<[string, unknown]> = [];

    // Check each ref to see if it's contained by or equal to ref
    for (const [refId, annotatedRef] of this.refs) {
      if (ref.contains(annotatedRef) || ref.equals(annotatedRef)) {
        // Collect all annotations for this ref
        for (const typeMap of this.annotations.values()) {
          const value = typeMap.get(refId);
          if (value !== undefined) {
            entries.push([refId, value]);
          }
        }
      }
    }

    return new AnnotationSetView(entries, this.refs);
  }

  /**
   * Make the annotation set iterable
   */
  *[Symbol.iterator](): Iterator<[Ref<unknown>, unknown]> {
    for (const [type, typeMap] of this.annotations) {
      for (const [refId, value] of typeMap) {
        const ref = this.refs.get(refId);
        if (ref) {
          yield [ref, value];
        }
      }
    }
  }

  /**
   * Check if annotatedRef is a direct child of parentRef
   */
  private isDirectChild(annotatedRef: Ref<any>, parentRef: Ref<any>): boolean {
    // Check if entry.ref is a direct child of ref
    if (annotatedRef.docHandle.documentId !== parentRef.docHandle.documentId) {
      return false;
    }

    // Check if the heads match
    const entryHeads = annotatedRef.heads?.join(",");
    const refHeads = parentRef.heads?.join(",");
    if (entryHeads !== refHeads) {
      return false;
    }

    // Check if annotatedRef's path is exactly one segment longer than parentRef's path
    if (annotatedRef.path.length !== parentRef.path.length + 1) {
      return false;
    }

    // Check if all of parentRef's path segments match the beginning of annotatedRef's path
    for (let i = 0; i < parentRef.path.length; i++) {
      if (!this.segmentsEqual(parentRef.path[i], annotatedRef.path[i])) {
        return false;
      }
    }

    return true;
  }

  private segmentsEqual(a: any, b: any): boolean {
    // This is a simplified comparison - in production you'd want to use
    // the same logic as Ref#segmentsEqual
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

/**
 * A view of an annotation set with filters applied
 * This is returned by filter methods and supports chaining
 */
class AnnotationSetView<T> {
  constructor(
    private entries: Array<[string, T]>,
    private refs: Map<string, Ref<any>>
  ) {}

  /**
   * Further filter by type
   */
  ofType<U>(type: AnnotationType<U>): AnnotationSetView<U> {
    // Note: This is a no-op since we're already filtered by type,
    // but we include it for API consistency
    return this as unknown as AnnotationSetView<U>;
  }

  /**
   * Further filter on a specific ref
   */
  on(ref: Ref<any>): AnnotationSetView<T> {
    const refId = ref.toString();
    const filtered = this.entries.filter(([id]) => id === refId);
    return new AnnotationSetView(filtered, this.refs);
  }

  /**
   * Further filter on elements of a ref
   */
  onElementsOf(ref: Ref<any>): AnnotationSetView<T> {
    const filtered = this.entries.filter(([refId]) => {
      const annotatedRef = this.refs.get(refId);
      if (!annotatedRef) return false;
      return this.isDirectChild(annotatedRef, ref);
    });
    return new AnnotationSetView(filtered, this.refs);
  }

  /**
   * Further filter on parts of a ref
   */
  onPartOf(ref: Ref<any>): AnnotationSetView<T> {
    const filtered = this.entries.filter(([refId]) => {
      const annotatedRef = this.refs.get(refId);
      if (!annotatedRef) return false;
      return ref.contains(annotatedRef) || ref.equals(annotatedRef);
    });
    return new AnnotationSetView(filtered, this.refs);
  }

  /**
   * Convert to array of [ref, value] pairs
   */
  toArray(): Array<[Ref<any>, T]> {
    return this.entries.map(([refId, value]) => {
      const ref = this.refs.get(refId);
      if (!ref) {
        throw new Error(`Ref not found for id: ${refId}`);
      }
      return [ref, value];
    });
  }

  /**
   * Make the view iterable
   */
  *[Symbol.iterator](): Iterator<[Ref<any>, T]> {
    for (const [refId, value] of this.entries) {
      const ref = this.refs.get(refId);
      if (ref) {
        yield [ref, value];
      }
    }
  }

  private isDirectChild(annotatedRef: Ref<any>, parentRef: Ref<any>): boolean {
    if (annotatedRef.docHandle.documentId !== parentRef.docHandle.documentId) {
      return false;
    }

    const entryHeads = annotatedRef.heads?.join(",");
    const refHeads = parentRef.heads?.join(",");
    if (entryHeads !== refHeads) {
      return false;
    }

    if (annotatedRef.path.length !== parentRef.path.length + 1) {
      return false;
    }

    for (let i = 0; i < parentRef.path.length; i++) {
      if (!this.segmentsEqual(parentRef.path[i], annotatedRef.path[i])) {
        return false;
      }
    }

    return true;
  }

  private segmentsEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}
