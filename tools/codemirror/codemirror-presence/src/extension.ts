import {
  EditorView,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view"
import type { Extension } from "@codemirror/state"
import { StateEffect } from "@codemirror/state";
import { DocHandle, getCursor, getCursorPosition } from "@automerge/automerge-repo";

// State effect to trigger presence update
export const triggerPresenceUpdate = StateEffect.define<void>();

// Types for presence data
interface UserPresence {
  channel: string;
  userId: string;
  name: string;
  color: string;
  selection: {
    // these strings are automerge cursors
    from: string;
    to: string;
  } | null;
  timestamp: number;
}

interface PresencePluginConfig {
  handle: DocHandle<any>;
  userId: string | null; // Allow null when user isn't ready
  userMetadata: {
    name: string;
    color: string;
  };
  // Awareness functions passed from React component
  updateLocalState?: (state: any) => void;
  peerStates?: Record<string, any>;
}

// Create cursor decoration
function createCursorDecorations(presence: UserPresence, view: EditorView, handle: DocHandle<any>) {
  if (!presence.selection) return [];

  const decorations: any[] = [];
  const { from, to } = presence.selection;
  const doc = handle.doc();
  const fromPos = getCursorPosition(doc, ["content"], from);
  const toPos = getCursorPosition(doc, ["content"], to);

  // Ensure positions are within document bounds
  const docLength = view.state.doc.length;
  const safeFrom = Math.max(0, Math.min(fromPos, docLength));
  const safeTo = Math.max(0, Math.min(toPos, docLength));

  // Create cursor decoration at the 'to' position
  const cursorWidget = Decoration.widget({
    widget: new CursorWidget(presence, handle),
    side: 0, // Changed from 1 to 0 to appear before the character
    userId: presence.userId,
  });

  decorations.push(cursorWidget.range(safeTo));

  // If there's a selection range, highlight it
  if (safeFrom !== safeTo) {
    const selectionMark = Decoration.mark({
      class: "cm-remote-selection",
      attributes: {
        style: getSelectionStyle(presence),
      },
      userId: presence.userId,
    });
    decorations.push(
      selectionMark.range(
        Math.min(safeFrom, safeTo),
        Math.max(safeFrom, safeTo)
      )
    );
  }

  return decorations;
}

function getSelectionStyle(presence: UserPresence): string {
  // We color-mix the presence color to be more transparent to keep the text in
  // front of a remote selection legible
  return `background-color: color-mix(in srgb, ${presence.color}, transparent 50%);`
}

function isPresenceEqual(curr: UserPresence | undefined, prev: UserPresence | undefined) {
  return curr && prev && curr.userId === prev.userId && curr.color === prev.color && curr.name === prev.name &&
    curr.selection?.from === prev.selection?.from && curr.selection?.to === prev.selection?.to;
}

// Widget for rendering remote cursors
class CursorWidget extends WidgetType {
  private static visibleLabels = new Set<string>(); // Track which cursors are currently showing labels
  private presence: UserPresence;
  private handle: DocHandle<unknown>;

  constructor(presence: UserPresence, handle: DocHandle<unknown>) {
    super();
    this.presence = presence;
    this.handle = handle;
  }

  toDOM(view: EditorView): HTMLElement {
    const cursor = document.createElement("div");
    cursor.className = "cm-remote-cursor";
    cursor.style.cssText = `
      ${getSelectionStyle(this.presence)};

    `;

    // Add user name label with CSS-only smart positioning
    const label = document.createElement("div");
    label.className = "cm-remote-cursor-label";
    // Convert name to initials (e.g., "John Doe" -> "JD")
    const initials = this.presence.name
      .split(/\s+/)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2); // Max 2 characters
    label.textContent =
      initials || this.presence.name.substring(0, 2).toUpperCase();
    label.style.backgroundColor = this.presence.color;
    label.style.color = "white";
    label.style.position = "fixed";

    // Check if this is a new cursor (first time appearing)
    const isNewCursor = !CursorWidget.visibleLabels.has(this.presence.userId);
    if (isNewCursor) {
      CursorWidget.visibleLabels.add(this.presence.userId);
      label.style.opacity = "0"; // Start hidden, will fade in
    } else {
      // Existing cursor moving - keep label hidden unless hovered
      label.style.opacity = "0";
    }

    cursor.appendChild(label);

    // DEFER positioning until after the DOM update completes
    requestAnimationFrame(() => {
      const cursor = this.presence.selection?.to;
      const doc = this.handle.doc();
      if (cursor != null) {
        try {
          const cursorPos = getCursorPosition(doc, ["content"], cursor);
          const coords = view.coordsAtPos(cursorPos);
          if (coords) {
            // Calculate bounds-safe position (initials are much smaller)
            const labelWidth = 40; // Smaller estimate for initials
            const leftPos = Math.max(
              10,
              Math.min(
                window.innerWidth - labelWidth - 10,
                coords.left - labelWidth / 2
              )
            );
            const topPos = Math.max(10, coords.top - 25);

            label.style.left = `${leftPos}px`;
            label.style.top = `${topPos}px`;
          }
        } catch (e) {
          console.warn("Error positioning cursor label:", e);
        }
      }

      // Only show animation for new cursors
      if (isNewCursor) {
        setTimeout(() => {
          label.style.opacity = "1";
          // Fade out after 2 seconds
          setTimeout(() => {
            label.style.opacity = "0";
          }, 2000);
        }, 100);
      }
    });

    // Show on hover
    cursor.addEventListener("mouseenter", () => {
      label.style.opacity = "1";
    });
    cursor.addEventListener("mouseleave", () => {
      label.style.opacity = "0";
    });

    return cursor;
  }

  eq(other: CursorWidget): boolean {
    return (
      this.presence.userId === other.presence.userId &&
      this.presence.selection?.from === other.presence.selection?.from &&
      this.presence.selection?.to === other.presence.selection?.to &&
      this.presence.name === other.presence.name &&
      this.presence.color === other.presence.color
    );
  }
}

