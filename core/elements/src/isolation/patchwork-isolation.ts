/**
 * `<patchwork-isolation>` — mounts an isolated root component inside a sandboxed
 * iframe with data access mediated by an intermediary repo and allowlist.
 *
 * The element renders nothing on its own and never inspects its light DOM. The
 * host hands it a serializable boot spec via the imperative `configure()` method:
 *
 *   const el = document.createElement("patchwork-isolation");
 *   el.configure({
 *     rootComponentId: "threepane-document-area",
 *     props: { selectedDocUrl, traySlots, ... },  // structured-clone JSON only
 *     rootUrls: [selectedDocUrl, contactUrl],      // allowlist seeds
 *   });
 *
 * The spec is data only — no live DOM, no functions. Tool code therefore never
 * runs in the host realm: the iframe resolves `rootComponentId` against its own
 * registry and mounts it. Any later `configure()` with a different spec tears the
 * iframe down and boots a fresh one (no diffing, no in-place re-pointing).
 *
 * This file is just the custom-element lifecycle shell: it holds the current
 * spec and boot handle and delegates the actual boot sequence to
 * `bootIsolation()` (see ./boot). Register at boot time via
 * `registerPatchworkIsolationElement()`.
 */

import { bootIsolation, type IsolationHandle, specsEqual } from "./boot/index.js";
import type { IsolationBootSpec } from "./types.js";
import { log } from "./log.js";

declare global {
  interface HTMLElementTagNameMap {
    "patchwork-isolation": PatchworkIsolationElement;
  }
}

export interface PatchworkIsolationElement extends HTMLElement {
  /**
   * Boot (or re-boot) the isolated iframe from a serializable spec. Stored and
   * deferred if the element is disconnected; applied on connect. A later call
   * with a different spec tears down the existing iframe and boots a fresh one;
   * a byte-identical spec is a no-op.
   */
  configure(spec: IsolationBootSpec): void;
}

/**
 * Defines the `<patchwork-isolation>` custom element.
 * Call once at boot time.
 */
export function registerPatchworkIsolationElement(
  name = "patchwork-isolation"
): void {
  if (customElements.get(name)) return;

  customElements.define(
    name,
    class extends HTMLElement implements PatchworkIsolationElement {
      // The spec the element is (or should be) booted from. Set by configure();
      // applied on connect. Persists across disconnect/reconnect so a detached
      // configure() boots once reconnected.
      #spec: IsolationBootSpec | null = null;
      // The live boot handle, or null when not currently booted. Tearing it
      // down cancels any in-flight boot and disposes the iframe + bridges.
      #handle: IsolationHandle | null = null;

      connectedCallback() {
        // Boot from a spec configured while disconnected (or before connect).
        if (this.#spec) this.#handle = bootIsolation(this, this.#spec);
      }

      disconnectedCallback() {
        this.#handle?.teardown();
        this.#handle = null;
      }

      configure(spec: IsolationBootSpec) {
        // Skip a redundant reconfigure with a byte-identical spec — the host may
        // recompute and re-hand an unchanged spec on unrelated state changes, and
        // a reboot is expensive (module re-fetch + WASM re-init).
        if (this.#spec && specsEqual(this.#spec, spec)) {
          log("configure: spec unchanged, ignoring");
          return;
        }
        this.#spec = spec;
        if (!this.isConnected) {
          log("configure: stored (disconnected); will boot on connect");
          return;
        }
        // A real change while connected: tear down the running iframe and boot
        // fresh. teardown() is a safe no-op if nothing is booted yet.
        this.#handle?.teardown();
        this.#handle = bootIsolation(this, spec);
      }
    }
  );
}
