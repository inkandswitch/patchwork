import { createEffect } from "solid-js";

/** CodeMirror */
import { EditorView } from "@codemirror/view";
import { Compartment, EditorState } from "@codemirror/state";

/**
 * Create a CodeMirror extension for controlling read-only mode using a CodeMirror Compartment.
 * @param readOnly Whether the editor should be read-only.
 * @returns A tuple containing the extension and a function to create an effect for reconfiguring
 the extension when the readOnly prop changes.
 */
export function createReadOnlyExtension(readOnly: () => boolean) {
  const readOnlyCompartment = new Compartment();

  // Function to get the desired state of the read-only extensions based on the readOnly parameter
  const readOnlyExtensions = () =>
    readOnly()
      ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
      : [];

  // Function to create an effect that reconfigures the read-only compartment
  const createReconfigureEffect = (view: EditorView) =>
    createEffect(() => {
      view.dispatch({
        effects: readOnlyCompartment.reconfigure(readOnlyExtensions()),
      });
    });

  return [
    readOnlyCompartment.of(readOnlyExtensions()),
    createReconfigureEffect,
  ] as const;
}
