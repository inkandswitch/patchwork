import { onCleanup, createEffect } from "solid-js";

/** CodeMirror */
import { EditorView, type DecorationSet } from "@codemirror/view";
import { EditorState, type Extension, Compartment } from "@codemirror/state";

/** Automerge */
import type { Prop as AutomergeProp } from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import {
  createSyncExtension,
  createReadOnlyExtension,
  createDecorationsExtension,
} from "./extensions";

/** Utility function to lookup a value along the specified pathin an Automerge document */
const lookup = <T = any,>(doc: any, path: AutomergeProp[]): T | undefined => {
  let current = doc;
  for (const key of path) {
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
};

type CodeMirrorProps<T> = {
  handle: DocHandle<T>;
  path: AutomergeProp[];
  decorations: () => DecorationSet;
  extensions?: Extension[];
  onChangeSelection: (from: number, to: number) => void;
  readOnly?: boolean;
};

export function CodeMirror<T>(props: CodeMirrorProps<T>) {
  const parent = (<div class="w-full h-full" />) as HTMLDivElement;
  const initialDoc = () =>
    (lookup(props.handle.doc(), props.path) as string) || "";

  // todo this loses reactivity
  const [syncExtension, createEffectReconfigureSync] = createSyncExtension(
    () => props.handle,
    () => props.path,
    initialDoc
  );

  const [readOnlyExtension, createEffectReconfigureReadOnly] =
    createReadOnlyExtension(() => !!props.readOnly);

  const [decorationsExtension, createEffectReconfigureDecorations] =
    createDecorationsExtension(() => props.decorations?.());

  // Create a compartment for user-provided extensions so they can be reconfigured
  const userExtensionsCompartment = new Compartment();

  const selectionExtension = EditorView.updateListener.of((update) => {
    if (!props.onChangeSelection) return;
    // Bubble all updates to consumers (doc changes, viewport, scroll, etc.)
    if (update.selectionSet) {
      const sel = update.state.selection.main;
      props.onChangeSelection(sel.from, sel.to);
    }
  });

  const extensions = [
    selectionExtension,
    decorationsExtension,
    userExtensionsCompartment.of(props.extensions || []),
    syncExtension,
    readOnlyExtension,
  ].filter(Boolean) as Extension[];

  const state = EditorState.create({
    doc: initialDoc(),
    extensions,
  });

  const view = new EditorView({
    state,
    parent,
  });

  // Create effects to reconfigure the extensions when their props change
  createEffectReconfigureSync(view);
  createEffectReconfigureReadOnly(view);
  createEffectReconfigureDecorations?.(view);

  // Reconfigure user extensions when props.extensions changes
  createEffect(() => {
    view.dispatch({
      effects: userExtensionsCompartment.reconfigure(props.extensions || []),
    });
  });

  onCleanup(() => view.destroy());

  return parent;
}
