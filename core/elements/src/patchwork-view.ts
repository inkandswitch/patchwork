import type { AutomergeUrl } from "@automerge/automerge-repo";
import {
  getRegistry,
  isLoadablePlugin,
  type LoadablePlugin,
  type LoadedPlugin,
  type PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import { MountedEvent, UnmountedEvent } from "./events.js";
import { registerPatchworkViewLegacyElement } from "./patchwork-view-legacy.js";

export type ComponentRender = (element: HTMLElement) => () => void;

export type ComponentDescription = PluginDescription & {
  id: string;
  type: "patchwork:component";
  name: string;
  icon?: string;
  tags?: string[];
};

export type LoadedComponent = LoadedPlugin<
  ComponentDescription,
  ComponentRender
>;

export type Component = LoadablePlugin<ComponentDescription, ComponentRender>;

const State = {
  none: "none",
  initializing: "initializing",
  rendering: "rendering",
  unable: "unable",
  rendered: "rendered",
  error: "error",
} as const;

type State = (typeof State)[keyof typeof State];

const Mode = {
  idle: "idle",
  component: "component",
  legacy: "legacy",
} as const;

type Mode = (typeof Mode)[keyof typeof Mode];

const ATTRS = {
  component: "component",
  url: "url",
  docUrl: "doc-url",
  toolId: "tool-id",
} as const;

export type RegisterPatchworkViewElementParams = {
  name?: string;
};

/**
 * `<patchwork-view>` operates in one of two modes based on its
 * attributes: **component mode** (`component`) mounts a registered
 * `patchwork:component` plugin in place; **legacy mode** (`doc-url` /
 * `tool-id`, no `component`) delegates to an inner
 * `<patchwork-view-legacy>`. `component` wins if both are set.
 */
export type PatchworkViewElement = HTMLElement & {
  component?: string | null;
  url?: AutomergeUrl | null;
  docUrl?: AutomergeUrl | null;
  toolId?: string | null;
};

export function registerPatchworkViewElement(
  params: RegisterPatchworkViewElementParams = {}
) {
  const name = params.name ?? "patchwork-view";

  // Also registers `<patchwork-view-legacy>` (the wrapper's delegation
  // target). Both register functions are idempotent.
  registerPatchworkViewLegacyElement();

  if (customElements.get(name)) return;

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
      #mode: Mode = Mode.idle;
      #capturedParent: Element | null = null;

      #component: string | null = null;
      #url: AutomergeUrl | null = null;
      #loaded: LoadedComponent | null = null;
      #state: State = State.none;
      #initEpoch = 0;
      #teardowns = new Set<() => unknown | Promise<void>>();

      #legacyChild: HTMLElement | null = null;

      get component() {
        return this.#component;
      }

      set component(id: string | null) {
        if (this.#component === id) return;
        this.#component = id;
        const attr = this.getAttribute(ATTRS.component);
        if (attr == id) return;
        if (id) this.setAttribute(ATTRS.component, id);
        else this.removeAttribute(ATTRS.component);
      }

      get url() {
        return this.#url;
      }

      set url(url: AutomergeUrl | null) {
        if (this.#url === url) return;
        this.#url = url;
        const attr = this.getAttribute(ATTRS.url);
        if (attr == url) return;
        if (url) this.setAttribute(ATTRS.url, url);
        else this.removeAttribute(ATTRS.url);
      }

      get docUrl(): AutomergeUrl | null {
        return this.getAttribute(ATTRS.docUrl) as AutomergeUrl | null;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.docUrl === url) return;
        if (url) this.setAttribute(ATTRS.docUrl, url);
        else this.removeAttribute(ATTRS.docUrl);
      }

      get toolId(): string | null {
        return this.getAttribute(ATTRS.toolId);
      }

      set toolId(id: string | null) {
        if (this.toolId === id) return;
        if (id) this.setAttribute(ATTRS.toolId, id);
        else this.removeAttribute(ATTRS.toolId);
      }

      static get observedAttributes() {
        return [ATTRS.component, ATTRS.url, ATTRS.docUrl, ATTRS.toolId];
      }

      connectedCallback() {
        this.#capturedParent = this.parentElement;
        this.#component = this.getAttribute(ATTRS.component);
        this.#url = this.getAttribute(ATTRS.url) as AutomergeUrl | null;
        this.#syncMode();
      }

      disconnectedCallback() {
        void this.#teardown();
      }

      connectedMoveCallback() {
        this.#capturedParent = this.parentElement;
      }

      attributeChangedCallback(
        attrName: string,
        old: string | null,
        val: string | null
      ) {
        if (old === val) return;

        if (attrName === ATTRS.component) this.#component = val;
        else if (attrName === ATTRS.url) this.#url = val as AutomergeUrl | null;

        const targetMode = this.#pickMode();
        if (targetMode !== this.#mode) {
          void this.#teardown().then(() => this.#syncMode());
          return;
        }

        if (this.#mode === Mode.legacy && this.#legacyChild) {
          if (attrName === ATTRS.docUrl || attrName === ATTRS.toolId) {
            if (val !== null) this.#legacyChild.setAttribute(attrName, val);
            else this.#legacyChild.removeAttribute(attrName);
          }
          return;
        }

        if (this.#mode === Mode.component) {
          if (attrName === ATTRS.component || attrName === ATTRS.url) {
            void this.#teardown().then(() => this.#syncMode());
          }
        }
      }

      #pickMode(): Mode {
        if (this.hasAttribute(ATTRS.component)) return Mode.component;
        if (this.hasAttribute(ATTRS.docUrl) || this.hasAttribute(ATTRS.toolId)) {
          return Mode.legacy;
        }
        return Mode.idle;
      }

      #syncMode() {
        const target = this.#pickMode();
        this.#mode = target;

        if (target === Mode.idle) return;

        if (target === Mode.legacy) {
          this.#initLegacy();
          return;
        }

        // Component-only: legacy mode leaves `display` alone so sites'
        // CSS rules on `patchwork-view` (e.g. `display: block`) apply.
        if (!this.style.display) this.style.display = "contents";
        this.#initComponent();
      }

      #initLegacy() {
        if (this.#legacyChild) return;
        const child = document.createElement("patchwork-view-legacy");
        const docUrl = this.getAttribute(ATTRS.docUrl);
        const toolId = this.getAttribute(ATTRS.toolId);
        if (docUrl) child.setAttribute(ATTRS.docUrl, docUrl);
        if (toolId) child.setAttribute(ATTRS.toolId, toolId);
        this.appendChild(child);
        this.#legacyChild = child;
      }

      #initComponent = async () => {
        if (this.#state != State.none) return;
        if (!this.component) return;

        const registry = getRegistry<ComponentDescription>(
          "patchwork:component"
        );

        const epoch = ++this.#initEpoch;
        this.#state = State.initializing;

        const removeAddedListener = registry.on(
          "registered",
          async (added) => {
            if (added.id !== this.component) return;
            if (isLoadablePlugin(added)) {
              registry.load(added.id);
            }
          }
        );

        const removeLoadedListener = registry.on("loaded", async (loaded) => {
          if (loaded.id !== this.component) return;

          if (this.#state == "unable" || this.#state == "initializing") {
            this.#queueRender();
            return;
          }

          // Hot reload: a newer importUrl re-mounts.
          if (this.#state == "error" || this.#state == "rendered") {
            if (loaded.importUrl !== this.#loaded?.importUrl) {
              await this.#teardown();
              this.#syncMode();
            }
          }
        });

        this.#teardowns.add(() => {
          removeAddedListener();
          removeLoadedListener();
        });

        if (epoch !== this.#initEpoch) return;

        this.#queueRender();
      };

      async #teardown() {
        if (this.#mode === Mode.legacy) {
          if (this.#legacyChild) {
            this.#legacyChild.remove();
            this.#legacyChild = null;
          }
          this.#mode = Mode.idle;
          return;
        }

        if (this.#mode === Mode.component) {
          if (this.#state == State.none) {
            this.#mode = Mode.idle;
            return;
          }

          // Only `rendered` reached the `MountedEvent` dispatch.
          const wasMounted = this.#state == State.rendered;
          const mountedComponentId = this.#loaded?.id;

          this.#initEpoch++;

          for (const fn of this.#teardowns) {
            await fn?.();
          }

          this.#teardowns.clear();
          this.#loaded = null;
          this.#state = State.none;

          if (wasMounted && mountedComponentId) {
            this.#dispatchUnmount(
              new UnmountedEvent({ componentId: mountedComponentId })
            );
          }
        }

        this.#mode = Mode.idle;
      }

      // Bubbling is a no-op when detached; fall back to the closest
      // still-connected ancestor.
      #dispatchUnmount(event: UnmountedEvent) {
        if (this.isConnected) {
          this.dispatchEvent(event);
          return;
        }
        let node: Element | null = this.#capturedParent;
        while (node && !node.isConnected) node = node.parentElement;
        if (node) node.dispatchEvent(event);
      }

      #queueRender() {
        if (this.#state == "none") return;
        if (this.#state == "rendering") return;
        this.#state = "rendering";
        queueMicrotask(() => this.#renderComponent());
      }

      #renderComponent() {
        if (this.#state != "rendering") return;
        if (!this.component) {
          this.#state = "unable";
          return;
        }

        const componentId = this.component;
        const registry = getRegistry<LoadedComponent>("patchwork:component");
        this.#loaded = registry.get(componentId) ?? null;

        if (!this.#loaded) {
          this.#state = "unable";
          console.warn(
            `patchwork-view: no component registered with id "${componentId}"`
          );
          return;
        }

        if (!this.#loaded.module) {
          registry.load(this.#loaded.id);
          if (registry.isLoading(this.#loaded.id)) {
            this.#state = "unable";
            console.info(
              `patchwork-view: loading component "${componentId}"`
            );
          } else {
            this.#state = "unable";
            console.warn(
              `patchwork-view: failed to load component "${componentId}"`
            );
          }
          return;
        }

        try {
          const cleanup = this.#loaded.module(this);
          if (typeof cleanup === "function") {
            this.#teardowns.add(cleanup);
          } else {
            console.warn(`return a cleanup function from ${componentId}`);
          }
          this.#state = "rendered";
          this.dispatchEvent(new MountedEvent({ componentId }));
        } catch (error) {
          console.error(
            `patchwork-view: component "${componentId}" threw during mount`,
            error
          );
          this.#state = "error";
        }
      }
    }
  );
}
