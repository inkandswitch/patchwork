/**
 * Wired-space — a spatial dataflow canvas built on `edge-handles`.
 *
 * Each doc becomes a Card. Each EdgeHandle becomes a node hovering between
 * its sources (on the left) and its targets (on the right). Wires connect
 * card-ports to the node and back out again. Endpoint paths live in small
 * badges at the connection point — hover to reveal, click to edit.
 *
 * Persisted state (on the folder doc):
 *
 *   folder.wiredSpace = {
 *     positions:  { [docUrl]: { x, y, w, h } }
 *     cardTools:  { [docUrl]: string }
 *     edges:      AutomergeUrl[]
 *     bindings:   { [edgeUrl]: { transformId } }
 *   }
 *
 * Reactivity model:
 *  - `watchDoc(handle)` returns a Solid signal whose value is the current
 *    doc snapshot. The signal re-emits on every `handle.on("change")`. This
 *    is coarser-grained than `makeDocumentProjection`, but bypasses a bug in
 *    automerge-repo-solid-primitives whose `applyDelPatch` throws on map-key
 *    deletions (so projections silently desync when you delete endpoints).
 *  - Per-edge runtime state (the live `EdgeHandle`, its doc accessor, its
 *    transform detach) is held in a `Map<url, LiveEdge>` exposed as a
 *    `createSignal` so adds/removes propagate to JSX cleanly.
 */

import type {
  AutomergeUrl,
  DocHandle,
  Repo,
} from "@automerge/automerge-repo";
import {
  getRegistry,
  type Plugin,
  type Tool,
  type ToolElement,
  type ToolDescription,
} from "@inkandswitch/patchwork-plugins";
import type { FolderDoc, DocLink } from "@inkandswitch/patchwork-filesystem";
import {
  createEdgeHandle,
  findEdgeHandle,
  type EdgeHandle,
  type EdgeHandleDoc,
  type HandleUrl,
} from "@inkandswitch/edge-handles";
import * as patterns from "./patterns/index.js";
import {
  For,
  Show,
  createMemo,
  createSignal,
  createEffect,
  onCleanup,
  type Accessor,
  type JSX,
} from "solid-js";
import { render } from "solid-js/web";

// ─── constants ────────────────────────────────────────────────────────────

const DEFAULT_W = 280;
const DEFAULT_H = 220;
const MIN_W = 140;
const MIN_H = 100;
const GRID_GAP = 24;
const COLS = 3;
const NODE_W = 140;
const NODE_H = 32;

const COLOR_ACCENT = "rgba(120,140,255,0.9)";
const COLOR_ACCENT_BG = "rgba(120,140,200,0.08)";
const COLOR_ACCENT_BORDER = "rgba(120,140,200,0.32)";
const COLOR_INK = "rgba(60,70,100,0.85)";
const COLOR_INK_DIM = "rgba(80,90,160,0.85)";
const FONT_UI =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
const FONT_MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

const TRANSFORMS: Record<string, (edge: EdgeHandle<any>) => () => void> = {
  identity: patterns.identity,
  "math/sum": patterns.sum,
  "text/upper": patterns.upper,
  "text/lower": patterns.lower,
  "text/slugify": patterns.slugify,
  "text/markdown-to-html": patterns.markdownToHtml,
  "color/srgb-to-oklch": patterns.srgbToOklch,
  "color/oklch-to-srgb": patterns.oklchToSrgb,
};
const TRANSFORM_IDS = Object.keys(TRANSFORMS).sort();

