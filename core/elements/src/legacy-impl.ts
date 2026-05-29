import {
  type AutomergeUrl,
  type DocHandle,
  type DocHandleChangePayload,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getType,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getRegistry,
  isLoadablePlugin,
  type LoadedTool,
  type ToolElement,
} from "@inkandswitch/patchwork-plugins";
import { request } from "@inkandswitch/patchwork-providers";
import debug from "debug";
import {
  docIdFromAutomergeUrl,
  type initializeAutomergeRepoKeyhive,
} from "@automerge/automerge-repo-keyhive";
import { MountedEvent, NoToolEvent, UnmountedEvent } from "./events.js";

const log = debug("patchwork:elements:legacy");

type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeAutomergeRepoKeyhive>
>;

const State = {
  none: "none",
  initializing: "initializing",
  rendering: "rendering",
  unable: "unable",
  rendered: "rendered",
  fallback: "fallback",
  error: "error",
} as const;

type State = (typeof State)[keyof typeof State];

const ATTRS = {
  docUrl: "doc-url",
  toolId: "tool-id",
} as const;

export const LEGACY_OBSERVED_ATTRIBUTES = [
  ATTRS.docUrl,
  ATTRS.toolId,
] as const;

export type LegacyImplParams = {
  hive?: AutomergeRepoKeyhive;
  /** Element name used in error messages */
  hostName?: string;
};

type HostElement = HTMLElement & {
  repo?: Repo;
  hive?: AutomergeRepoKeyhive;
};

/**
 * `doc-url`/`tool-id`-driven legacy view behavior, hosted on a
 * `<patchwork-view>` in legacy mode. The view is the rendering surface
 * itself (not a wrapper around a child element) so that events
 * dispatched on `<patchwork-view>` and listeners attached by the
 * mounted tool land on the same DOM node.
 *
 * Lifecycle methods mirror the custom-element callbacks the host needs
 * to forward into the impl.
 */
export class LegacyImpl {
  #element: HostElement;
  #hostName: string;
  #docUrl: AutomergeUrl | null = null;
  #toolId: string | null = null;
  #handle: DocHandle<HasPatchworkMetadata> | null = null;
  #tool: LoadedTool | null = null;
  #state: State = State.none;
  #requestedToolImports = new Set<string>();
  #initEpoch = 0;
  #capturedParent: Element | null = null;
  #fallbackId: string | undefined;
  #teardowns = new Set<() => unknown | Promise<void>>();
  #keyhiveRetrySetup = false;
  #handlingKeyhiveSync = false;
  #pendingKeyhiveSync = false;
  #unableNoAccess = false;

  constructor(element: HTMLElement, params: LegacyImplParams = {}) {
    this.#element = element as HostElement;
    this.#hostName = params.hostName ?? element.tagName.toLowerCase();
    this.#element.hive = params.hive;
  }

  get docUrl(): AutomergeUrl | null {
    return this.#docUrl;
  }

  set docUrl(url: AutomergeUrl | null) {
    if (this.#docUrl === url) return;
    this.#docUrl = url;
    const attr = this.#element.getAttribute(ATTRS.docUrl);
    if (attr == url) return;
    if (url) this.#element.setAttribute(ATTRS.docUrl, url);
    else this.#element.removeAttribute(ATTRS.docUrl);
  }

  get toolId(): string | null {
    return this.#toolId;
  }

  set toolId(id: string | null) {
    if (this.#toolId === id) return;
    this.#toolId = id;
    const attr = this.#element.getAttribute(ATTRS.toolId);
    if (attr == id) return;
    if (id) this.#element.setAttribute(ATTRS.toolId, id);
    else this.#element.removeAttribute(ATTRS.toolId);
  }

  connectedCallback(): void {
    this.#capturedParent = this.#element.parentElement;
    this.#docUrl = this.#element.getAttribute(
      ATTRS.docUrl
    ) as AutomergeUrl | null;
    this.#toolId = this.#element.getAttribute(ATTRS.toolId);
    void this.#init();
  }

  disconnectedCallback(): Promise<void> {
    return this.#teardown();
  }

  connectedMoveCallback(): void {
    this.#capturedParent = this.#element.parentElement;
  }

  attributeChangedCallback(
    name: string,
    old: string | null,
    val: string | null
  ): void {
    if (old === val) return;
    if (name === ATTRS.toolId) {
      this.#toolId = val;
      void this.#teardown().then(() => this.#init());
    }
    if (name === ATTRS.docUrl) {
      this.#docUrl = val as AutomergeUrl;
      void this.#teardown().then(() => this.#init());
    }
  }

  #onDocChange = (payload: DocHandleChangePayload<HasPatchworkMetadata>) => {
    const { before, after } = payload.patchInfo;
    if (getType(before) != getType(after)) {
      void this.#teardown().then(() => this.#init());
    }
  };

