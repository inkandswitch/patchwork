import { type Ref } from "@patchwork/refs";
import type { AnnotationType } from "./annotation-type";

/**
 * A view of an annotation set with filters applied
 * This is returned by filter methods and supports chaining
 */
export class AnnotationSetView<T> {
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
