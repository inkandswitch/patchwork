import { Reactive } from "../reactive";
import { CONTEXT } from "../core";
import { defineField } from "../core/fields";
import { Ref } from "../core/refs";
import { contextComputation } from "../core/computation";
import { memoize } from "../utils/memoize";

const IsSelectedSymbol = Symbol("IsSelected");
export type IsSelected = typeof IsSelectedSymbol;
export const IsSelected = defineField<IsSelected, boolean>(
  "IsSelected",
  IsSelectedSymbol
);

export const isSelected = memoize(
  (ref?: Ref) =>
    contextComputation(() => {
      const result = ref
        ? CONTEXT.resolve(ref).get(IsSelected) === true
        : false;
      console.log("!! rerun isSelected", ref?.toId(), result);

      return result;
    }),
  (ref?: Ref) => ref?.toId()
);
