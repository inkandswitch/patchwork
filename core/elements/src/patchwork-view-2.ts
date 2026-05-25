import type { AutomergeUrl } from "@automerge/automerge-repo";
import {
  getRegistry,
  isLoadablePlugin,
  type LoadablePlugin,
  type LoadedPlugin,
  type PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import { MountedEvent, UnmountedEvent } from "./events.js";

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

export interface RegisterPatchworkView2ElementParams {
  name?: string;
}

export interface PatchworkView2Element extends HTMLElement {
  componentId?: string | null;
  docUrl?: AutomergeUrl | null;
}

export function registerPatchworkView2Element(
  params: RegisterPatchworkView2ElementParams = {}
) {
  const name = params.name ?? "patchwork-view-2";

  if (customElements.get(name)) {
    console.error(`can't redefine a custom element. defining "${name}"`);
    return;
  }

  const attrs = {
    componentId: "component-id",
    docUrl: "doc-url",
  };

  customElements.define(
    name,
    class PatchworkView2Element extends HTMLElement {
      #componentId: string | null = null;
      #docUrl: AutomergeUrl | null = null;
      #component: LoadedComponent | null = null;
      #state: State = State.none;
      #initEpoch = 0;
      #teardowns = new Set<() => unknown | Promise<void>>();
      #mounted: { componentId: string } | null = null;
      #capturedParent: Element | null = null;

      get componentId() {
        return this.#componentId;
      }

      set componentId(id: string | null) {
        if (this.#componentId === id) return;
        this.#componentId = id;
        const attr = this.getAttribute(attrs.componentId);
        if (attr == id) return;
        if (id) {
          this.setAttribute(attrs.componentId, id);
        } else {
          this.removeAttribute(attrs.componentId);
        }
      }

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
        const attr = this.getAttribute(attrs.docUrl);
        if (attr == url) return;
        if (url) {
          this.setAttribute(attrs.docUrl, url);
        } else {
          this.removeAttribute(attrs.docUrl);
        }
      }

      static get observedAttributes() {
        return [attrs.componentId, attrs.docUrl];
      }

      connectedCallback() {
        this.#capturedParent = this.parentElement;
        // Default to a layout-invisible box so the wrapper can sit around
        // existing JSX without disturbing the surrounding layout. Visual
        // components can override `this.style.display` if they need a box.
        if (!this.style.display) {
          this.style.display = "contents";
        }
        this.componentId = this.getAttribute(attrs.componentId);
        this.docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl | null;
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      connectedMoveCallback() {
        this.#capturedParent = this.parentElement;
      }

      attributeChangedCallback(
        name: string,
        old: string | null,
        val: string | null
      ) {
        if (old === val) return;

        if (name === attrs.componentId) {
          this.#componentId = val;
          this.#teardown().then(() => this.#init());
        }

        if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl | null;
          this.#teardown().then(() => this.#init());
        }
      }

      #init = async () => {
        const registry = getRegistry<ComponentDescription>(
          "patchwork:component"
        );
        if (this.#state != State.none) return;
        if (!this.componentId) return;

        const epoch = ++this.#initEpoch;
        this.#state = State.initializing;

        const removeAddedListener = registry.on(
          "registered",
          async (added) => {
            if (added.id !== this.componentId) return;
            if (isLoadablePlugin(added)) {
              registry.load(added.id);
            }
          }
        );

        const removeLoadedListener = registry.on(
          "loaded",
          async (loaded) => {
            if (loaded.id !== this.componentId) return;

            if (this.#state == "unable" || this.#state == "initializing") {
              this.#queueRender();
              return;
            }

            // Hot reload: a newer importUrl re-mounts.
            if (this.#state == "error" || this.#state == "rendered") {
              if (loaded.importUrl !== this.#component?.importUrl) {
                await this.#teardown();
                this.#init();
              }
            }
          }
        );

        this.#teardowns.add(() => {
          removeAddedListener();
          removeLoadedListener();
        });

        if (epoch !== this.#initEpoch) return;

        this.#queueRender();
      };

      async #teardown() {
        if (this.#state == State.none) return;

        this.#initEpoch++;

        for (const fn of this.#teardowns) {
          await fn?.();
        }

        this.#teardowns.clear();
        this.#component = null;
        this.#state = State.none;

        const mounted = this.#mounted;
        if (mounted) {
          this.#mounted = null;
          this.#dispatchUnmount(new UnmountedEvent(mounted));
        }
      }

      // See `patchwork-view.ts` `#dispatchUnmount`.
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
        if (!this.componentId) {
          this.#state = "unable";
          return;
        }

        const componentId = this.componentId;
        const registry = getRegistry<LoadedComponent>("patchwork:component");
        this.#component = registry.get(componentId) ?? null;

        if (!this.#component) {
          this.#state = "unable";
          console.warn(
            `patchwork-view-2: no component registered with id "${componentId}"`
          );
          return;
        }

        if (!this.#component.module) {
          registry.load(this.#component.id);
          if (registry.isLoading(this.#component.id)) {
            this.#state = "unable";
            console.info(`patchwork-view-2: loading component "${componentId}"`);
          } else {
            this.#state = "unable";
            console.warn(
              `patchwork-view-2: failed to load component "${componentId}"`
            );
          }
          return;
        }

        try {
          const cleanup = this.#component.module(this);
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
            `patchwork-view-2: component "${componentId}" threw during mount`,
            error
          );
          this.#state = "error";
        }
      }
    }
  );
}
