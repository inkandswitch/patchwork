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
  legacy: "legacy",
  error: "error",
} as const;

type State = (typeof State)[keyof typeof State];

export type RegisterPatchworkViewElementParams = {
  name?: string;
};

export type PatchworkViewElement = HTMLElement & {
  component?: string | null;
  url?: AutomergeUrl | null;
};

export function registerPatchworkViewElement(
  params: RegisterPatchworkViewElementParams = {}
) {
  registerPatchworkViewLegacyElement();

  const name = params.name ?? "patchwork-view";

  if (customElements.get(name)) {
    console.error(`can't redefine a custom element. defining "${name}"`);
    return;
  }

  const attrs = {
    component: "component",
    url: "url",
    legacyToolId: "tool-id",
    legacyDocUrl: "doc-url",
  };

  customElements.define(
    name,
    class PatchworkViewElement extends HTMLElement {
      #component: string | null = null;
      #url: AutomergeUrl | null = null;
      #loaded: LoadedComponent | null = null;
      #state: State = State.none;
      #initEpoch = 0;
      #teardowns = new Set<() => unknown | Promise<void>>();
      #mounted: { componentId: string } | null = null;
      #capturedParent: Element | null = null;

      #legacyChild?: HTMLElement | null = null;

      get component() {
        return this.#component;
      }

      set component(id: string | null) {
        if (this.#component === id) return;
        this.#component = id;
        const attr = this.getAttribute(attrs.component);
        if (attr == id) return;
        if (id) {
          this.setAttribute(attrs.component, id);
        } else {
          this.removeAttribute(attrs.component);
        }
      }

      get url() {
        return this.#url;
      }

      set url(url: AutomergeUrl | null) {
        if (this.#url === url) return;
        this.#url = url;
        const attr = this.getAttribute(attrs.url);
        if (attr == url) return;
        if (url) {
          this.setAttribute(attrs.url, url);
        } else {
          this.removeAttribute(attrs.url);
        }
      }

      static get observedAttributes() {
        return [
          attrs.component,
          attrs.url,
          attrs.legacyToolId,
          attrs.legacyDocUrl,
        ];
      }

      connectedCallback() {
        this.#capturedParent = this.parentElement;
        // Default to a layout-invisible box so the wrapper can sit around
        // existing JSX without disturbing the surrounding layout. Visual
        // components can override `this.style.display` if they need a box.
        if (!this.style.display) {
          this.style.display = "contents";
        }
        this.component = this.getAttribute(attrs.component);
        this.url = this.getAttribute(attrs.url) as AutomergeUrl | null;
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
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

        if (attrName === attrs.component) {
          this.#component = val;
        } else if (attrName === attrs.url) {
          this.#url = val as AutomergeUrl | null;
        }
        // For legacy attrs we don't track them on the instance; the
        // fallback child reads them off the DOM directly on re-init.

        this.#teardown().then(() => this.#init());
      }

      #isLegacyMode() {
        return (
          this.hasAttribute(attrs.legacyToolId) ||
          this.hasAttribute(attrs.legacyDocUrl)
        );
      }

      #init = async () => {
        if (this.#state != State.none) return;

        if (this.#isLegacyMode()) {
          this.#initLegacy();
          return;
        }

        if (!this.component) return;

        const registry = getRegistry<ComponentDescription>(
          "patchwork:component"
        );

        const epoch = ++this.#initEpoch;
        this.#state = State.initializing;

        const removeAddedListener = registry.on("registered", async (added) => {
          if (added.id !== this.component) return;
          if (isLoadablePlugin(added)) {
            registry.load(added.id);
          }
        });

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
              this.#init();
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

      #initLegacy() {
        const hasNewAttrs =
          this.hasAttribute(attrs.component) || this.hasAttribute(attrs.url);
        if (hasNewAttrs) {
          console.warn(
            `<patchwork-view>: legacy attributes (doc-url/tool-id) take precedence; ignoring url/component.`
          );
        }

        const child = document.createElement("patchwork-view-legacy");
        const docUrl = this.getAttribute(attrs.legacyDocUrl);
        const toolId = this.getAttribute(attrs.legacyToolId);
        if (docUrl) child.setAttribute("doc-url", docUrl);
        if (toolId) child.setAttribute("tool-id", toolId);
        this.appendChild(child);
        this.#legacyChild = child;
        this.#state = State.legacy;

        this.#teardowns.add(() => {
          child.remove();
          this.#legacyChild = null;
        });
      }

      async #teardown() {
        if (this.#state == State.none) return;

        this.#initEpoch++;

        for (const fn of this.#teardowns) {
          await fn?.();
        }

        this.#teardowns.clear();
        this.#loaded = null;
        this.#state = State.none;

        const mounted = this.#mounted;
        if (mounted) {
          this.#mounted = null;
          this.#dispatchUnmount(new UnmountedEvent(mounted));
        }
      }

      // See `patchwork-view-legacy.ts` `#dispatchUnmount`.
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
        queueMicrotask(() => this.#render());
      }

      #render() {
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
            console.info(`patchwork-view: loading component "${componentId}"`);
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
          this.#mounted = { componentId };
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
