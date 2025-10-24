import { CONTEXT } from "../core";
import { defineField } from "../core/fields";
import { Ref } from "../core/refs";
import { contextComputation } from "../core/computation";
import { Reactive } from "../reactive";
import { AutomergeUrl } from "@automerge/automerge-repo";

const IsSelectedSymbol = Symbol("IsSelected");
export type IsSelected = typeof IsSelectedSymbol;
export const IsSelected = defineField<IsSelected, boolean>(
  "IsSelected",
  IsSelectedSymbol
);

export const isSelected = (ref: Ref): Reactive<boolean> =>
  contextComputation(() => CONTEXT.resolve(ref).get(IsSelected) ?? false);

export const $selectedRefs = contextComputation(() =>
  CONTEXT.refsWith(IsSelected).filter((ref) => ref.get(IsSelected) === true)
);

export const $selectedDocUrls = contextComputation((context) => {
  const selectedRefs = context.refsWith(IsSelected);
  const selectedDocUrls = new Set<AutomergeUrl>();

  for (const ref of selectedRefs) {
    selectedDocUrls.add(ref.docUrl);
  }

  return Array.from(selectedDocUrls);
});
