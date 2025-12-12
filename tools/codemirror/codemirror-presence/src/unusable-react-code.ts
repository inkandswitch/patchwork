import { useMemo, useRef, useEffect } from "react";
import { EditorView } from "@codemirror/view";
import { DocHandle } from "@automerge/automerge-repo";
import {
  useLocalAwareness,
  useRemoteAwareness,
} from "@automerge/automerge-repo-react-hooks";
import {
  automergePresencePlugin,
  triggerPresenceUpdate,
} from "./automergePresence";

interface UseAutomergePresenceConfig {
  handle: DocHandle<any>;
  userId: string | null | undefined; // Allow null/undefined when user isn't ready
  userMetadata: {
    name: string;
    color: string;
  };
  editorView?: EditorView; // Optional editor view to trigger updates
}

/**
 * React hook that creates a CodeMirror presence plugin with Automerge awareness integration.
 * This hook manages the awareness state and returns a configured CodeMirror plugin.
 *
 * If userId is undefined/null, presence features will be disabled (no awareness participation).
 */
export function useAutomergePresence(config: UseAutomergePresenceConfig) {
  const { handle, userId, userMetadata, editorView } = config;

  // Set up Automerge awareness hooks
  // If userId is falsy, we still call the hooks but won't participate in awareness
  const [, updateLocalState] = useLocalAwareness({
    handle,
    userId: userId || "", // Empty string means don't participate
    initialState: {
      channel: "inline-presence",
    },
  });

  const [peerStates] = useRemoteAwareness({
    handle,
    localUserId: userId || "",
  });

  // Use refs to always have the latest awareness data
  const updateLocalStateRef = useRef(updateLocalState);
  const peerStatesRef = useRef(peerStates);

  // Update refs when awareness data changes
  useEffect(() => {
    updateLocalStateRef.current = updateLocalState;
  }, [updateLocalState]);

  useEffect(() => {
    peerStatesRef.current = peerStates;

    // Trigger a view update when peer states change
    if (editorView) {
      console.log("updating editor view based on peerStates");
      editorView.dispatch({
        effects: triggerPresenceUpdate.of(undefined),
      });
    }
  }, [peerStates, editorView]);

  // Memoize the plugin with stable configuration
  const plugin = useMemo(() => {
    return automergePresencePlugin({
      handle,
      userId: userId || null,
      userMetadata,
      // Pass functions that always use the latest refs
      updateLocalState: (state: any) => {
        updateLocalStateRef.current(state);
      },
      get peerStates() {
        return peerStatesRef.current;
      },
    });
  }, [handle, userId, userMetadata]);

  return plugin;
}