// ─── types ────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}
interface CardPos {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface WiredSpaceState {
  positions?: Record<string, CardPos>;
  cardTools?: Record<string, string>;
  edges?: AutomergeUrl[];
  bindings?: Record<string, { transformId: string }>;
}
type FolderDocWithWiredSpace = FolderDoc & { wiredSpace?: WiredSpaceState };

interface LiveEdge {
  url: AutomergeUrl;
  edge: EdgeHandle<unknown>;
  doc: Accessor<EdgeHandleDoc>;
  detach: (() => void) | null;
  transformId: string;
}

type DragKind = "card-out" | "node-out";
interface DragOrigin {
  kind: DragKind;
  /** Source card URL or source edge URL. */
  refId: string;
  /** Canvas-space origin point for the in-flight wire. */
  origin: Point;
}

type DropTarget =
  | { kind: "card"; refId: string }
  | { kind: "node"; refId: string };

interface InspectorState {
  edgeUrl: AutomergeUrl;
  x: number;
  y: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────

/**
 * Subscribe to a DocHandle and expose its current doc as a Solid signal.
 *
 * Replaces `makeDocumentProjection` — which has a bug applying `del` patches
 * to maps and silently desyncs on endpoint/cardTool deletions. Coarser
 * granularity (every change re-runs every consumer) is fine for our docs.
 */
function watchDoc<T>(handle: DocHandle<T>): Accessor<T> {
  const [doc, setDoc] = createSignal<T>(handle.doc() as T, { equals: false });
  const update = () => setDoc(() => handle.doc() as T);
  handle.on("change", update);
  onCleanup(() => handle.off("change", update));
  return doc;
}

function docIdOf(url: string): string | undefined {
  const m = /^automerge:([^/#]+)/.exec(url);
  return m ? m[1] : undefined;
}

function pathOfUrl(url: string): string {
  const m = /^automerge:[^/#]+\/([^#]*)/.exec(url);
  return m ? m[1] : "";
}

function refUrl(docUrl: AutomergeUrl, path: string): HandleUrl {
  if (!path) return docUrl;
  const id = docIdOf(docUrl);
  if (!id) return docUrl;
  return `automerge:${id}/${path}` as AutomergeUrl;
}

function shortUrl(url: string): string {
  if (url.length <= 20) return url;
  return `${url.slice(0, 12)}…${url.slice(-6)}`;
}

function shortDoc(url: string): string {
  const id = docIdOf(url) ?? "";
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function cubicPath(a: Point, b: Point): string {
  const dx = Math.max(40, Math.abs(b.x - a.x) / 2);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

function slugFor(base: string): string {
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "src"
  );
}

function uniqueKey(base: string, existing: string[] = []): string {
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

function fieldFor(handle: DocHandle<any>): string {
  const doc = handle.doc() as Record<string, unknown> | undefined;
  if (!doc) return "content";
  if ("content" in doc) return "content";
  if ("value" in doc) return "value";
  if ("body" in doc) return "body";
  if ("text" in doc) return "text";
  return "";
}

function linkName(links: DocLink[], url: string): string | undefined {
  return links.find((l) => l.url === url)?.name;
}

function listToolsForType(type: string): ToolDescription[] {
  const reg = getRegistry<ToolDescription>("patchwork:tool");
  return reg.all().filter((t) => {
    if (t.id === "wired-space" || t.id === "edge-pair") return false;
    const sd = t.supportedDatatypes;
    if (sd === "*") return true;
    if (Array.isArray(sd)) return sd.includes(type) || sd.includes("*");
    return false;
  }) as ToolDescription[];
}

// ─── topological layout ───────────────────────────────────────────────────

/**
 * Lay cards out by their depth in the edge DAG: sources on the left, sinks on
 * the right. Each column is vertically centered against the tallest column,
 * and the horizontal stride leaves room for the edge node between columns.
 * Back-edges (cycles) are broken by visiting order.
 */
function computeTopologicalLayout(
  links: DocLink[],
  edgeUrls: AutomergeUrl[],
  edgeDocOf: (url: AutomergeUrl) => EdgeHandleDoc | undefined
): Record<string, CardPos> {
  const idToUrl = new Map<string, string>();
  for (const l of links) {
    const id = docIdOf(l.url);
    if (id) idToUrl.set(id, l.url);
  }

  const adj = new Map<string, Set<string>>();
  for (const l of links) adj.set(l.url, new Set());
  for (const edgeUrl of edgeUrls) {
    const doc = edgeDocOf(edgeUrl);
    if (!doc) continue;
    const sourceUrls = Object.values(doc.source ?? {});
    const targetUrls = Object.values(doc.target ?? {});
    for (const fu of sourceUrls) {
      const fid = docIdOf(fu);
      const f = fid ? idToUrl.get(fid) : undefined;
      if (!f) continue;
      for (const tu of targetUrls) {
        const tid = docIdOf(tu);
        const t = tid ? idToUrl.get(tid) : undefined;
        if (!t) continue;
        adj.get(f)?.add(t);
      }
    }
  }

  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  function depthOf(u: string): number {
    if (depth.has(u)) return depth.get(u)!;
    if (visiting.has(u)) return 0;
    visiting.add(u);
    let d = 0;
    for (const [v, outs] of adj.entries()) {
      if (v !== u && outs.has(u)) d = Math.max(d, depthOf(v) + 1);
    }
    visiting.delete(u);
    depth.set(u, d);
    return d;
  }
  for (const l of links) depthOf(l.url);

  const columns = new Map<number, string[]>();
  for (const l of links) {
    const d = depth.get(l.url) ?? 0;
    if (!columns.has(d)) columns.set(d, []);
    columns.get(d)!.push(l.url);
  }

  const colStride = DEFAULT_W + NODE_W + GRID_GAP * 2;
  const tallestColumn = Math.max(
    ...[...columns.values()].map((c) => c.length),
    1
  );
  const baselineHeight =
    tallestColumn * DEFAULT_H + (tallestColumn - 1) * GRID_GAP;

  const out: Record<string, CardPos> = {};
  const depths = [...columns.keys()].sort((a, b) => a - b);
  for (const d of depths) {
    const col = columns.get(d)!;
    const colHeight = col.length * DEFAULT_H + (col.length - 1) * GRID_GAP;
    const yOffset = GRID_GAP + (baselineHeight - colHeight) / 2;
    col.forEach((url, i) => {
      out[url] = {
        x: GRID_GAP + d * colStride,
        y: yOffset + i * (DEFAULT_H + GRID_GAP),
        w: DEFAULT_W,
        h: DEFAULT_H,
      };
    });
  }
  return out;
}

// ─── tool entry point ─────────────────────────────────────────────────────

function renderWiredSpace(
  handle: DocHandle<FolderDocWithWiredSpace>,
  element: ToolElement
): () => void {
  return render(
    () => <WiredSpace handle={handle} element={element} />,
    element
  );
}

export const wiredSpacePlugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "wired-space",
    name: "Wired Space",
    icon: "Network",
    supportedDatatypes: ["folder"],
    async load() {
      return renderWiredSpace;
    },
  } satisfies Tool<FolderDocWithWiredSpace>,
];

// ─── main component ───────────────────────────────────────────────────────

function WiredSpace(props: {
  handle: DocHandle<FolderDocWithWiredSpace>;
  element: ToolElement;
}): JSX.Element {
  const { handle, element } = props;
  const repo: Repo = element.repo;

  // Reactive folder doc.
  const folder = watchDoc<FolderDocWithWiredSpace>(handle);

  // Live edge runtime state, keyed by edge URL. Replaced (not mutated) on
  // add/remove so Solid sees a fresh value.
  const [liveEdges, setLiveEdges] = createSignal<
    ReadonlyMap<AutomergeUrl, LiveEdge>
  >(new Map());
  const setLiveEdge = (url: AutomergeUrl, live: LiveEdge) =>
    setLiveEdges((m) => new Map(m).set(url, live));
  const removeLiveEdge = (url: AutomergeUrl) =>
    setLiveEdges((m) => {
      const next = new Map(m);
      next.delete(url);
      return next;
    });

  // Drag state.
  const [drag, setDrag] = createSignal<DragOrigin | null>(null);
  const [cursor, setCursor] = createSignal<Point | null>(null);

  // Inspector state.
  const [inspector, setInspector] = createSignal<InspectorState | null>(null);

  // ─── derived: cards ────────────────────────────────────────────────────
  const cardLinks = createMemo<DocLink[]>(() =>
    (folder().docs ?? []).filter((l) => l.type !== "folder")
  );

  const cardPosOf = (url: string): CardPos => {
    const p = folder().wiredSpace?.positions?.[url];
    if (p) return p;
    const links = cardLinks();
    const i = links.findIndex((l) => l.url === url);
    return {
      x: GRID_GAP + (i % COLS) * (DEFAULT_W + GRID_GAP),
      y: GRID_GAP + Math.floor(i / COLS) * (DEFAULT_H + GRID_GAP),
      w: DEFAULT_W,
      h: DEFAULT_H,
    };
  };

  const cardToolOf = (url: string): string | undefined =>
    folder().wiredSpace?.cardTools?.[url];

  // ─── derived: anchors and centroids ────────────────────────────────────
  // Resolve a wire endpoint URL → canvas point. Card endpoint = the card's
  // right/left edge midpoint. Edge endpoint (chaining) = the node's right/
  // left edge midpoint.
  function anchorForEndpoint(
    url: string,
    side: "out" | "in"
  ): Point | undefined {
    const docId = docIdOf(url);
    if (!docId) return undefined;
    const link = cardLinks().find((l) => l.url.endsWith(docId));
    if (link) {
      const p = cardPosOf(link.url);
      return side === "out"
        ? { x: p.x + p.w, y: p.y + p.h / 2 }
        : { x: p.x, y: p.y + p.h / 2 };
    }
    for (const [edgeUrl, live] of liveEdges()) {
      if (edgeUrl.endsWith(docId)) {
        const c = centroidOf(live.doc());
        if (!c) continue;
        return side === "out"
          ? { x: c.x + NODE_W / 2, y: c.y }
          : { x: c.x - NODE_W / 2, y: c.y };
      }
    }
    return undefined;
  }

  // Edge node sits at the horizontal midpoint of its endpoint anchors and at
  // the vertical average — splits sources from targets cleanly while sitting
  // along the natural flow.
  function centroidOf(doc: EdgeHandleDoc): Point | undefined {
    const pts: Point[] = [];
    for (const u of Object.values(doc.source ?? {})) {
      const p = anchorForEndpoint(u, "out");
      if (p) pts.push(p);
    }
    for (const u of Object.values(doc.target ?? {})) {
      const p = anchorForEndpoint(u, "in");
      if (p) pts.push(p);
    }
    if (pts.length === 0) return undefined;
    const xs = pts.map((p) => p.x);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2;
    const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { x, y };
  }

  // ─── edge reconciliation ───────────────────────────────────────────────
  // Open EdgeHandles for every URL in the folder; tear down on removal.
  createEffect(() => {
    const urls = folder().wiredSpace?.edges ?? [];
    const wanted = new Set(urls);

    for (const [url, live] of liveEdges()) {
      if (!wanted.has(url)) {
        live.detach?.();
        live.edge.destroy();
        removeLiveEdge(url);
      }
    }

    for (const url of urls) {
      if (liveEdges().has(url)) continue;
      const transformId =
        folder().wiredSpace?.bindings?.[url]?.transformId ?? "identity";
      void (async () => {
        try {
          const edge = await findEdgeHandle(repo, url);
          const docSig = watchDoc<EdgeHandleDoc>(edge.doc);
          const attach = TRANSFORMS[transformId];
          const detach = attach ? attach(edge) : null;
          setLiveEdge(url, {
            url,
            edge,
            doc: docSig,
            detach,
            transformId,
          });
        } catch (err) {
          console.error("[wired-space] failed to open edge", url, err);
        }
      })();
    }
  });

  // Re-attach transforms when bindings change.
  createEffect(() => {
    const bindings = folder().wiredSpace?.bindings ?? {};
    for (const [url, live] of liveEdges()) {
      const wanted = bindings[url]?.transformId ?? "identity";
      if (live.transformId === wanted) continue;
      live.detach?.();
      const attach = TRANSFORMS[wanted];
      const detach = attach ? attach(live.edge) : null;
      setLiveEdge(url, { ...live, detach, transformId: wanted });
    }
  });

  onCleanup(() => {
    for (const live of liveEdges().values()) {
      live.detach?.();
      live.edge.destroy();
    }
  });

  // ─── mutators ──────────────────────────────────────────────────────────
  const editFolder = (fn: (s: WiredSpaceState) => void) =>
    handle.change((d) => {
      if (!d.wiredSpace) d.wiredSpace = {};
      fn(d.wiredSpace);
    });

  const setCardPos = (url: string, next: CardPos) =>
    editFolder((s) => {
      if (!s.positions) s.positions = {};
      s.positions[url] = next;
    });

  const setCardTool = (url: string, tid: string) =>
    editFolder((s) => {
      if (!s.cardTools) s.cardTools = {};
      if (tid === "") delete s.cardTools[url];
      else s.cardTools[url] = tid;
    });

  const setBinding = (edgeUrl: string, transformId: string) =>
    editFolder((s) => {
      if (!s.bindings) s.bindings = {};
      s.bindings[edgeUrl] = { transformId };
    });

  const removeEdge = (edgeUrl: string) =>
    editFolder((s) => {
      if (s.edges) s.edges = s.edges.filter((u) => u !== edgeUrl);
      if (s.bindings) delete s.bindings[edgeUrl];
    });

  async function createWireBetween(fromDocUrl: string, toDocUrl: string) {
    const [fromH, toH] = await Promise.all([
      repo.find(fromDocUrl as AutomergeUrl),
      repo.find(toDocUrl as AutomergeUrl),
    ]);
    await Promise.all([fromH.whenReady(), toH.whenReady()]);
    const fromName = uniqueKey(
      slugFor(linkName(cardLinks(), fromDocUrl) ?? "src")
    );
    const toName = uniqueKey(
      slugFor(linkName(cardLinks(), toDocUrl) ?? "sink")
    );
    const edge = await createEdgeHandle(repo, {
      source: {
        [fromName]: refUrl(fromH.url as AutomergeUrl, fieldFor(fromH)),
      },
      target: {
        [toName]: refUrl(toH.url as AutomergeUrl, fieldFor(toH)),
      },
    });
    editFolder((s) => {
      if (!s.edges) s.edges = [];
      s.edges.push(edge.url);
      if (!s.bindings) s.bindings = {};
      s.bindings[edge.url] = { transformId: "identity" };
    });
  }

  async function addSourceToEdge(
    edgeUrl: AutomergeUrl,
    sourceDocUrl: string
  ) {
    const fromH = await repo.find(sourceDocUrl as AutomergeUrl);
    await fromH.whenReady();
    const edge = await findEdgeHandle(repo, edgeUrl);
    const name = uniqueKey(
      slugFor(linkName(cardLinks(), sourceDocUrl) ?? "src"),
      Object.keys(edge.doc.doc()?.source ?? {})
    );
    edge.setSource(name, refUrl(fromH.url as AutomergeUrl, fieldFor(fromH)));
  }

  async function addTargetToEdge(edgeUrl: AutomergeUrl, toDocUrl: string) {
    const toH = await repo.find(toDocUrl as AutomergeUrl);
    await toH.whenReady();
    const edge = await findEdgeHandle(repo, edgeUrl);
    const name = uniqueKey(
      slugFor(linkName(cardLinks(), toDocUrl) ?? "sink"),
      Object.keys(edge.doc.doc()?.target ?? {})
    );
    edge.setTarget(name, refUrl(toH.url as AutomergeUrl, fieldFor(toH)));
  }

  async function addSourceEdgeToEdge(
    targetEdgeUrl: AutomergeUrl,
    sourceEdgeUrl: AutomergeUrl
  ) {
    const edge = await findEdgeHandle(repo, targetEdgeUrl);
    const name = uniqueKey(
      "edge",
      Object.keys(edge.doc.doc()?.source ?? {})
    );
    edge.setSource(name, sourceEdgeUrl);
  }

  function layoutGrid() {
    editFolder((s) => {
      s.positions = computeTopologicalLayout(
        cardLinks(),
        s.edges ?? [],
        (edgeUrl) => liveEdges().get(edgeUrl)?.doc()
      );
    });
  }

  // ─── drag-to-wire state machine ────────────────────────────────────────
  let layerEl: HTMLDivElement | undefined;
  const canvasPoint = (clientX: number, clientY: number): Point => {
    if (!layerEl) return { x: clientX, y: clientY };
    const r = layerEl.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  function dropTargetAt(clientX: number, clientY: number): DropTarget | null {
    const target = document.elementFromPoint(clientX, clientY);
    if (!(target instanceof HTMLElement)) return null;
    const cardEl = target.closest<HTMLElement>("[data-card-url]");
    if (cardEl) return { kind: "card", refId: cardEl.dataset.cardUrl! };
    const nodeEl = target.closest<HTMLElement>("[data-edge-url]");
    if (nodeEl) return { kind: "node", refId: nodeEl.dataset.edgeUrl! };
    return null;
  }

  // `originViewport` is the on-screen port center; we convert to canvas
  // coords internally so the in-flight wire actually anchors to the port.
  function startDrag(
    kind: DragKind,
    refId: string,
    ev: PointerEvent,
    originViewport: Point
  ) {
    ev.stopPropagation();
    setDrag({
      kind,
      refId,
      origin: canvasPoint(originViewport.x, originViewport.y),
    });
    setCursor(canvasPoint(ev.clientX, ev.clientY));
    document.body.style.userSelect = "none";

    const onMove = (m: PointerEvent) =>
      setCursor(canvasPoint(m.clientX, m.clientY));
    const onUp = (u: PointerEvent) => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
      const target = dropTargetAt(u.clientX, u.clientY);
      const d = drag();
      setDrag(null);
      setCursor(null);
      if (target && d) void completeDrag(d, target);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  async function completeDrag(d: DragOrigin, target: DropTarget) {
    if (d.kind === "card-out" && target.kind === "card") {
      if (d.refId === target.refId) return;
      await createWireBetween(d.refId, target.refId);
    } else if (d.kind === "card-out" && target.kind === "node") {
      await addSourceToEdge(target.refId as AutomergeUrl, d.refId);
    } else if (d.kind === "node-out" && target.kind === "card") {
      await addTargetToEdge(d.refId as AutomergeUrl, target.refId);
    } else if (d.kind === "node-out" && target.kind === "node") {
      if (d.refId === target.refId) return;
      await addSourceEdgeToEdge(
        target.refId as AutomergeUrl,
        d.refId as AutomergeUrl
      );
    }
  }

  // ─── inspector helpers ─────────────────────────────────────────────────
  const openInspector = (edgeUrl: AutomergeUrl, ev: MouseEvent) =>
    setInspector({ edgeUrl, x: ev.clientX, y: ev.clientY });

  const onClickWire = (
    ev: MouseEvent,
    live: LiveEdge,
    side: "source" | "target",
    name: string
  ) => {
    ev.stopPropagation();
    if (ev.altKey) {
      if (side === "source") live.edge.removeSource(name);
      else live.edge.removeTarget(name);
    } else {
      openInspector(live.url, ev);
    }
  };

  // Close inspector when clicking outside it (but not on wires/nodes/badges).
  const onBackgroundClick = (ev: MouseEvent) => {
    const t = ev.target;
    if (!inspector()) return;
    if (
      t instanceof HTMLElement &&
      (t.closest("[data-inspector]") ||
        t.closest("[data-edge-url]") ||
        t.closest("[data-endpoint-badge]"))
    )
      return;
    if (t instanceof Element && t.closest('[data-wire="1"]')) return;
    setInspector(null);
  };

  // ─── render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "var(--color-base-100, #f3f5fa)",
        display: "grid",
        "grid-template-rows": "auto 1fr",
        "font-family": FONT_UI,
      }}
      onClick={onBackgroundClick}
    >
      <Toolbar
        onLayout={layoutGrid}
        onClear={() =>
          editFolder((s) => {
            s.edges = [];
            s.bindings = {};
          })
        }
        statusText={() => (drag() ? "drop on a card or node" : "")}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          "min-height": 0,
          overflow: "auto",
        }}
      >
        <div
          ref={layerEl}
          style={{
            position: "relative",
            width: "4000px",
            height: "3000px",
          }}
        >
          <WiresLayer
            liveEdges={liveEdges}
            anchorForEndpoint={anchorForEndpoint}
            drag={drag}
            cursor={cursor}
            onClickWire={onClickWire}
          />

          <For each={cardLinks()}>
            {(link) => (
              <Card
                link={link}
                pos={() => cardPosOf(link.url)}
                toolId={() => cardToolOf(link.url)}
                wiringActive={() => drag() !== null}
                onPos={(next) => setCardPos(link.url, next)}
                onTool={(tid) => setCardTool(link.url, tid)}
                onOutPointerDown={(ev, origin) =>
                  startDrag("card-out", link.url, ev, origin)
                }
              />
            )}
          </For>

          <For each={[...liveEdges().values()]}>
            {(live) => (
              <EdgeNode
                live={live}
                centroid={() => centroidOf(live.doc())}
                wiringActive={() => drag() !== null}
                onStartDrag={(ev, rect) =>
                  startDrag("node-out", live.url, ev, {
                    x: rect.right,
                    y: rect.top + rect.height / 2,
                  })
                }
                onOpenInspector={(ev) => openInspector(live.url, ev)}
              />
            )}
          </For>

          <For each={[...liveEdges().values()]}>
            {(live) => (
              <EndpointBadges
                live={live}
                anchorForEndpoint={anchorForEndpoint}
              />
            )}
          </For>
        </div>
      </div>

      <Show when={inspector()}>
        {(insp) => {
          const live = createMemo(() => liveEdges().get(insp().edgeUrl));
          return (
            <Show when={live()}>
              {(l) => (
                <Inspector
                  live={l}
                  position={() => ({ x: insp().x, y: insp().y })}
                  elementRect={() => element.getBoundingClientRect()}
                  onTransform={(tid) => setBinding(insp().edgeUrl, tid)}
                  onRemoveEdge={() => {
                    removeEdge(insp().edgeUrl);
                    setInspector(null);
                  }}
                  onClose={() => setInspector(null)}
                />
              )}
            </Show>
          );
        }}
      </Show>
    </div>
  );
}

// ─── sub-components: Toolbar ──────────────────────────────────────────────

function Toolbar(props: {
  onLayout: () => void;
  onClear: () => void;
  statusText: () => string;
}): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "6px",
        padding: "6px 10px",
        "border-bottom": "1px solid rgba(120,140,200,0.18)",
        "font-size": "12px",
        background: "rgba(255,255,255,0.6)",
      }}
    >
      <span
        style={{
          "font-weight": 600,
          color: COLOR_INK_DIM,
          "margin-right": "8px",
        }}
      >
        wired-space
      </span>
      <ToolbarButton label="Layout" onClick={props.onLayout} />
      <ToolbarButton label="Clear wires" onClick={props.onClear} />
      <span style={{ opacity: 0.55, "margin-left": "4px" }}>
        Drag a card's right port onto another's left to connect. Hover a wire
        endpoint to see its path; click to edit, alt+click to detach.
      </span>
      <span
        style={{
          "margin-left": "auto",
          "font-family": FONT_MONO,
          "font-size": "10px",
          opacity: 0.55,
          "white-space": "nowrap",
        }}
      >
        {props.statusText()}
      </span>
    </div>
  );
}

