/**
 * Folder tool: side-by-side two-pane preview wired by a single EdgeHandle.
 *
 * Demonstrates the simplest possible wired-system in this design:
 * one source ref, one target ref, one transform attached locally. The
 * persisted edge URL on the folder doc is the bridge across mounts.
 */

import type { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  Plugin,
  Tool,
  ToolElement,
} from "@inkandswitch/patchwork-plugins";
import type {
  FolderDoc,
  DocLink,
} from "@inkandswitch/patchwork-filesystem";
import {
  createEdgeHandle,
  findEdgeHandle,
  type EdgeHandle,
} from "@inkandswitch/edge-handles";
import * as patterns from "./patterns/index.js";

interface EdgePairConfig {
  edgeUrl?: AutomergeUrl;
  transformId?: string;
}
type FolderDocWithEdgePair = FolderDoc & { edgePair?: EdgePairConfig };

/**
 * The local transform table. Each entry is a name -> attach function.
 * This is intentionally tool-private — the package doesn't ship a registry,
 * so consumers choose what their tool exposes.
 */
const TRANSFORMS: Record<string, (edge: EdgeHandle<any>) => () => void> = {
  identity: patterns.identity,
  "text/upper": patterns.upper,
  "text/lower": patterns.lower,
  "text/slugify": patterns.slugify,
  "text/markdown-to-html": patterns.markdownToHtml,
  "color/srgb-to-oklch": patterns.srgbToOklch,
  "color/oklch-to-srgb": patterns.oklchToSrgb,
  "text/template": patterns.template("${a} ${b}"),
};

interface PaneState {
  link: DocLink | null;
  field: string;
  handle: DocHandle<any> | null;
}

function renderEdgePair(
  handle: DocHandle<FolderDocWithEdgePair>,
  element: ToolElement
): () => void {
  const repo: Repo = element.repo;

  element.style.cssText = `
    display: grid;
    grid-template-rows: auto 1fr;
    width: 100%;
    height: 100%;
    background: var(--color-base-100, #fafbfd);
  `;

  // ─ toolbar ────────────────────────────────────────────────────────────────
  const toolbar = document.createElement("div");
  toolbar.style.cssText = `
    display:flex;flex-wrap:wrap;align-items:center;gap:6px;
    padding:6px 10px;border-bottom:1px solid rgba(120,140,200,0.18);
    font-size:12px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  `;
  element.appendChild(toolbar);

  const heading = document.createElement("span");
  heading.textContent = "edge-pair";
  heading.style.cssText =
    "font-weight:600;margin-right:8px;color:rgba(80,90,160,0.85);";
  toolbar.appendChild(heading);

  const sourceLabel = makeLabel("source");
  toolbar.appendChild(sourceLabel);
  const sourceField = makeFieldInput("content");
  toolbar.appendChild(sourceField);

  toolbar.appendChild(arrow());
  const transformSelect = document.createElement("select");
  transformSelect.style.cssText = selectStyle();
  for (const id of Object.keys(TRANSFORMS).sort()) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = id;
    transformSelect.appendChild(opt);
  }
  toolbar.appendChild(transformSelect);
  toolbar.appendChild(arrow());

  toolbar.appendChild(makeLabel("sink"));
  const sinkField = makeFieldInput("content");
  toolbar.appendChild(sinkField);

  const swapBtn = makeButton("swap", () => swap());
  toolbar.appendChild(swapBtn);

  const status = document.createElement("span");
  status.style.cssText = `
    margin-left:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    font-size:10px;opacity:0.55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:50%;
  `;
  toolbar.appendChild(status);

  // ─ panes ──────────────────────────────────────────────────────────────────
  const split = document.createElement("div");
  split.style.cssText = `
    display:grid;grid-template-columns:1fr 1fr;gap:1px;min-height:0;
    background:rgba(120,140,200,0.18);
  `;
  element.appendChild(split);

  const sourcePane = makePane("Source");
  const sinkPane = makePane("Sink");
  split.appendChild(sourcePane.wrap);
  split.appendChild(sinkPane.wrap);

  // ─ state ──────────────────────────────────────────────────────────────────
  const sourceState: PaneState = { link: null, handle: null, field: "content" };
  const sinkState: PaneState = { link: null, handle: null, field: "content" };

  let edge: EdgeHandle<unknown> | null = null;
  let detach: (() => void) | null = null;
  let transformId =
    handle.doc()?.edgePair?.transformId ??
    (Object.keys(TRANSFORMS).includes("identity") ? "identity" : Object.keys(TRANSFORMS)[0]);
  transformSelect.value = transformId;

  let cancelled = false;
  let setupGen = 0;

  // ─ wiring lifecycle ───────────────────────────────────────────────────────
  const teardown = () => {
    detach?.();
    detach = null;
    edge?.destroy();
    edge = null;
  };

  const reconcile = async () => {
    teardown();
    const gen = ++setupGen;
    if (!sourceState.handle || !sinkState.handle) {
      status.textContent = "edge: pick a source + sink";
      return;
    }
    const sourceRef = sourceState.handle.sub(sourceState.field);
    const targetRef = sinkState.handle.sub(sinkState.field);
    try {
      const persistedUrl = handle.doc()?.edgePair?.edgeUrl;
      let next: EdgeHandle<unknown>;
      if (persistedUrl) {
        try {
          next = await findEdgeHandle(repo, persistedUrl);
          next.setSource("src", sourceRef);
          next.setTarget("sink", targetRef);
        } catch {
          // edge doc missing/invalid; fall through to create
          next = await createEdgeHandle(repo, {
            source: { src: sourceRef },
            target: { sink: targetRef },
          });
          handle.change((d) => {
            if (!d.edgePair) d.edgePair = {};
            d.edgePair.edgeUrl = next.url;
          });
        }
      } else {
        next = await createEdgeHandle(repo, {
          source: { src: sourceRef },
          target: { sink: targetRef },
        });
        handle.change((d) => {
          if (!d.edgePair) d.edgePair = {};
          d.edgePair.edgeUrl = next.url;
        });
      }
      if (cancelled || gen !== setupGen) {
        next.destroy();
        return;
      }
      edge = next;
      const attach = TRANSFORMS[transformId];
      detach = attach ? attach(edge) : null;
      status.textContent = `edge: ${shortUrl(edge.url)} · transform: ${transformId}`;
    } catch (err) {
      status.textContent = `edge error: ${(err as Error).message}`;
      console.error("[edge-pair] reconcile failed", err);
    }
  };

  const ensureHandle = async (s: PaneState) => {
    if (!s.link) {
      s.handle = null;
      return;
    }
    if (s.handle && s.handle.url === s.link.url) return;
    s.handle = await repo.find(s.link.url);
    await s.handle.whenReady();
  };

  const refreshAll = async () => {
    await Promise.all([ensureHandle(sourceState), ensureHandle(sinkState)]);
    await reconcile();
  };

  // ─ initial pick ───────────────────────────────────────────────────────────
  const pickInitial = () => {
    const links = handle.doc()?.docs ?? [];
    const candidates = links.filter((l) => l.type !== "folder");
    if (candidates[0]) {
      sourceState.link = candidates[0];
      sourcePane.setLink(candidates[0]);
    }
    if (candidates[1]) {
      sinkState.link = candidates[1];
      sinkPane.setLink(candidates[1]);
    }
  };
  pickInitial();
  void refreshAll();

  const onFolderChange = () => {
    if (!sourceState.link || !sinkState.link) {
      pickInitial();
      void refreshAll();
    }
  };
  handle.on("change", onFolderChange);

  // ─ user input ─────────────────────────────────────────────────────────────
  sourceField.addEventListener("input", () => {
    sourceState.field = sourceField.value || "content";
    void reconcile();
  });
  sinkField.addEventListener("input", () => {
    sinkState.field = sinkField.value || "content";
    void reconcile();
  });
  transformSelect.addEventListener("change", () => {
    transformId = transformSelect.value;
    handle.change((d) => {
      if (!d.edgePair) d.edgePair = {};
      d.edgePair.transformId = transformId;
    });
    void reconcile();
  });
  function swap() {
    const tmp = { ...sourceState };
    Object.assign(sourceState, sinkState);
    Object.assign(sinkState, tmp);
    sourceField.value = sourceState.field;
    sinkField.value = sinkState.field;
    if (sourceState.link) sourcePane.setLink(sourceState.link);
    if (sinkState.link) sinkPane.setLink(sinkState.link);
    void reconcile();
  }

  // ─ cleanup ────────────────────────────────────────────────────────────────
  return () => {
    cancelled = true;
    handle.off("change", onFolderChange);
    teardown();
    element.replaceChildren();
    element.style.cssText = "";
  };
}

