import {
  getRegistry,
  isLoadablePlugin,
  type LoadablePlugin,
  type LoadedPlugin,
  type PluginDescription,
} from "@inkandswitch/patchwork-plugins";
import debug from "debug";
import { MountedEvent } from "./events.js";

const log = debug("patchwork:elements:view-2");

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
  };

  customElements.define(
    name,
    class PatchworkView2Element extends HTMLElement {
      #componentId: string | null = null;
      #component: LoadedComponent | null = null;
      #state: State = State.none;
      #initEpoch = 0;
      #teardowns = new Set<() => unknown | Promise<void>>();

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

      static get observedAttributes() {
        return [attrs.componentId];
      }

      connectedCallback() {
        this.componentId = this.getAttribute(attrs.componentId);
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      // When defined, this is called instead of connectedCallback() and disconnectedCallback()
      // each time the element is moved to a different place in the DOM via Element.moveBefore()
      connectedMoveCallback() {}

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
        this.textContent = "";
        this.#state = State.none;
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

        this.#resetDisplay();

        const componentId = this.componentId;
        const registry = getRegistry<LoadedComponent>("patchwork:component");
        this.#component = registry.get(componentId) ?? null;

        if (!this.#component) {
          this.#state = "unable";
          this.#displayError(
            `I couldn't find the component with id ${componentId}.`
          );
          return;
        }

        if (!this.#component.module) {
          registry.load(this.#component.id);
          if (registry.isLoading(this.#component.id)) {
            this.#state = "unable";
            log(`loading ${componentId}`);
            this.#displayLoading(componentId);
          } else {
            this.#state = "unable";
            this.#displayError(
              `I couldn't load the component with id ${componentId}.`
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
          this.dispatchEvent(new MountedEvent({ componentId }));
        } catch (error) {
          this.append(
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

      #displayLoading = (componentId: string) => {
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
            <div style="font-size: 12px; color: #888;">loading ${componentId}</div>
          </div>
        `;
        this.append(div);
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
        this.append(div);
        setTimeout(() => {
          div.style.opacity = "1";
        });
      };

      #resetDisplay = () => {
        this.replaceChildren();
        this.style.display = "";
        this.style.alignItems = "";
        this.style.justifyContent = "";
      };
    }
  );
}