function ToolbarButton(props: {
  label: string;
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      style={{
        "font-size": "11px",
        padding: "2px 8px",
        "margin-left": "4px",
        "border-radius": "4px",
        border: "1px solid rgba(120,140,200,0.4)",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
      }}
      onClick={() => props.onClick()}
    >
      {props.label}
    </button>
  );
}

// ─── sub-components: Card ─────────────────────────────────────────────────

function Card(props: {
  link: DocLink;
  pos: () => CardPos;
  toolId: () => string | undefined;
  wiringActive: () => boolean;
  onPos: (next: CardPos) => void;
  onTool: (tid: string) => void;
  onOutPointerDown: (ev: PointerEvent, originViewport: Point) => void;
}): JSX.Element {
  let outPortEl: HTMLDivElement | undefined;

  const onHeaderPointerDown = (ev: PointerEvent) => {
    if (ev.target instanceof HTMLButtonElement) return;
    if (ev.target instanceof HTMLSelectElement) return;
    const start = props.pos();
    const ox = ev.clientX - start.x;
    const oy = ev.clientY - start.y;
    document.body.style.userSelect = "none";
    const onMove = (m: PointerEvent) =>
      props.onPos({
        ...props.pos(),
        x: Math.max(0, m.clientX - ox),
        y: Math.max(0, m.clientY - oy),
      });
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  const onResizePointerDown = (ev: PointerEvent) => {
    ev.stopPropagation();
    const start = props.pos();
    const sx = ev.clientX;
    const sy = ev.clientY;
    document.body.style.userSelect = "none";
    const onMove = (m: PointerEvent) =>
      props.onPos({
        ...props.pos(),
        w: Math.max(MIN_W, start.w + (m.clientX - sx)),
        h: Math.max(MIN_H, start.h + (m.clientY - sy)),
      });
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };

  return (
    <div
      data-card-url={props.link.url}
      style={{
        position: "absolute",
        left: `${props.pos().x}px`,
        top: `${props.pos().y}px`,
        width: `${props.pos().w}px`,
        height: `${props.pos().h}px`,
        background: "white",
        border: `1px solid ${COLOR_ACCENT_BORDER}`,
        "border-radius": "8px",
        "box-shadow": "0 2px 8px rgba(50,60,90,0.08)",
        display: "flex",
        "flex-direction": "column",
        overflow: "visible",
        "min-width": `${MIN_W}px`,
        "min-height": `${MIN_H}px`,
      }}
    >
      <div
        onPointerDown={onHeaderPointerDown}
        style={{
          display: "flex",
          "align-items": "center",
          gap: "6px",
          padding: "4px 8px",
          background: COLOR_ACCENT_BG,
          "border-bottom": "1px solid rgba(120,140,200,0.18)",
          "font-size": "11px",
          color: COLOR_INK,
          "user-select": "none",
          cursor: "move",
          "border-top-left-radius": "8px",
          "border-top-right-radius": "8px",
        }}
      >
        <span
          style={{
            flex: 1,
            "white-space": "nowrap",
            overflow: "hidden",
            "text-overflow": "ellipsis",
          }}
        >
          {props.link.name} · {props.link.type}
        </span>
        <ToolPicker
          link={props.link}
          value={props.toolId}
          onChange={(tid) => props.onTool(tid)}
        />
      </div>

      <div
        style={{
          flex: 1,
          "min-height": 0,
          "min-width": 0,
          overflow: "hidden",
          "border-bottom-left-radius": "8px",
          "border-bottom-right-radius": "8px",
        }}
      >
        {/* @ts-expect-error custom element */}
        <patchwork-view
          attr:doc-url={props.link.url}
          attr:tool-id={props.toolId() || undefined}
          style="width:100%;height:100%;display:flex;"
        />
      </div>

      <Port
        ref={outPortEl}
        position="right"
        kind="card-out"
        visible={() => true}
        onPointerDown={(ev) => {
          if (!outPortEl) return;
          const r = outPortEl.getBoundingClientRect();
          props.onOutPointerDown(ev, {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
          });
        }}
      />

      <Port position="left" kind="card-in" visible={props.wiringActive} />

      <div
        onPointerDown={onResizePointerDown}
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          width: "14px",
          height: "14px",
          cursor: "nwse-resize",
          "z-index": 2,
          "pointer-events": "auto",
          background:
            "linear-gradient(135deg, transparent 50%, rgba(120,140,200,0.55) 50%, rgba(120,140,200,0.55) 65%, transparent 65%, transparent 75%, rgba(120,140,200,0.55) 75%, rgba(120,140,200,0.55) 85%, transparent 85%)",
        }}
      />
    </div>
  );
}

