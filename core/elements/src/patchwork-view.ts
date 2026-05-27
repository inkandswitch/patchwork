import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { initializeAutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
import {
  getRegistry,
  isLoadablePlugin,
  type LoadablePlugin,
  type LoadedPlugin,
  type PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import { MountedEvent, UnmountedEvent } from "./events.js";
import { registerPatchworkViewLegacyElement } from "./patchwork-view-legacy.js";

type AutomergeRepoKeyhive = Awaited<
  ReturnType<typeof initializeAutomergeRepoKeyhive>
>;

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

const ATTRS = {
  component: "component",
  url: "url",
  docUrl: "doc-url",
  toolId: "tool-id",
} as const;

export type RegisterPatchworkViewElementParams = {
  name?: string;
  /**
   * Forwarded to the inner `<patchwork-view-legacy>` element so legacy
   * tools rendered in fallback mode get access to a Keyhive instance.
   */
  hive?: AutomergeRepoKeyhive;
};

/**
 * `<patchwork-view>` reacts to whichever attributes it carries: a
 * `component` attribute mounts a registered `patchwork:component`
 * plugin in place; the legacy `doc-url` / `tool-id` attributes (and no
 * `component`) cause an inner `<patchwork-view-legacy>` to be appended
 * and forwarded to. `component` wins if both are set.
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

  // Also registers `<patchwork-view-legacy>` (the inner element used
  // when legacy attributes are set). Both register functions are
  // idempotent.
  registerPatchworkViewLegacyElement({ hive: params.hive });

  if (customElements.get(name)) return;

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
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
        this.#sync();
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

        // Already showing the legacy child and still want it: forward
        // doc-url / tool-id changes through to it without reattaching.
        if (this.#legacyChild && !this.#wantsComponent()) {
          if (attrName === ATTRS.docUrl || attrName === ATTRS.toolId) {
            if (val !== null) this.#legacyChild.setAttribute(attrName, val);
            else this.#legacyChild.removeAttribute(attrName);
          }
          return;
        }

        // Already mounting a component and still want one: only react
        // to the component-driving attributes; doc-url / tool-id are
        // ignored while a `component` attribute is set.
        if (this.#state !== State.none && this.#wantsComponent()) {
          if (attrName !== ATTRS.component && attrName !== ATTRS.url) return;
        }

        // Either transitioning between forms or initial setup after an
        // attribute landed on an idle element. Tear down whatever is
        // there (no-op when idle) and re-sync against the attributes.
        void this.#teardown().then(() => this.#sync());
      }

      #wantsComponent() {
        return this.hasAttribute(ATTRS.component);
      }

      #wantsLegacy() {
        return (
          !this.hasAttribute(ATTRS.component) &&
          (this.hasAttribute(ATTRS.docUrl) ||
            this.hasAttribute(ATTRS.toolId))
        );
      }

      #sync() {
        if (this.#wantsLegacy()) {
          this.#renderLegacy();
          return;
        }

        if (this.#wantsComponent()) {
          // Legacy mode leaves `display` alone so sites' CSS rules on
          // `patchwork-view` (e.g. `display: block`) apply.
          if (!this.style.display) this.style.display = "contents";
          this.#initComponent();
        }
      }

      #renderLegacy() {
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
              this.#sync();
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
        if (this.#legacyChild) {
          this.#legacyChild.remove();
          this.#legacyChild = null;
        }

        if (this.#state == State.none) return;

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
