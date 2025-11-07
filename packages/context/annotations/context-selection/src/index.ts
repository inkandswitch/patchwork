import {
  CONTEXT,
  contextComputation,
  defineAnnotation,
  Reactive,
  Ref,
} from "@patchwork/context";
import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import { HasPatchworkMetadata } from "@patchwork/filesystem";

export const IsSelected = defineAnnotation<boolean>("patchwork/isSelected");

export const isSelected = (ref: Ref): Reactive<boolean> =>
  contextComputation(() => CONTEXT.resolve(ref).get(IsSelected) ?? false);

export const $selectedRefs = contextComputation(() =>
  CONTEXT.refsWith(IsSelected).filter((ref) => ref.get(IsSelected) === true)
);

export const $selectedDocRefs = contextComputation((context) => {
  return context.refsWith(IsSelected) as Ref<HasPatchworkMetadata>[];
});

export const $selectedDocUrls = contextComputation((context) => {
  const selectedRefs = context.refsWith(IsSelected);
  const selectedDocUrls = new Set<AutomergeUrl>();

  for (const ref of selectedRefs) {
    selectedDocUrls.add(ref.docUrl);
  }

  return Array.from(selectedDocUrls);
});

export const $selectedDocHandles = contextComputation((context) => {
  const selectedRefs = context.refsWith(IsSelected);
  const selectedDocs = new Set<DocHandle<HasPatchworkMetadata>>();

  for (const ref of selectedRefs) {
    selectedDocs.add(ref.docHandle as DocHandle<HasPatchworkMetadata>);
  }

  return Array.from(selectedDocs);
});