function ToolPicker(props: {
  link: DocLink;
  value: () => string | undefined;
  onChange: (id: string) => void;
}): JSX.Element {
  const options = createMemo(() =>
    listToolsForType(props.link.type)
      .map((t) => t.id)
      .sort()
  );
  return (
    <select
      onChange={(e) => props.onChange(e.currentTarget.value)}
      value={props.value() ?? ""}
      style={{
        "font-size": "10px",
        padding: "1px 2px",
        "border-radius": "4px",
        border: "1px solid rgba(120,140,200,0.4)",
        background: "transparent",
      }}
    >
      <option value="">(default)</option>
      <For each={options()}>{(id) => <option value={id}>{id}</option>}</For>
    </select>
  );
}

function Port(props: {
  ref?: HTMLDivElement;
  position: "left" | "right";
  kind: "card-out" | "card-in";
  visible: () => boolean;
  onPointerDown?: (ev: PointerEvent) => void;
}): JSX.Element {
  const isInput = props.kind === "card-in";
  return (
    <div
      ref={props.ref}
      data-port-kind={props.kind}
      onPointerDown={(ev) => props.onPointerDown?.(ev)}
      style={{
        position: "absolute",
        [props.position]: "-6px",
        top: "50%",
        transform: "translate(0, -50%)",
        width: "14px",
        height: "10px",
        "border-radius": "6px",
        background: COLOR_ACCENT,
        border: "1px solid rgba(120,140,255,0.95)",
        "box-shadow": "0 1px 2px rgba(50,60,90,0.15)",
        cursor: isInput ? "default" : "crosshair",
        "pointer-events": "auto",
        opacity: props.visible() ? 1 : 0,
        transition: isInput ? "opacity 0.08s ease" : "none",
        "z-index": 2,
      }}
    />
  );
}

