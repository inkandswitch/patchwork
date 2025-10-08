import { Reactive } from "../reactive";
import { CONTEXT } from "../core";
import { defineField } from "../core/fields";
import { Ref } from "../core/refs";

const IsSelectedSymbol = Symbol("IsSelected");
type IsSelected = typeof IsSelectedSymbol;
const IsSelected = defineField<IsSelected, boolean>(
  "IsSelected",
  IsSelectedSymbol
);

type SelectionAPIProps = {
  isSelected: (ref: Ref) => boolean;
  setSelection: (refs: Ref[]) => void;
  selectedRefs: Ref[];
};

export const SelectionAPI = (): Reactive<SelectionAPIProps> => {
  const api = new Reactive<SelectionAPIProps>({
    isSelected: () => false,
    setSelection: () => {},
    selectedRefs: [],
  });

  const selectionContext = CONTEXT.subcontext();

  const onChangeContext = () => {
    const selectedRefs = selectionContext.refsWith(IsSelected);

    api.set({
      selectedRefs,

      isSelected(ref) {
        return selectedRefs.some((selectedRef) => selectedRef.doesOverlap(ref));
      },

      setSelection(refs) {
        selectionContext.replace(refs.map((ref) => ref.with(IsSelected(true))));
      },
    });
  };

  CONTEXT.subscribe(onChangeContext);

  api.on("destroy", () => {
    CONTEXT.remove(selectionContext);
  });

  return api;
};
