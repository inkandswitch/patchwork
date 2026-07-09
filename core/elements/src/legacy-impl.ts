import {
  type AutomergeUrl,
  type DocHandle,
  type DocHandleChangePayload,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getSuggestedImportUrl,
  getType,
  importModuleFromHttpUrl,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getRegistry,
  isLoadablePlugin,
  registerPlugins,
  type LoadedTool,
  type ToolElement,
} from "@inkandswitch/patchwork-plugins";
import debug from "debug";
import {
  docIdFromAutomergeUrl,
  type initializeAutomergeRepoKeyhive,
} from "@automerge/automerge-repo-keyhive";
import { MountedEvent, UnmountedEvent } from "./events.js";

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

export const LEGACY_OBSERVED_ATTRIBUTES = [ATTRS.docUrl, ATTRS.toolId] as const;

export type LegacyImplParams = {
  /**
   * Repo used to resolve the primary doc handle. This is the
   * `<patchwork-view>`'s overlay shim, so the handle the tool receives is
   * remapped (e.g. to a draft clone) when a remapper answers
   * `repo:handle-descriptor`.
   */
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
  /** Element name used in error messages */
  hostName?: string;
};

type HostElement = HTMLElement & {
  repo?: Repo;
  hive?: AutomergeRepoKeyhive;
};

/**
 * `doc-url`/`tool-id`-driven legacy view behavior for `<patchwork-view>`. The
 * tool renders into an inner `.patchwork-view-content` element (the only thing
 * wiped on re-render); the host stays the identity/event node, leaving safe
 * sibling space for augmentations a tool's re-render can't trample.
 */
export class LegacyImpl {
  #element: HostElement;
  #content: HostElement;
  #repo: Repo;
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

  constructor(element: HTMLElement, params: LegacyImplParams) {
    this.#element = element as HostElement;
    this.#repo = params.repo;
    this.#element.hive = params.hive;

    // `height: 100%` makes the wrapper fill the host so tools that size/measure
    // their root element see the host's box (the wrapper carries the
    // `repo`/`hive` surface tools read off the element they're handed).
    this.#content = document.createElement("div") as HostElement;
    this.#content.className = "patchwork-view-content";
    this.#content.style.width = "100%";
    this.#content.style.height = "100%";
    this.#content.hive = params.hive;
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
    this.#element.appendChild(this.#content);
    this.#docUrl = this.#element.getAttribute(
      ATTRS.docUrl
    ) as AutomergeUrl | null;
    this.#toolId = this.#element.getAttribute(ATTRS.toolId);
    void this.#init();
  }

  async disconnectedCallback(): Promise<void> {
    await this.#teardown();
    this.#content.remove();
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
            (this.#element.hive.networkAdapter as any).on(
              "ingest-remote",
              onKeyhiveSync
            );
            this.#teardowns.add(() => {
              (this.#element.hive!.networkAdapter as any).off(
                "ingest-remote",
                onKeyhiveSync
              );
            });
          }
          return;
        }
      }

      if (!this.#keyhiveRetrySetup) {
        this.#keyhiveRetrySetup = true;
        const onKeyhiveSync = () => this.#handleKeyhiveSync();
        (this.#element.hive.networkAdapter as any).on(
          "ingest-remote",
          onKeyhiveSync
        );
        this.#teardowns.add(() => {
          (this.#element.hive!.networkAdapter as any).off(
            "ingest-remote",
            onKeyhiveSync
          );
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

    const repo = this.#repo;
    this.#element.repo = repo;
    this.#content.repo = repo;

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
    this.#content.textContent = "";
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

    const retryingDocs = ((globalThis as any).__patchwork_retrying_docs ??=
      new Set<string>());
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

    await new Promise((resolve) => setTimeout(resolve, 300));
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
      // The doc's datatype has no registered tool and no explicit tool was
      // requested. If the doc points at a module to import, kick that off and
      // wait — the registry listeners re-render once it registers a supporting
      // tool. Otherwise there's genuinely nothing to open.
      if (this.#notool()) {
        this.#displayLoading("");
        return;
      }
      const hasPatchworkMetadata = doc && "@patchwork" in doc;
      if (!hasPatchworkMetadata) {
        console.warn(`Document ${this.#docUrl} is missing @patchwork metadata`);
        this.#displayError(
          `This document is missing @patchwork metadata and cannot be opened.`
        );
      } else {
        console.warn(`no tool for ${this.#docUrl}`);
        this.#displayError(`I couldn't find a tool to open ${this.#docUrl}.`);
      }
      return;
    }

    this.#tool = getRegistry<LoadedTool>("patchwork:tool").get(toolId) ?? null;

    if (!this.#tool) {
      this.#state = "unable";
      // The requested tool isn't loaded. If the doc suggests a module to import
      // it from, wait for that; otherwise there's nothing more to try.
      if (this.#notool()) {
        this.#displayLoading(toolId);
      } else {
        this.#displayError(`I couldn't find the tool with id ${toolId}.`);
      }
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
      // `#init` set the content element's `repo` before reaching `#queueRender`,
      // so it satisfies `ToolElement`'s non-optional `repo`.
      const cleanup = this.#tool.module(
        this.#handle,
        this.#content as ToolElement
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
      this.#content.append(
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

  #displayLoading = (_toolId: string) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.height = "100%";
    div.style.opacity = "0";
    div.style.transition = "opacity 0.8s ease-in";
    div.innerHTML = /* html */ `
      <style>
        @keyframes pw-loading-pulse {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
      </style>
      <div style="
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #888;
        animation: pw-loading-pulse 2s ease-in-out infinite;
      "></div>
    `;
    this.#content.append(div);
    const timer = setTimeout(() => {
      div.style.opacity = "1";
    }, 2000);
    this.#teardowns.add(() => clearTimeout(timer));
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
    this.#content.append(div);
    setTimeout(() => {
      div.style.opacity = "1";
    });
  };

  /**
   * When no tool is available for the current doc, import the module the doc
   * suggests (its `suggestedImportUrl`) and register its plugins, so the tool
   * registry gains a supporting tool and this view's registry listeners
   * re-render. Returns whether an import was kicked off, so the caller can show
   * a loading state instead of an error while the module loads.
   *
   * The import runs in this element's own realm rather than being delegated to
   * a single top-level handler, so a `<patchwork-view>` nested in an embedded
   * context (e.g. an iframe an event couldn't bubble out of) still resolves its
   * own tool.
   */
  #notool(): boolean {
    if (!this.#docUrl || !this.#handle) return false;
    const suggestedImportUrl = getSuggestedImportUrl(this.#handle.doc());
    if (
      !suggestedImportUrl ||
      this.#requestedToolImports.has(suggestedImportUrl)
    ) {
      return false;
    }
    this.#requestedToolImports.add(suggestedImportUrl);
    void this.#importSuggestedModule(suggestedImportUrl);
    return true;
  }

  async #importSuggestedModule(url: string): Promise<void> {
    log("importing suggested module", url);
    try {
      const mod = await importModuleFromHttpUrl(url);
      if (Array.isArray(mod?.plugins)) {
        registerPlugins(mod.plugins, url);
      } else {
        console.warn(`suggested module ${url} has no plugins array`);
      }
    } catch (error) {
      console.error(`Failed to import suggested module ${url}`, error);
    }
  }

  #resetDisplay = () => {
    this.#content.replaceChildren();
  };
}