// ─── sub-components: EdgeNode ─────────────────────────────────────────────

function EdgeNode(props: {
  live: LiveEdge;
  centroid: () => Point | undefined;
  wiringActive: () => boolean;
  onStartDrag: (ev: PointerEvent, rect: DOMRect) => void;
  onOpenInspector: (ev: MouseEvent) => void;
}): JSX.Element {
  let nodeEl: HTMLDivElement | undefined;
  let downAt: { x: number; y: number } | null = null;
  const onDown = (ev: PointerEvent) => {
    if (!nodeEl) return;
    downAt = { x: ev.clientX, y: ev.clientY };
    props.onStartDrag(ev, nodeEl.getBoundingClientRect());
  };
  const onUp = (ev: PointerEvent) => {
    if (!downAt) return;
    const dx = Math.abs(ev.clientX - downAt.x);
    const dy = Math.abs(ev.clientY - downAt.y);
    downAt = null;
    if (dx < 3 && dy < 3) props.onOpenInspector(ev as unknown as MouseEvent);
  };

  return (
    <Show when={props.centroid()}>
      {(c) => (
        <div
          ref={nodeEl}
          data-edge-url={props.live.url}
          onPointerDown={onDown}
          onPointerUp={onUp}
          style={{
            position: "absolute",
            left: `${c().x - NODE_W / 2}px`,
            top: `${c().y - NODE_H / 2}px`,
            width: `${NODE_W}px`,
            height: `${NODE_H}px`,
            background: "rgba(255,255,255,0.94)",
            border: "1.5px dashed rgba(120,140,255,0.8)",
            "border-radius": "16px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            "font-size": "11px",
            "line-height": 1,
            "font-family": FONT_MONO,
            color: "rgba(80,90,160,0.95)",
            "user-select": "none",
            cursor: props.wiringActive() ? "default" : "pointer",
            "box-shadow": "0 2px 6px rgba(50,60,90,0.08)",
            "z-index": 1,
            padding: "0 10px",
            "text-align": "center",
            "white-space": "nowrap",
            overflow: "hidden",
            "text-overflow": "ellipsis",
          }}
        >
          {props.live.transformId}
        </div>
      )}
    </Show>
  );
}

