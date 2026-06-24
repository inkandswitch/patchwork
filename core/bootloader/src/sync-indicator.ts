/**
 * Sync indicator (tab side).
 *
 * Only the automerge SharedWorker is directly connected to the sync server, so
 * it broadcasts the heads each Subduction peer (e.g. the server) holds, per
 * document, on {@link SYNCSTATE_CHANNEL}, plus whether the server link is up.
 *
 * This renders a small fixed-position panel listing every document this tab has
 * open (minus high-churn ephemeral presence/cursor/focus docs), with each doc's
 * local heads and each Subduction peer's heads (short hashes). Listing all open
 * docs (rather than guessing the "current" one from the root view, which is the
 * frame/account doc, not what an editor tool is mutating) means the row for
 * whatever you're editing updates live as you type.
 *
 * Top-line status:
 *  - `offline`    — the worker had a server link and lost it.
 *  - `connecting` — no server link yet (or nothing to compare yet).
 *  - `syncing`    — some comparable doc is missing commits the server holds.
 *  - `synced`     — for every comparable doc we already hold every commit the
 *                   server advertises.
 */
import {
  type DocHandle,
  type Repo,
  type UrlHeads,
} from "@automerge/vanillajs/slim";
import debug from "debug";
import {
  SYNCSTATE_CHANNEL,
  type SyncStateBroadcast,
  type SyncStateRequestMessage,
} from "./types.js";

const log = debug("patchwork:bootloader:sync-indicator");

type SyncStatus = "offline" | "connecting" | "syncing" | "synced";
type PeerHeads = { heads: string[]; timestamp: number };

export interface SyncIndicatorHandle {
  stop: () => void;
}

