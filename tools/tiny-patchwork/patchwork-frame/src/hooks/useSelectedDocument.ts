import { useDocHandle } from "@automerge/automerge-repo-solid-primitives";
import type { Repo } from "@automerge/automerge-repo";
import type { AutomergeUrl } from "@automerge/vanillajs";
import {
  encodeHeads,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
} from "@automerge/vanillajs";
import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { AnnotationsOnRef } from "@inkandswitch/annotations";
import { annotations as globalAnnotations } from "@inkandswitch/annotations-context";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import type { OpenDocumentEvent } from "@inkandswitch/patchwork-elements";

interface UseSelectedDocumentParams {
  element: HTMLElement | ShadowRoot;
  repo: Repo;
}

/**
 * Manages selected document state, annotations subscription, and document events
 */
export function useSelectedDocument({
  element,
  repo,
}: UseSelectedDocumentParams) {
  const [selectedView, setSelectedView] = createSignal<
    { url: AutomergeUrl; toolId?: string } | undefined
  >(undefined);

  const selectedDocHandle = useDocHandle(() => selectedView()?.url, { repo });

  const selectedDocRef = createMemo(() => {
    const handle = selectedDocHandle();
    return handle ? handle.ref() : undefined;
  });

  const [selectedDocAnnotations, setSelectedDocAnnotations] = createSignal<
    AnnotationsOnRef | undefined
  >(undefined, { equals: false });

  // Subscribe to annotations for selected document
  createEffect(() => {
    const docRef = selectedDocRef();
    if (!docRef) {
      setSelectedDocAnnotations(undefined);
      return;
    }

    const subscribable = globalAnnotations.onRef(docRef);

    const unsubscribe = subscribable.subscribe((value) => {
      setSelectedDocAnnotations(value);
    });

    onCleanup(unsubscribe);
  });

  const viewHeads = createMemo(() =>
    selectedDocAnnotations()?.lookup(ViewHeads)
  );

  const selectedDocUrl = createMemo(() => {
    const view = selectedView();
    if (!view?.url) {
      return undefined;
    }

    const heads = viewHeads();
    if (!heads) {
      return view.url;
    }

    const currentDocumentId = parseAutomergeUrl(view.url).documentId;
    return stringifyAutomergeUrl({
      documentId: currentDocumentId,
      heads: encodeHeads(heads.afterHeads),
    });
  });

  // Create a stable key for the patchwork-view that changes when URL or toolId changes
  const viewKey = createMemo(() => {
    const view = selectedView();
    return view?.url ? `${view.url}-${view.toolId || "default"}` : undefined;
  });

  // Listen to open document events
  onMount(() => {
    const onOpenDocument = (event: OpenDocumentEvent) => {
      event.stopPropagation();
      setSelectedView({ url: event.detail.url, toolId: event.detail.toolId });
    };

    element.addEventListener(
      "patchwork:open-document",
      onOpenDocument as EventListener
    );

    onCleanup(() => {
      element.removeEventListener(
        "patchwork:open-document",
        onOpenDocument as EventListener
      );
    });
  });

  // Add current handle to window for debugging
  createEffect(() => {
    (window as any).currentDocHandle = selectedDocRef()?.docHandle;
  });

  return {
    selectedView,
    setSelectedView,
    selectedDocHandle,
    selectedDocRef,
    selectedDocAnnotations,
    viewHeads,
    selectedDocUrl,
    viewKey,
  };
}