// ─── sub-components: EndpointBadges ───────────────────────────────────────

/**
 * Render a badge per `source`/`target` entry on this edge. Each badge is
 * anchored at its wire's connection point on the card side.
 */
function EndpointBadges(props: {
  live: LiveEdge;
  anchorForEndpoint: (url: string, side: "out" | "in") => Point | undefined;
}): JSX.Element {
  const sourceEntries = createMemo(() =>
    Object.entries(props.live.doc().source ?? {})
  );
  const targetEntries = createMemo(() =>
    Object.entries(props.live.doc().target ?? {})
  );

  return (
    <>
      <For each={sourceEntries()}>
        {([name, url]) => (
          <EndpointBadge
            pos={() => props.anchorForEndpoint(url, "out")}
            url={url}
            anchor="right"
            onCommit={(next) => props.live.edge.setSource(name, next)}
            onRemove={() => props.live.edge.removeSource(name)}
          />
        )}
      </For>
      <For each={targetEntries()}>
        {([name, url]) => (
          <EndpointBadge
            pos={() => props.anchorForEndpoint(url, "in")}
            url={url}
            anchor="left"
            onCommit={(next) => props.live.edge.setTarget(name, next)}
            onRemove={() => props.live.edge.removeTarget(name)}
          />
        )}
      </For>
    </>
  );
}