export function startSyncIndicator({
  repo,
  tabPeerId,
}: {
  repo: Repo;
  tabPeerId?: string;
}): SyncIndicatorHandle {
  const channel = new BroadcastChannel(SYNCSTATE_CHANNEL);

  // documentId -> storageId (a Subduction peer's verifying key) -> its heads
  const peerHeadsByDoc = new Map<string, Map<string, PeerHeads>>();
  // documentId -> this tab's local handle (for live local heads)
  const handles = new Map<string, { handle: DocHandle<unknown>; onHeads: () => void }>();
  let connected = false;
  let everConnected = false;
  // The shared worker's own Subduction peer id, so we can label "us" rows.
  let workerPeerId: string | undefined;
  // The sync server's peer id(s). "Synced" is judged against these specifically
  // (the worker hop and foreign/stale peers are shown but don't drive it).
  const serverPeerIds = new Set<string>();
  // The panel starts collapsed (just the dot + status line); clicking the
  // status line toggles the per-document detail open/closed.
  let collapsed = true;

  // Doc `@patchwork.type`s treated as ephemeral — high-churn presence/cursor/
  // focus docs whose heads change on every keystroke. Hidden from the indicator
  // entirely (they'd otherwise wedge the headline on "syncing" and add noise).
  // Tunable at runtime via localStorage (comma-separated).
  const ephemeralTypes = readEphemeralTypes();

  injectStyles();
  const ui = createPanel();
  document.body.appendChild(ui.root);
  ui.root.dataset.collapsed = String(collapsed);
  ui.status.addEventListener("click", () => {
    collapsed = !collapsed;
    ui.root.dataset.collapsed = String(collapsed);
    render();
  });

  function localHeadsFor(documentId: string): string[] | undefined {
    const h = handles.get(documentId)?.handle;
    return h ? [...h.heads()] : undefined;
  }

  function docType(documentId: string): string | undefined {
    const doc = handles.get(documentId)?.handle.doc() as
      | { "@patchwork"?: { type?: string } }
      | undefined;
    return doc?.["@patchwork"]?.type;
  }

  /** True for ephemeral presence/churn docs we hide from the indicator. */
  function isEphemeralDoc(documentId: string): boolean {
    const type = docType(documentId);
    return type !== undefined && ephemeralTypes.has(type);
  }

  function trackHandle(handle: DocHandle<unknown>): void {
    const id = handle.documentId;
    if (handles.has(id)) return;
    const onHeads = () => render();
    handle.on("heads-changed", onHeads);
    handles.set(id, { handle, onHeads });
    render();
  }

  /** Pick up any handles the tab has opened since we last looked. */
  function scanHandles(): void {
    for (const handle of Object.values(repo.handles)) {
      if (!handles.has(handle.documentId)) trackHandle(handle as DocHandle<unknown>);
    }
  }

  function docSynced(documentId: string): boolean | undefined {
    const handle = handles.get(documentId)?.handle;
    const peers = peerHeadsByDoc.get(documentId);
    if (!handle || !peers) return undefined;
    // Judge "synced" against the sync server only — not the worker hop or
    // foreign/stale peers (those are still shown, just not counted here).
    const serverHeads = [...peers]
      .filter(([sid]) => serverPeerIds.has(sid))
      .flatMap(([, p]) => p.heads);
    if (serverHeads.length === 0) return undefined; // no server signal yet
    // The server advertises subduction *sedimentree* heads (loose-commit +
    // fragment-boundary commit ids), NOT the Automerge frontier — so set
    // equality with our heads is the wrong test (it ~never holds once a doc has
    // fragments). Instead ask whether we already hold every commit the server
    // advertises (`DocHandle.containsHeads`, run on the handle's own doc).
    try {
      return handle.containsHeads([...new Set(serverHeads)] as UrlHeads);
    } catch {
      return undefined; // doc not ready, or an undecodable head
    }
  }

  /**
   * Trim a peer's advertised heads for *display*: drop heads we already hold in
   * our history (most of the server's sedimentree tips are interior commits we
   * have — see `docSynced`), keeping our current frontier tip(s) — "the latest
   * one" — plus any head we genuinely lack. Display only; the synced verdict
   * still considers the full set.
   */
  function trimSeenHeads(documentId: string, heads: string[]): string[] {
    const handle = handles.get(documentId)?.handle;
    if (!handle) return heads;
    let frontier: Set<string>;
    try {
      frontier = new Set<string>([...handle.heads()]);
    } catch {
      return heads;
    }
    return heads.filter((h) => {
      if (frontier.has(h)) return true; // our latest shared tip — keep
      try {
        return !handle.containsHeads([h] as UrlHeads); // keep only what we lack
      } catch {
        return true; // can't decide → keep
      }
    });
  }

  /**
   * One pass over the comparable docs: the headline status plus how many are
   * synced vs. still syncing, so the panel can show "synced 45 docs, syncing 2
   * docs…" rather than a bare total. Docs with no server signal yet (or no
   * local heads) are not comparable and counted in neither bucket.
   */
  function summarize(): { status: SyncStatus; synced: number; syncing: number } {
    if (!connected) {
      const status = everConnected ? "offline" : "connecting";
      return { status, synced: 0, syncing: 0 };
    }
    let synced = 0;
    let syncing = 0;
    for (const documentId of allDocIds()) {
      const isSynced = docSynced(documentId);
      if (isSynced === undefined) continue;
      if (isSynced) synced++;
      else syncing++;
    }
    if (synced + syncing === 0) return { status: "connecting", synced, syncing };
    return { status: syncing > 0 ? "syncing" : "synced", synced, syncing };
  }

  function allDocIds(): string[] {
    // Only docs this tab actually has open, so there are local heads to compare.
    // Worker-only docs — the tool/module bundles the worker serves but the tab
    // never opens — are intentionally excluded (they'd have no local heads).
    // Ephemeral presence/cursor/focus docs are hidden (see `isEphemeralDoc`).
    return [...handles.keys()]
      .filter((id) => !isEphemeralDoc(id))
      .sort((a, b) => lastSeen(b) - lastSeen(a));
  }

  function lastSeen(documentId: string): number {
    const peers = peerHeadsByDoc.get(documentId);
    if (!peers) return 0;
    let max = 0;
    for (const p of peers.values()) max = Math.max(max, p.timestamp);
    return max;
  }

  function render(): void {
    scanHandles();
    const { status, synced, syncing } = summarize();
    const ids = allDocIds();

    ui.root.dataset.status = status;
    renderHeadline(ui.label, status, synced, syncing);

    // Skip building (and head-checking) the doc rows entirely while collapsed.
    ui.docs.replaceChildren(...(collapsed ? [] : ids.map(renderDoc)));
  }

  function renderDoc(documentId: string): HTMLElement {
    const local = localHeadsFor(documentId);
    const peers = [...(peerHeadsByDoc.get(documentId)?.entries() ?? [])];
    const synced = docSynced(documentId);

    const type = docType(documentId);

    const group = document.createElement("div");
    group.className = "pw-sync-doc";
    if (synced === true) group.dataset.docstatus = "synced";
    else if (synced === false) group.dataset.docstatus = "syncing";

    const header = document.createElement("div");
    header.className = "pw-sync-doc-id";
    header.textContent = documentId + (type ? ` · ${type}` : "");
    group.appendChild(header);

    const localHeads = local ?? [];
    const localLabel = tabPeerId ? `${tabPeerId.slice(0, 6)}… (local)` : "local";
    group.appendChild(headRow(localLabel, localHeads, false));
    for (const [storageId, p] of peers) {
      const isServer = serverPeerIds.has(storageId);
      const tag = isServer
        ? " (server)"
        : storageId === workerPeerId
          ? " (worker)"
          : "";
      const label = `${storageId.slice(0, 6)}…${tag}`;
      // Server rows reflect the containment verdict (their sedimentree heads
      // won't set-equal our frontier); other rows use plain head equality.
      const rowInSync = isServer
        ? synced === true
        : sameHeads(p.heads, localHeads);
      // Declutter the server row: hide interior commits we already hold,
      // keeping only our latest shared tip plus any heads we genuinely lack.
      const heads = isServer ? trimSeenHeads(documentId, p.heads) : p.heads;
      group.appendChild(
        headRow(label, heads, rowInSync, relativeTime(p.timestamp))
      );
    }

    group.title = [
      `${documentId}`,
      `local: ${localHeads.join(", ") || "—"}`,
      ...peers.map(
        ([id, p]) =>
          `${id}: ${p.heads.join(", ") || "—"} (${
            sameHeads(p.heads, localHeads) ? "in sync" : "differs"
          }, ${relativeTime(p.timestamp)})`
      ),
    ].join("\n");
    return group;
  }

  function onMessage(event: MessageEvent): void {
    const data = event.data as SyncStateBroadcast;
    if (data?.type === "connection") {
      connected = data.connected;
      if (connected) everConnected = true;
      for (const id of data.serverPeerIds ?? []) serverPeerIds.add(id);
      render();
    } else if (data?.type === "remote-heads") {
      let byStorage = peerHeadsByDoc.get(data.documentId);
      if (!byStorage) {
        byStorage = new Map();
        peerHeadsByDoc.set(data.documentId, byStorage);
      }
      byStorage.set(data.storageId, { heads: data.heads, timestamp: data.timestamp });
      render();
    } else if (data?.type === "whoami") {
      workerPeerId = data.peerId;
      const w = window as unknown as {
        patchworkSyncIdentity?: Record<string, unknown>;
      };
      w.patchworkSyncIdentity = {
        ...w.patchworkSyncIdentity,
        worker: { peerId: data.peerId, verifyingKey: data.verifyingKey },
      };
      log("shared-worker subduction identity:", data.peerId);
      render();
    }
  }
  channel.addEventListener("message", onMessage);

  const onDocument = (payload: { handle: DocHandle<unknown> }) =>
    trackHandle(payload.handle);
  repo.on("document", onDocument);
  scanHandles();

  // Ask the worker to replay everything it currently knows.
  channel.postMessage({ type: "request" } satisfies SyncStateRequestMessage);

  // Keep relative "last seen" timestamps (and newly-opened docs) fresh.
  const tick = setInterval(() => render(), 10_000);

  render();
  log("sync indicator started");

  return {
    stop() {
      clearInterval(tick);
      repo.off("document", onDocument);
      channel.removeEventListener("message", onMessage);
      channel.close();
      for (const { handle, onHeads } of handles.values()) {
        handle.off("heads-changed", onHeads);
      }
      handles.clear();
      ui.root.remove();
    },
  };
}

