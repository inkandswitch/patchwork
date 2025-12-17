import {
  EditorView,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import {
  DocHandle,
  Repo,
  getCursor,
  getCursorPosition,
  Presence,
  type PresenceEventUpdate,
  type AutomergeUrl,
} from "@automerge/automerge-repo";

// State effect to trigger presence update from external sources
export const triggerPresenceUpdate = StateEffect.define<void>();

/**
 * Configuration for the presence plugin.
 */
export interface PresencePluginConfig {
  /** The Automerge document handle */
  handle: DocHandle<unknown>;
  /** The path within the document to the text content (defaults to ["content"]) */
  path?: string[];
}

// Types for presence data
interface CursorPresence {
  selection: {
    // these strings are automerge cursors
    from: string;
    to: string;
  } | null;
  // Include metadata so peers can discover our name/color
  name?: string;
  color?: string;
}

interface PresenceState {
  "inline-presence": CursorPresence;
}

// Contact document types (matching the account-picker types)
interface AnonymousContactDoc {
  type: "anonymous";
  color?: string;
}

interface RegisteredContactDoc {
  type: "registered";
  name: string;
  avatarUrl?: AutomergeUrl;
  color?: string;
}

type ContactDoc = AnonymousContactDoc | RegisteredContactDoc;

// Account document type (matching tiny-patchwork layout)
interface AccountDoc {
  contactUrl?: AutomergeUrl;
}


// TODO: stop using these when there's a proper API (cc: grjte)
// Declare the window globals that tiny-patchwork provides
declare global {
  interface Window {
    repo?: Repo;
    accountDocHandle?: DocHandle<AccountDoc>;
  }
}

// Store for peer metadata (name, color) - discovered from presence messages
const peerMetadata = new Map<string, { name: string; color: string }>();

function generateColorFromId(id: string): string {
  const hash = id.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 70%, 50%)`;
}

function getSelectionStyle(color: string): string {
  return `background-color: color-mix(in srgb, ${color}, transparent 50%);`;
}

/**
 * Get the repo from the global window object.
 */
function getRepo(): Repo | undefined {
  return window.repo;
}

/**
 * Get user info from the global account document.
 * Falls back to storage ID and generated color if not available.
 */
async function getUserInfo(): Promise<{ userId: string; name: string; color: string } | null> {
  const repo = getRepo();
  if (!repo) {
    console.warn("Presence plugin: No repo available on window.repo");
    return null;
  }

  if (!window.accountDocHandle) {
    throw new Error("Couldn't find the account doc and I don't feel like handling this case.")
  }
  const accountDocHandle = window.accountDocHandle;
  const accountDoc = accountDocHandle.doc();

  // TODO: why would there be no contactUrl!?
  let userId = accountDoc.contactUrl || "what"
  let name = "Anonymoose"
  let color = generateColorFromId(userId)

  if (accountDoc.contactUrl) {
    const contactHandle = await repo.find<ContactDoc>(accountDoc.contactUrl);
    const contactDoc = contactHandle.doc();

    if (contactDoc) {
      if (contactDoc.type === "registered" && contactDoc.name) {
        name = contactDoc.name;
      }
      if (contactDoc.color) {
        color = contactDoc.color;
      }
    }
  }

  return { userId, name, color };
}

// Create cursor decoration
function createCursorDecorations(
  peerId: string,
  peerState: CursorPresence | undefined,
  view: EditorView,
  handle: DocHandle<any>,
  path: string[]
) {
  if (!peerState?.selection) return [];

  const decorations: any[] = [];
  const { from, to } = peerState.selection;
  const doc = handle.doc();

  try {
    const fromPos = getCursorPosition(doc, path, from);
    const toPos = getCursorPosition(doc, path, to);

    // Ensure positions are within document bounds
    const docLength = view.state.doc.length;
    const safeFrom = Math.max(0, Math.min(fromPos, docLength));
    const safeTo = Math.max(0, Math.min(toPos, docLength));

    // Get metadata from our store (populated from presence messages)
    const metadata = peerMetadata.get(peerId) ?? {
      name: peerState.name ?? peerId.slice(0, 8),
      color: peerState.color ?? generateColorFromId(peerId),
    };

    // Create cursor decoration at the 'to' position
    const cursorWidget = Decoration.widget({
      widget: new CursorWidget(
        peerId,
        metadata.name,
        metadata.color,
        safeTo,
        view
      ),
      side: 0,
    });

    decorations.push(cursorWidget.range(safeTo));

    // If there's a selection range, highlight it
    if (safeFrom !== safeTo) {
      const selectionMark = Decoration.mark({
        class: "cm-remote-selection",
        attributes: {
          style: getSelectionStyle(metadata.color),
        },
      });
      decorations.push(
        selectionMark.range(
          Math.min(safeFrom, safeTo),
          Math.max(safeFrom, safeTo)
        )
      );
    }
  } catch (error) {
    console.warn("Error creating cursor decoration:", error);
  }

  return decorations;
}

// Widget for rendering remote cursors
class CursorWidget extends WidgetType {
  private static visibleLabels = new Set<string>();

  private peerId: string;
  private name: string;
  private color: string;
  private cursorPos: number;
  private editorView: EditorView;

  constructor(
    peerId: string,
    name: string,
    color: string,
    cursorPos: number,
    editorView: EditorView
  ) {
    super();
    this.peerId = peerId;
    this.name = name;
    this.color = color;
    this.cursorPos = cursorPos;
    this.editorView = editorView;
  }

  toDOM(): HTMLElement {
    const cursor = document.createElement("div");
    cursor.className = "cm-remote-cursor";
    cursor.style.cssText = `background-color: ${this.color};`;

    // Add user name label with CSS-only smart positioning
    const label = document.createElement("div");
    label.className = "cm-remote-cursor-label";

    // Convert name to initials
    const initials = this.name
      .split(/\s+/)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("")
      .substring(0, 2);
    label.textContent = initials || this.name.substring(0, 2).toUpperCase();
    label.style.backgroundColor = this.color;
    label.style.color = "white";
    label.style.position = "fixed";

    // Check if this is a new cursor
    const isNewCursor = !CursorWidget.visibleLabels.has(this.peerId);
    if (isNewCursor) {
      CursorWidget.visibleLabels.add(this.peerId);
      label.style.opacity = "0";
    } else {
      label.style.opacity = "0";
    }

    cursor.appendChild(label);

    // Defer positioning until after the DOM update completes
    requestAnimationFrame(() => {
      try {
        const coords = this.editorView.coordsAtPos(this.cursorPos);
        if (coords) {
          const labelWidth = 40;
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

      if (isNewCursor) {
        setTimeout(() => {
          label.style.opacity = "1";
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
      this.peerId === other.peerId &&
      this.cursorPos === other.cursorPos &&
      this.name === other.name &&
      this.color === other.color
    );
  }
}

// View plugin to handle presence
function createPresenceViewPlugin(config: PresencePluginConfig) {
  const { handle, path = ["content"] } = config;

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none;
      private view: EditorView;
      private presence: Presence<PresenceState> | null = null;
      private userInfo: { userId: string; name: string; color: string } | null = null;
      private initialized = false;

      constructor(view: EditorView) {
        this.view = view;
        this.initPresence();
      }

      private async initPresence() {
        if (this.initialized) return;
        this.initialized = true;

        // Get user info asynchronously
        this.userInfo = await getUserInfo();

        if (!this.userInfo) {
          console.warn("Presence plugin: Could not get user info, presence disabled");
          return;
        }

        // Store our own metadata for others to see
        peerMetadata.set(this.userInfo.userId, {
          name: this.userInfo.name,
          color: this.userInfo.color,
        });

        this.presence = new Presence({
          handle: handle,
          userId: this.userInfo.userId,
        });

        // Listen for presence updates from peers
        this.presence.on("update", (event: PresenceEventUpdate) => {
          if (event.channel === "inline-presence") {
            // Store peer metadata if provided
            const val = event.value as CursorPresence;
            if (val?.name && val?.color) {
              peerMetadata.set(event.peerId, {
                name: val.name,
                color: val.color,
              });
            }
            // Trigger a view update to refresh decorations
            this.view.dispatch({
              effects: triggerPresenceUpdate.of(undefined),
            });
          }
        });

        this.presence.on("snapshot", () => {
          this.view.dispatch({
            effects: triggerPresenceUpdate.of(undefined),
          });
        });

        this.presence.on("goodbye", () => {
          this.view.dispatch({
            effects: triggerPresenceUpdate.of(undefined),
          });
        });

        // Start presence with initial state
        this.presence.start({
          initialState: {
            "inline-presence": {
              selection: null,
              name: this.userInfo.name,
              color: this.userInfo.color,
            },
          },
        });
      }

      update(update: ViewUpdate) {
        if (!this.presence || !this.userInfo) {
          return;
        }

        // Check if we should update decorations
        const shouldUpdate =
          update.docChanged ||
          update.selectionSet ||
          update.transactions.some((tr) =>
            tr.effects.some((e) => e.is(triggerPresenceUpdate))
          );

        if (shouldUpdate) {
          // Rebuild decorations from current peer states
          const decorations: any[] = [];
          const peerStates = this.presence.getPeerStates();
          const peers = peerStates.getPeers();

          for (const peerId of peers) {
            const peerState = peerStates.getPeerState<"inline-presence">(
              peerId,
              "inline-presence"
            );

            try {
              decorations.push(
                ...createCursorDecorations(
                  peerId,
                  peerState,
                  this.view,
                  handle,
                  path
                )
              );
            } catch (error) {
              console.warn("Error creating cursor decoration:", error);
            }
          }

          // Sort decorations by position
          decorations.sort((a, b) => {
            if (a.from !== b.from) {
              return a.from - b.from;
            }
            return (a.startSide || 0) - (b.startSide || 0);
          });

          this.decorations = Decoration.set(decorations);
        }

        // Send local selection changes
        if (update.selectionSet && this.presence.running && this.userInfo) {
          try {
            const selection = update.state.selection.main;
            const doc = handle.doc();
            const fromCursor = getCursor(doc, path, selection.from, "after");
            const toCursor = getCursor(doc, path, selection.to, "before");

            this.presence.broadcast("inline-presence", {
              selection: {
                from: fromCursor,
                to: toCursor,
              },
              name: this.userInfo.name,
              color: this.userInfo.color,
            });
          } catch (error) {
            console.warn("Error updating local presence state:", error);
          }
        }
      }

      destroy() {
        if (this.presence) {
          this.presence.stop();
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

// CSS theme for remote cursors
const presenceTheme = EditorView.theme({
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
});

/**
 * Creates the automerge presence plugin extension.
 *
 * The plugin automatically retrieves user info from:
 * - window.repo for the repository
 * - window.accountDocHandle for user identity (falls back to generated values)
 *
 * @param config - Configuration including the document handle and optional path
 * @example
 * ```ts
 * const extensions = [automergePresencePlugin({ handle, path: ["content"] })]
 * ```
 */
export function automergePresencePlugin(config: PresencePluginConfig): Extension {
  return [createPresenceViewPlugin(config), presenceTheme];
}