/**
 * Per-endpoint badge floating at a wire's connection point.
 * Idle:    tiny pill.
 * Hover:   the endpoint's path becomes readable.
 * Click (no drag): inline `<input>` for editing the path.
 * Alt+click:       detaches this endpoint from the edge.
 */
function EndpointBadge(props: {
  pos: () => Point | undefined;
  url: string;
  anchor: "left" | "right";
  onCommit: (next: HandleUrl) => void;
  onRemove: () => void;
}): JSX.Element {
  const [editing, setEditing] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [draft, setDraft] = createSignal(pathOfUrl(props.url));
  let inputEl: HTMLInputElement | undefined;

  const labelText = createMemo(() => pathOfUrl(props.url) || "(root)");
  const expanded = () => hovered() || editing();

  const startEdit = () => {
    setDraft(pathOfUrl(props.url));
    setEditing(true);
    queueMicrotask(() => inputEl?.focus());
  };

  const commit = () => {
    const id = docIdOf(props.url);
    if (!id) return setEditing(false);
    const next = draft().trim();
    const nextUrl = (next
      ? (`automerge:${id}/${next}` as AutomergeUrl)
      : (`automerge:${id}` as AutomergeUrl)) as HandleUrl;
    if (nextUrl !== props.url) props.onCommit(nextUrl);
    setEditing(false);
  };

  // Click vs drag — we don't initiate any drag from here, but the canvas-level
  // pointer handlers will treat movement-while-down as a drag, so we only
  // open the editor if the pointer didn't move.
  let downAt: { x: number; y: number } | null = null;
  const onDown = (ev: PointerEvent) => {
    ev.stopPropagation();
    downAt = { x: ev.clientX, y: ev.clientY };
  };
  const onUp = (ev: PointerEvent) => {
    if (!downAt) return;
    const dx = Math.abs(ev.clientX - downAt.x);
    const dy = Math.abs(ev.clientY - downAt.y);
    downAt = null;
    if (dx >= 4 || dy >= 4) return;
    ev.stopPropagation();
    if (ev.altKey) {
      props.onRemove();
      return;
    }
    if (!editing()) startEdit();
  };

  return (
    <Show when={props.pos()}>
      {(p) => (
        <div
          data-endpoint-badge="1"
          onPointerDown={onDown}
          onPointerUp={onUp}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={(ev) => ev.stopPropagation()}
          title={
            editing()
              ? ""
              : `${labelText()} (click to edit, alt+click to detach)`
          }
          style={{
            position: "absolute",
            left: `${p().x}px`,
            top: `${p().y}px`,
            transform:
              props.anchor === "right"
                ? "translate(0, -50%)"
                : "translate(-100%, -50%)",
            "z-index": 4,
            "pointer-events": "auto",
            display: "flex",
            "align-items": "center",
            padding: "1px 6px",
            "border-radius": "10px",
            background: expanded()
              ? "rgba(255,255,255,0.96)"
              : "rgba(120,140,255,0.85)",
            color: expanded() ? COLOR_INK : "white",
            border: "1px solid rgba(80,100,200,0.6)",
            "box-shadow": expanded()
              ? "0 1px 6px rgba(60,80,140,0.18)"
              : "0 1px 2px rgba(50,60,90,0.2)",
            "font-family": FONT_MONO,
            "font-size": "10px",
            "line-height": "1",
            cursor: editing() ? "text" : "pointer",
            "max-width": expanded() ? "200px" : "20px",
            "min-width": "10px",
            "min-height": "12px",
            overflow: "hidden",
            "white-space": "nowrap",
            "text-overflow": "ellipsis",
            transition: "max-width 0.12s ease, background 0.12s ease",
            "user-select": "none",
          }}
        >
          <Show
            when={editing()}
            fallback={
              <span
                style={{
                  "white-space": "nowrap",
                  overflow: "hidden",
                  "text-overflow": "ellipsis",
                }}
              >
                {expanded() ? labelText() : ""}
              </span>
            }
          >
            <input
              ref={inputEl}
              value={draft()}
              placeholder="(root)"
              onPointerDown={(ev) => ev.stopPropagation()}
              onInput={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              onBlur={commit}
              style={{
                font: "inherit",
                border: "none",
                outline: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                width: "160px",
                color: "inherit",
              }}
            />
          </Show>
        </div>
      )}
    </Show>
  );
}

// ─── sub-components: WiresLayer ───────────────────────────────────────────

function WiresLayer(props: {
  liveEdges: () => ReadonlyMap<AutomergeUrl, LiveEdge>;
  anchorForEndpoint: (url: string, side: "out" | "in") => Point | undefined;
  drag: () => DragOrigin | null;
  cursor: () => Point | null;
  onClickWire: (
    ev: MouseEvent,
    live: LiveEdge,
    side: "source" | "target",
    name: string
  ) => void;
}): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="4000"
      height="3000"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "4000px",
        height: "3000px",
        "pointer-events": "none",
        overflow: "visible",
      }}
    >
      <For each={[...props.liveEdges().values()]}>
        {(live) => <EdgeWires live={live} {...props} />}
      </For>
      <Show when={props.drag() && props.cursor()}>
        <path
          d={cubicPath(props.drag()!.origin, props.cursor()!)}
          stroke="rgba(120,140,255,0.85)"
          stroke-width="2"
          stroke-dasharray="4 3"
          fill="none"
        />
      </Show>
    </svg>
  );
}

