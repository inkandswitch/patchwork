import { Reactive } from "../reactive";
import { CONTEXT } from "../core";
import { defineField } from "../core/fields";
import { Ref } from "../core/refs";

const IsSelectedSymbol = Symbol("IsSelected");
export type IsSelected = typeof IsSelectedSymbol;
export const IsSelected = defineField<IsSelected, boolean>(
  "IsSelected",
  IsSelectedSymbol
);

type SelectionAPI = {
  isSelected: (ref: Ref) => boolean;
  setSelection: (refs: Ref[]) => void;
  selectedRefs: Ref[];
};

export const SelectionAPI = (): Reactive<SelectionAPI> => {
  const getSelectionAPI = (): SelectionAPI => {
    const selectedRefs = CONTEXT.refsWith(IsSelected);

    return {
      selectedRefs,

      isSelected(ref) {
        return selectedRefs.some((selectedRef) => selectedRef.doesOverlap(ref));
      },

      setSelection(refs) {
        console.log(
          "CONTEXT setSelection",
          refs.map((ref) => ref.toId())
        );

        selectionContext.replace(refs.map((ref) => ref.with(IsSelected(true))));
      },
    };
  };

  const selectionContext = CONTEXT.subcontext();

  const api = new Reactive<SelectionAPI>(getSelectionAPI());

  const onChangeContext = () => {
    api.set(getSelectionAPI());
  };

  CONTEXT.subscribe(onChangeContext);

  api.on("destroy", () => {
    CONTEXT.remove(selectionContext);
    CONTEXT.unsubscribe(onChangeContext);
  });

  return api;
};
