import { createEffect, createSignal, on, onCleanup, onMount, untrack } from "solid-js";

/** CodeMirror */
import { EditorView, type DecorationSet } from "@codemirror/view";
import { Compartment, EditorState, type Extension } from "@codemirror/state";

/** Automerge */
import type { Prop as AutomergeProp } from "@automerge/automerge";
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import type { DocHandle } from "@automerge/automerge-repo";

/** Utility function to lookup a value along the specified pathin an Automerge document */
const lookup = <T = any>(doc: any, path: AutomergeProp[]): T | undefined => {
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
  decorations: DecorationSet;
  extensions?: Extension[];
  onChangeSelection: (from: number, to: number) => void;
  readOnly?: boolean
};


export function CodeMirror<T>(props: CodeMirrorProps<T>) {
  const parent = (<div class="w-full h-full" />) as HTMLDivElement;
  const initialDoc = () => lookup(props.handle.doc(), props.path) || "";
  const readOnly = new Compartment()
  const sync = new Compartment()

  const readOnlyExtensions = () => props.readOnly ? [
  EditorState.readOnly.of(true), EditorView.editable.of(false)
  ] : []
  

  const syncExtension = () => automergeSyncPlugin({
      handle: props.handle as any, // typescript is confused by different version of doc handle
      path: props.path,
    })


  const extensions = [
    // handle selection changes
    EditorView.updateListener.of((update) => {
      // Bubble all updates to consumers (doc changes, viewport, scroll, etc.)
      if (update.selectionSet) {
        const sel = update.state.selection.main;
        props.onChangeSelection(sel.from, sel.to);
      }
    }),
    // add additional extensions from props
    ...(props.extensions || []),
        // add the automerge sync plugin
    sync.of(syncExtension()),
    readOnly.of(readOnlyExtensions())
  ] as Extension[];

  const state = EditorState.create({
    doc: initialDoc(),
    extensions,
  });

  const view = new EditorView({
    state,
    parent,
  });

  createEffect(() => {
    view.dispatch({
      effects: readOnly.reconfigure(readOnlyExtensions())
    })
  })


	createEffect(() => {
		view.dispatch({
			effects: sync.reconfigure(syncExtension()),
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: initialDoc(),
			},
		})
  })
  

  onCleanup(() => {
    view.destroy();
  });

  return parent;
}