function EdgeWires(props: {
  live: LiveEdge;
  anchorForEndpoint: (url: string, side: "out" | "in") => Point | undefined;
  onClickWire: (
    ev: MouseEvent,
    live: LiveEdge,
    side: "source" | "target",
    name: string
  ) => void;
}): JSX.Element {
  const sourceEntries = createMemo(() =>
    Object.entries(props.live.doc().source ?? {})
  );
  const targetEntries = createMemo(() =>
    Object.entries(props.live.doc().target ?? {})
  );
  const centroid = createMemo<Point | undefined>(() => {
    const pts: Point[] = [];
    for (const u of Object.values(props.live.doc().source ?? {})) {
      const p = props.anchorForEndpoint(u, "out");
      if (p) pts.push(p);
    }
    for (const u of Object.values(props.live.doc().target ?? {})) {
      const p = props.anchorForEndpoint(u, "in");
      if (p) pts.push(p);
    }
    if (pts.length === 0) return undefined;
    const xs = pts.map((p) => p.x);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
    };
  });

  return (
    <Show when={centroid()}>
      {(c) => (
        <>
          <For each={sourceEntries()}>
            {([name, url]) => {
              const a = createMemo(() => props.anchorForEndpoint(url, "out"));
              return (
                <Show when={a()}>
                  {(pt) => (
                    <Wire
                      from={pt()}
                      to={{ x: c().x - NODE_W / 2, y: c().y }}
                      onClick={(ev) =>
                        props.onClickWire(ev, props.live, "source", name)
                      }
                    />
                  )}
                </Show>
              );
            }}
          </For>
          <For each={targetEntries()}>
            {([name, url]) => {
              const b = createMemo(() => props.anchorForEndpoint(url, "in"));
              return (
                <Show when={b()}>
                  {(pt) => (
                    <Wire
                      from={{ x: c().x + NODE_W / 2, y: c().y }}
                      to={pt()}
                      onClick={(ev) =>
                        props.onClickWire(ev, props.live, "target", name)
                      }
                    />
                  )}
                </Show>
              );
            }}
          </For>
        </>
      )}
    </Show>
  );
}

function Wire(props: {
  from: Point;
  to: Point;
  onClick: (ev: MouseEvent) => void;
}): JSX.Element {
  const d = createMemo(() => cubicPath(props.from, props.to));
  return (
    <>
      <path
        d={d()}
        stroke={COLOR_ACCENT}
        stroke-width="2"
        fill="none"
        data-wire="1"
      />
      <path
        d={d()}
        stroke="rgba(0,0,0,0)"
        stroke-width="16"
        fill="none"
        data-wire="1"
        style={{ cursor: "pointer", "pointer-events": "auto" }}
        onClick={(ev) => props.onClick(ev)}
      />
    </>
  );
}

// ─── sub-components: Inspector ────────────────────────────────────────────

function Inspector(props: {
  live: () => LiveEdge;
  position: () => Point;
  elementRect: () => DOMRect;
  onTransform: (tid: string) => void;
  onRemoveEdge: () => void;
  onClose: () => void;
}): JSX.Element {
  const sourceNames = createMemo(() =>
    Object.keys(props.live().doc().source ?? {})
  );
  const targetNames = createMemo(() =>
    Object.keys(props.live().doc().target ?? {})
  );

  return (
    <div
      data-inspector="1"
      style={{
        position: "absolute",
        "z-index": 10,
        background: "white",
        border: "1px solid rgba(120,140,200,0.4)",
        "border-radius": "8px",
        "box-shadow": "0 4px 16px rgba(60,80,140,0.18)",
        padding: "10px",
        "font-size": "11px",
        "min-width": "260px",
        "max-width": "320px",
        left: `${props.position().x - props.elementRect().left + 10}px`,
        top: `${props.position().y - props.elementRect().top + 10}px`,
      }}
    >
      <div
        style={{
          "font-weight": 600,
          "margin-bottom": "8px",
          color: COLOR_INK,
        }}
      >
        Edge {shortUrl(props.live().url)}
      </div>

      <RowLabel>Transform</RowLabel>
      <select
        value={props.live().transformId}
        onChange={(e) => props.onTransform(e.currentTarget.value)}
        style={{
          "font-size": "11px",
          padding: "2px 4px",
          "border-radius": "4px",
          border: "1px solid rgba(120,140,200,0.4)",
          width: "100%",
        }}
      >
        <For each={TRANSFORM_IDS}>
          {(id) => <option value={id}>{id}</option>}
        </For>
      </select>

      <RowLabel>
        Sources ({sourceNames().length}) · Targets ({targetNames().length})
      </RowLabel>
      <div
        style={{
          "font-family": FONT_MONO,
          "font-size": "10px",
          color: "rgba(60,70,100,0.7)",
          "line-height": 1.4,
        }}
      >
        Hover the badges on the canvas to inspect each endpoint. Click to edit
        a path; alt+click to detach.
      </div>

      <button
        onClick={() => props.onRemoveEdge()}
        style={{
          "margin-top": "12px",
          "font-size": "11px",
          padding: "4px 8px",
          "border-radius": "4px",
          border: "1px solid rgba(180,80,80,0.5)",
          background: "transparent",
          color: "rgba(180,80,80,0.9)",
          cursor: "pointer",
          width: "100%",
        }}
      >
        remove wire
      </button>
    </div>
  );
}

function RowLabel(props: { children: JSX.Element }): JSX.Element {
  return (
    <div
      style={{
        "font-size": "10px",
        "text-transform": "uppercase",
        "letter-spacing": "0.04em",
        color: "rgba(0,0,0,0.5)",
        margin: "10px 0 4px",
      }}
    >
      {props.children}
    </div>
  );
}