/**
 * `@patchwork.type`s treated as ephemeral and hidden from the indicator by
 * default (high-churn presence/cursor/focus docs). Extend at runtime with
 * `localStorage.patchworkSyncIgnoreTypes = "type-a,type-b"`.
 */
const DEFAULT_EPHEMERAL_TYPES = [
  "awareness",
  "cursor",
  "cursors",
  "focus",
  "presence",
];

function readEphemeralTypes(): Set<string> {
  const extra = (() => {
    try {
      return (globalThis.localStorage?.getItem("patchworkSyncIgnoreTypes") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  })();
  return new Set([...DEFAULT_EPHEMERAL_TYPES, ...extra]);
}

function sameHeads(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");
}

function shortHead(h: string): string {
  return h.slice(0, 12);
}

function fmtHeads(heads: readonly string[]): string {
  return heads.length ? heads.map(shortHead).join(", ") : "—";
}

function relativeTime(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

const STYLE_ID = "pw-sync-indicator-styles";
const PANEL_ID = "pw-sync-indicator";

const STATUS_LABELS: Record<SyncStatus, string> = {
  offline: "offline",
  connecting: "connecting…",
  syncing: "syncing…",
  synced: "synced",
};

interface PanelUi {
  root: HTMLElement;
  status: HTMLElement;
  label: HTMLElement;
  docs: HTMLElement;
}

function headRow(
  name: string,
  heads: readonly string[],
  inSync: boolean,
  suffix?: string
): HTMLElement {
  const row = document.createElement("div");
  row.className = "pw-sync-row";
  if (inSync) row.classList.add("is-synced");
  const label = document.createElement("span");
  label.className = "pw-sync-peer";
  label.textContent = name;
  const value = document.createElement("span");
  value.textContent = fmtHeads(heads);
  row.append(label, document.createTextNode(" "), value);
  if (suffix) {
    const s = document.createElement("span");
    s.className = "pw-sync-when";
    s.textContent = ` ${suffix}`;
    row.append(s);
  }
  return row;
}

/**
 * Render the headline into `el`: a count breakdown like
 * "synced 45 docs, syncing 2 docs…" while connected, or the bare status word
 * ("connecting…" / "offline") otherwise. The synced/syncing parts are coloured
 * independently so a mostly-synced panel reads at a glance.
 */
function renderHeadline(
  el: HTMLElement,
  status: SyncStatus,
  synced: number,
  syncing: number
): void {
  if (status === "offline" || status === "connecting") {
    el.textContent = STATUS_LABELS[status];
    return;
  }
  const parts: Node[] = [];
  if (synced > 0) parts.push(countSpan("synced", synced));
  if (syncing > 0) {
    if (parts.length) parts.push(document.createTextNode(", "));
    parts.push(countSpan("syncing", syncing));
  }
  if (parts.length === 0) el.textContent = STATUS_LABELS[status];
  else el.replaceChildren(...parts);
}

function countSpan(verb: "synced" | "syncing", n: number): HTMLElement {
  const s = document.createElement("span");
  s.className = `pw-sync-count is-${verb}`;
  const tail = verb === "syncing" ? "…" : "";
  s.textContent = `${verb} ${n} doc${n === 1 ? "" : "s"}${tail}`;
  return s;
}

function createPanel(): PanelUi {
  const root = document.createElement("div");
  root.id = PANEL_ID;
  root.dataset.status = "connecting";

  const status = document.createElement("div");
  status.className = "pw-sync-status";
  status.title = "Click to expand / collapse";
  const dot = document.createElement("span");
  dot.className = "pw-sync-dot";
  const label = document.createElement("span");
  label.className = "pw-sync-label";
  label.textContent = STATUS_LABELS.connecting;
  status.append(dot, label);

  const docs = document.createElement("div");
  docs.className = "pw-sync-docs";

  root.append(status, docs);
  return { root, status, label, docs };
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    #${PANEL_ID} {
      position: fixed;
      bottom: 12px;
      right: 12px;
      z-index: 2147483647;
      max-width: 340px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 7px 11px;
      border-radius: 10px;
      font: 500 12px/1.3 ui-sans-serif, system-ui, sans-serif;
      color: #475569;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.14);
      backdrop-filter: blur(6px);
      user-select: none;
      pointer-events: auto;
    }
    #${PANEL_ID} .pw-sync-status { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
    #${PANEL_ID} .pw-sync-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
    #${PANEL_ID} .pw-sync-count.is-synced { color: #16a34a; }
    #${PANEL_ID} .pw-sync-count.is-syncing { color: #d97706; }
    #${PANEL_ID} .pw-sync-docs {
      display: flex; flex-direction: column; gap: 5px;
      max-height: 40vh; overflow-y: auto;
      font: 400 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #${PANEL_ID}[data-collapsed="true"] .pw-sync-docs { display: none; }
    #${PANEL_ID} .pw-sync-doc { border-left: 2px solid #e2e8f0; padding-left: 6px; }
    #${PANEL_ID} .pw-sync-doc[data-docstatus="synced"] { border-left-color: #16a34a; }
    #${PANEL_ID} .pw-sync-doc[data-docstatus="syncing"] { border-left-color: #d97706; }
    #${PANEL_ID} .pw-sync-doc-id { color: #64748b; font-weight: 600; word-break: break-all; }
    #${PANEL_ID} .pw-sync-row { color: #94a3b8; word-break: break-all; }
    #${PANEL_ID} .pw-sync-row.is-synced { color: #16a34a; }
    #${PANEL_ID} .pw-sync-peer { color: #cbd5e1; }
    #${PANEL_ID} .pw-sync-when { color: #cbd5e1; }
    #${PANEL_ID}[data-status="synced"] .pw-sync-dot, #${PANEL_ID}[data-status="synced"] .pw-sync-label { color: #16a34a; }
    #${PANEL_ID}[data-status="syncing"] .pw-sync-dot, #${PANEL_ID}[data-status="syncing"] .pw-sync-label { color: #d97706; }
    #${PANEL_ID}[data-status="connecting"] .pw-sync-dot, #${PANEL_ID}[data-status="connecting"] .pw-sync-label { color: #94a3b8; }
    #${PANEL_ID}[data-status="offline"] .pw-sync-dot, #${PANEL_ID}[data-status="offline"] .pw-sync-label { color: #dc2626; }
    #${PANEL_ID}[data-status="syncing"] .pw-sync-dot { animation: pw-sync-pulse 1s ease-in-out infinite; }
    @keyframes pw-sync-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    @media (prefers-color-scheme: dark) {
      #${PANEL_ID} { color: #cbd5e1; background: rgba(15, 23, 42, 0.85); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45); }
      #${PANEL_ID} .pw-sync-doc { border-left-color: #334155; }
      #${PANEL_ID} .pw-sync-doc-id { color: #94a3b8; }
      #${PANEL_ID} .pw-sync-peer, #${PANEL_ID} .pw-sync-when { color: #64748b; }
      #${PANEL_ID} .pw-sync-row.is-synced { color: #4ade80; }
      #${PANEL_ID} .pw-sync-count.is-synced { color: #4ade80; }
      #${PANEL_ID} .pw-sync-count.is-syncing { color: #fbbf24; }
      #${PANEL_ID}[data-status="synced"] .pw-sync-dot, #${PANEL_ID}[data-status="synced"] .pw-sync-label { color: #4ade80; }
      #${PANEL_ID}[data-status="syncing"] .pw-sync-dot, #${PANEL_ID}[data-status="syncing"] .pw-sync-label { color: #fbbf24; }
      #${PANEL_ID}[data-status="offline"] .pw-sync-dot, #${PANEL_ID}[data-status="offline"] .pw-sync-label { color: #f87171; }
    }
  `;
  document.head.appendChild(style);
}
