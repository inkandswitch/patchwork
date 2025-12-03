import { Ref } from "@patchwork/refs";
import { AnnotationValue } from "./annotation-type";

export interface AnnotationCollection<
  RefType = unknown,
  AnnotationValueType = unknown,
> {
  [Symbol.iterator](): Iterator<
    [Ref<any>, AnnotationValue<AnnotationValueType>]
  >;
}