// View plugin to handle awareness and rendering
function createPresenceViewPlugin(config: PresencePluginConfig) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      prevPresences = new Map<string, UserPresence>();
      private view: EditorView;

      constructor(view: EditorView) {
        this.view = view;
      }

      update(update: ViewUpdate) {
        // Check if we should update (on any change or when explicitly triggered)
        const shouldUpdate =
          update.docChanged ||
          update.selectionSet ||
          update.transactions.some((tr) =>
            tr.effects.some((e) => e.is(triggerPresenceUpdate))
          );

        if (!shouldUpdate) {
          return;
        }

        // Create decorations from current peer states
        const decorations: any[] = [];
        const activePeerUserIds = config.peerStates && Object.keys(config.peerStates);
        const peerPresences = config.peerStates && Object.fromEntries(Object.entries(config.peerStates).filter(([_, state]) => {
          return state?.channel === "inline-presence";
        }));

        const peerPresenceChanged = peerPresences && Object.entries(peerPresences)?.some(([userId, state]) => {
          const presence = state as UserPresence;
          const prevPresence = this.prevPresences.get(userId);

          return !isPresenceEqual(presence, prevPresence);
        });

        if (peerPresenceChanged) {
          const peerStates = activePeerUserIds!.map((userId: string) => {
            return [userId, peerPresences[userId] ?? this.prevPresences.get(userId)];
          });

          peerStates.forEach(([peerId, state]) => {
            const presence = state as UserPresence;

            try {
              decorations.push(
                ...createCursorDecorations(presence, this.view, config.handle)
              );
            } catch (error) {
              console.warn("Error creating cursor decoration:", error);
            }
          });

          // Sort decorations by position (required by CodeMirror)
          decorations.sort((a, b) => {
            if (a.from !== b.from) {
              return a.from - b.from;
            }
            // If same position, sort by startSide
            return (a.startSide || 0) - (b.startSide || 0);
          });

          this.decorations = Decoration.set(decorations);
        }

        // Remove no-longer-active-peers
        Array.from(this.prevPresences.keys()).forEach((userId) => {
          if (!activePeerUserIds?.includes(userId)) {
            this.prevPresences.delete(userId);
          }
        });

        // Send local selection changes to awareness (only if we have a valid userId)
        if (update.selectionSet && config.updateLocalState && config.userId) {
          try {
            // TODO: is this try/catch the right scope?
            const selection = update.state.selection.main;
            const doc = config.handle.doc();
            const fromCursor = getCursor(doc, ["content"], selection.from, 'after');
            const toCursor = getCursor(doc, ["content"], selection.to, 'before');
            const presenceData: UserPresence = {
              channel: "inline-presence",
              userId: config.userId,
              name: config.userMetadata.name,
              color: config.userMetadata.color,
              selection: {
                from: fromCursor,
                to: toCursor,
              },
              timestamp: Date.now(),
            };

            // Send to Automerge awareness (this is safe as it doesn't trigger CodeMirror updates)

            config.updateLocalState(presenceData);
          } catch (error) {
            console.warn("Error updating local presence state:", error);
          }
        }
      }

      destroy() {
        // Cleanup if needed
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

// Main plugin factory function
export function automergePresencePlugin(
  config: PresencePluginConfig
): Extension {
  return [
    createPresenceViewPlugin(config),
    // Add minimal CSS for remote cursors and selections
    EditorView.theme({
      ".cm-remote-cursor": {
        display: "inline-block",
        position: "absolute",
        width: "2px",
        height: "1.5em",
        pointerEvents: "auto",
        zIndex: "100",
        cursor: "pointer",
      },
      ".cm-remote-cursor-label": {
        // Position is set dynamically in JavaScript
        // Only static styling here
        padding: "3px 6px",
        borderRadius: "4px",
        fontSize: "0.7em",
        fontWeight: "600",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        pointerEvents: "none",
        zIndex: "10000",
        transition: "opacity 0.2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        minWidth: "20px",
        maxWidth: "40px",
        textAlign: "center",
        letterSpacing: "0.5px",
      },
      ".cm-remote-selection": {
        padding: "2px 0px",
      },
    }),
  ];
}