// ─── DOM helpers ───────────────────────────────────────────────────────────

function makePane(label: string) {
  const wrap = document.createElement("div");
  wrap.style.cssText = `
    display:flex;flex-direction:column;min-width:0;min-height:0;
    background:var(--color-base-100,#fff);
  `;
  const heading = document.createElement("div");
  heading.style.cssText = `
    padding:4px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.04em;
    color:rgba(0,0,0,0.5);border-bottom:1px solid rgba(120,140,200,0.18);
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  `;
  heading.textContent = `${label} · (no doc)`;
  wrap.appendChild(heading);
  const view = document.createElement("patchwork-view");
  (view as HTMLElement).style.cssText = "flex:1;min-height:0;min-width:0;display:flex;";
  wrap.appendChild(view);
  return {
    wrap,
    setLink(link: DocLink) {
      heading.textContent = `${label} · ${link.name} (${link.type})`;
      view.setAttribute("doc-url", link.url);
    },
  };
}

function makeFieldInput(initial: string) {
  const input = document.createElement("input");
  input.value = initial;
  input.size = 8;
  input.style.cssText = `
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;
    padding:2px 6px;border:1px solid rgba(120,140,200,0.4);border-radius:4px;
    background:transparent;color:inherit;width:9ch;
  `;
  return input;
}

function makeLabel(text: string) {
  const s = document.createElement("span");
  s.textContent = text;
  s.style.opacity = "0.6";
  return s;
}

function makeButton(text: string, onClick: () => void) {
  const b = document.createElement("button");
  b.textContent = text;
  b.style.cssText = `
    font-size:11px;padding:2px 8px;border-radius:4px;
    border:1px solid rgba(120,140,200,0.4);background:transparent;color:inherit;
    cursor:pointer;margin-left:4px;
  `;
  b.addEventListener("click", onClick);
  return b;
}

function selectStyle() {
  return `
    font-size:11px;padding:2px 4px;border-radius:4px;
    border:1px solid rgba(120,140,255,0.4);background:transparent;color:inherit;
  `;
}

function arrow() {
  const a = document.createElement("span");
  a.textContent = "→";
  a.style.cssText = "opacity:0.45;padding:0 2px;";
  return a;
}

function shortUrl(url: string) {
  if (url.length <= 20) return url;
  return `${url.slice(0, 12)}…${url.slice(-6)}`;
}

// ─── Plugin registration ───────────────────────────────────────────────────

export const edgePairPlugins: Plugin<any>[] = [
  {
    type: "patchwork:tool",
    id: "edge-pair",
    name: "Edge Pair",
    icon: "Cable",
    supportedDatatypes: ["folder"],
    async load() {
      return renderEdgePair;
    },
  } satisfies Tool<FolderDocWithEdgePair>,
];