  #init = async () => {
    const toolRegistry = getRegistry("patchwork:tool");
    if (this.#state != State.none) return;
    if (!this.#docUrl) return;

    const epoch = ++this.#initEpoch;
    this.#state = State.initializing;

    if (this.#element.hive && this.#docUrl) {
      let isKeyhiveDoc = false;
      try {
        docIdFromAutomergeUrl(this.#docUrl);
        isKeyhiveDoc = true;
      } catch {
        // Legacy (padded-zero) doc: skip keyhive gate
      }

      if (isKeyhiveDoc) {
        const bestAccess = await this.#element.hive.bestAccessForDoc(
          this.#element.hive.active.individual.id,
          this.#docUrl
        );
        const accessLevel = bestAccess ? bestAccess.toString() : "None";

        if (accessLevel === "None") {
          this.#state = State.unable;
          this.#unableNoAccess = true;

          if (!this.#keyhiveRetrySetup) {
            this.#keyhiveRetrySetup = true;
            const onKeyhiveSync = () => this.#handleKeyhiveSync();
            (this.#element.hive.networkAdapter as any).on("ingest-remote", onKeyhiveSync);
            this.#teardowns.add(() => {
              (this.#element.hive!.networkAdapter as any).off("ingest-remote", onKeyhiveSync);
            });
          }
          return;
        }
      }

      if (!this.#keyhiveRetrySetup) {
        this.#keyhiveRetrySetup = true;
        const onKeyhiveSync = () => this.#handleKeyhiveSync();
        (this.#element.hive.networkAdapter as any).on("ingest-remote", onKeyhiveSync);
        this.#teardowns.add(() => {
          (this.#element.hive!.networkAdapter as any).off("ingest-remote", onKeyhiveSync);
        });
      }
    }

    if (epoch !== this.#initEpoch) return;

    const removeAddedListener = toolRegistry.on(
      "registered",
      async (addedTool) => {
        const toolId = addedTool.id;
        const isChosenTool = toolId == this.#toolId;
        if (this.#handle) {
          this.#fallbackId = getFallbackTool(this.#handle.doc())?.id;
        }
        const isFallbackTool = toolId == this.#fallbackId;
        if (isChosenTool || isFallbackTool) {
          if (isLoadablePlugin(addedTool)) {
            toolRegistry.load(addedTool.id);
          }
        }
      }
    );

    const removeLoadedListener = toolRegistry.on(
      "loaded",
      async (loadedTool) => {
        const toolId = loadedTool.id;
        const isChosenTool = toolId == this.#toolId;
        const isFallbackTool = toolId == this.#fallbackId;
        if (isChosenTool || isFallbackTool) {
          if (this.#state == "unable" || this.#state == "initializing") {
            this.#queueRender();
          }
          if (
            ((this.#state == "error" || this.#state == "rendered") &&
              isChosenTool) ||
            (this.#state == "fallback" && isFallbackTool)
          ) {
            if (loadedTool.importUrl !== this.#tool?.importUrl) {
              await this.#teardown();
              void this.#init();
            }
          }
        }
      }
    );

    this.#teardowns.add(() => {
      removeAddedListener();
      removeLoadedListener();
    });

    const repo = await request<Repo>(this.#element, "patchwork:repo");
    if (epoch !== this.#initEpoch) return;
    if (!repo) {
      this.#state = State.unable;
      this.#displayError(
        `no \`patchwork:repo\` provider in the DOM ancestry of <${this.#hostName}>.`
      );
      return;
    }
    this.#element.repo = repo;

    let handle: DocHandle<HasPatchworkMetadata>;
    try {
      handle = await repo.find<HasPatchworkMetadata>(this.#docUrl!);
    } catch (err) {
      if (epoch !== this.#initEpoch) return;
      throw err;
    }

    if (epoch !== this.#initEpoch) return;

    this.#handle = handle;
    this.#handle.on("change", this.#onDocChange);
    this.#teardowns.add(() => this.#handle!.off("change", this.#onDocChange));

    this.#queueRender();
  };

  async #teardown(): Promise<void> {
    if (this.#state == State.none) return;

    // Capture the mount-event payload (if any) before clearing state,
    // so the unmount echoes the same {url, toolId} we dispatched at
    // mount. `rendered`/`fallback` are exactly the states in which
    // `#render` dispatched a MountedEvent (it sets `#tool` only after
    // the tool's module call succeeds).
    const wasMounted =
      this.#state == State.rendered || this.#state == State.fallback;
    const mountedUrl = this.#handle?.url;
    const mountedToolId = this.#tool?.id;

    this.#initEpoch++;

    for (const fn of this.#teardowns) {
      await fn?.();
    }

    this.#teardowns.clear();
    this.#keyhiveRetrySetup = false;
    this.#unableNoAccess = false;
    this.#handle = null;
    this.#tool = null;
    this.#requestedToolImports.clear();
    this.#element.textContent = "";
    this.#state = State.none;

    if (wasMounted && mountedUrl && mountedToolId) {
      this.#dispatchUnmount(
        new UnmountedEvent({ url: mountedUrl, toolId: mountedToolId })
      );
    }
  }

  // Detached elements have no parent path, so `bubbles: true` is a
  // no-op; fall back to the closest still-connected ancestor.
  #dispatchUnmount(event: UnmountedEvent): void {
    if (this.#element.isConnected) {
      this.#element.dispatchEvent(event);
      return;
    }
    let node: Element | null = this.#capturedParent;
    while (node && !node.isConnected) node = node.parentElement;
    if (node) node.dispatchEvent(event);
  }

  async #clearDocCache(): Promise<void> {
    if (!this.#docUrl || !this.#element.repo) return;

    const retryingDocs = (globalThis as any).__patchwork_retrying_docs ??= new Set<string>();
    if (retryingDocs.has(this.#docUrl)) return;

    retryingDocs.add(this.#docUrl);
    try {
      const documentId = String(docIdFromAutomergeUrl(this.#docUrl));
      const handle = (this.#element.repo.handles as any)[documentId];
      if (handle && handle.state === "unavailable") {
        this.#element.repo.delete(this.#docUrl);
      }
    } catch {
      // Ignore delete errors
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    retryingDocs.delete(this.#docUrl);
  }

  async #handleKeyhiveSync(): Promise<void> {
    if (!this.#docUrl || !this.#element.hive) return;

    if (this.#handlingKeyhiveSync) {
      this.#pendingKeyhiveSync = true;
      return;
    }
    this.#handlingKeyhiveSync = true;
    this.#pendingKeyhiveSync = false;

    try {
      let hasAccess = false;
      let accessCheckSucceeded = false;
      try {
        docIdFromAutomergeUrl(this.#docUrl);
        const bestAccess = await this.#element.hive.bestAccessForDoc(
          this.#element.hive.active.individual.id,
          this.#docUrl
        );
        hasAccess = !!bestAccess;
        accessCheckSucceeded = true;
      } catch {
        return;
      }

      const isDisplayed =
        this.#state === State.rendered || this.#state === State.fallback;
      const isUnable = this.#state === State.unable;

      if (hasAccess && isUnable && this.#unableNoAccess) {
        await this.#clearDocCache();
        await this.#teardown();
        void this.#init();
      } else if (!hasAccess && isDisplayed && accessCheckSucceeded) {
        await this.#clearDocCache();
        await this.#teardown();
        void this.#init();
      }
    } finally {
      this.#handlingKeyhiveSync = false;
      if (this.#pendingKeyhiveSync) {
        this.#handleKeyhiveSync();
      }
    }
  }

  #queueRender(): void {
    if (this.#state == "none") return;
    if (this.#state == "rendering") return;
    this.#state = "rendering";
    queueMicrotask(() => this.#render());
  }

  #render(): void {
    if (this.#state != "rendering") return;
    if (!this.#docUrl || !this.#handle) {
      this.#state = "unable";
      return;
    }

    this.#resetDisplay();

    const doc = this.#handle.doc();
    this.#fallbackId = getFallbackTool(doc)?.id;
    const fallingBack = !this.#toolId;
    const toolId = this.#toolId || this.#fallbackId;

    if (fallingBack) {
      console.warn(`falling back to default tool for ${this.#docUrl}`);
    }

    if (!toolId) {
      this.#state = "unable";
      const hasPatchworkMetadata = doc && "@patchwork" in doc;
      if (!hasPatchworkMetadata) {
        console.warn(
          `Document ${this.#docUrl} is missing @patchwork metadata`
        );
        this.#displayError(
          `This document is missing @patchwork metadata and cannot be opened.`
        );
      } else {
        console.warn(`no tool for ${this.#docUrl}`);
        this.#displayError(`I couldn't find a tool to open ${this.#docUrl}.`);
      }
      return;
    }

    this.#tool =
      getRegistry<LoadedTool>("patchwork:tool").get(toolId) ?? null;

    if (!this.#tool) {
      this.#notool();
    }

    if (!this.#tool) {
      this.#state = "unable";
      this.#displayError(`I couldn't find the tool with id ${toolId}.`);
      return;
    }

    if (!this.#tool.module) {
      const toolRegistry = getRegistry("patchwork:tool");
      toolRegistry.load(this.#tool.id);
      if (toolRegistry.isLoading(this.#tool.id)) {
        this.#state = "unable";
        log(`loading ${toolId}`);
        this.#displayLoading(toolId);
      } else {
        this.#state = "unable";
        this.#displayError(`I couldn't load the tool with id ${toolId}.`);
      }
      return;
    }

    try {
      // `#init` set `this.#element.repo` before reaching `#queueRender`, so
      // the host now satisfies `ToolElement`'s non-optional `repo`.
      const cleanup = this.#tool.module(
        this.#handle,
        this.#element as ToolElement
      );
      if (typeof cleanup === "function") {
        this.#teardowns.add(cleanup);
      } else {
        console.warn(`return a cleanup function from ${toolId}`);
      }
      this.#state = fallingBack ? "fallback" : "rendered";
      this.#element.dispatchEvent(
        new MountedEvent({ url: this.#docUrl, toolId })
      );
    } catch (error) {
      this.#element.append(
        Object.assign(document.createElement("div"), {
          innerHTML: /* html */ `
            <p>oh no!</p>
            <details>
              <summary>${(error as Error).message ?? error}</summary>
              <pre style="white-space: pre-wrap;">${(error as Error).stack ?? ""}</pre>
            </details>
          `,
        })
      );
      console.error(error);
      this.#state = "error";
    }
  }

  #displayLoading = (toolId: string) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.height = "100%";
    div.innerHTML = /* html */ `
      <style>
        @keyframes pw-loading-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div style="
          width: 24px;
          height: 24px;
          border: 3px solid #e0e0e0;
          border-top-color: #888;
          border-radius: 50%;
          animation: pw-loading-spin 0.8s linear infinite;
        "></div>
        <div style="font-size: 12px; color: #888;">loading ${toolId}</div>
      </div>
    `;
    this.#element.append(div);
  };

  #displayError = (error: string) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.transition = "opacity 2s linear 2s";
    div.style.opacity = "0";
    div.innerHTML = /* html */ `
      <details style="display: flex"><summary></summary><pre style="white-space: pre-wrap;"><code>${error}</code></pre></details>
    `;
    this.#element.append(div);
    setTimeout(() => {
      div.style.opacity = "1";
    });
  };

  #notool(): void {
    if (!this.#docUrl || !this.#handle) return;
    const suggestedImportUrl =
      this.#handle.doc()?.["@patchwork"]?.suggestedImportUrl;
    if (
      !suggestedImportUrl ||
      this.#requestedToolImports.has(suggestedImportUrl)
    ) {
      return;
    }
    this.#requestedToolImports.add(suggestedImportUrl);

    log("dispatching patchwork:no-tool for", this.#docUrl);
    this.#element.dispatchEvent(new NoToolEvent({ url: this.#docUrl }));
  }

  #resetDisplay = () => {
    this.#element.replaceChildren();
    this.#element.style.alignItems = "";
    this.#element.style.justifyContent = "";
  };
}
