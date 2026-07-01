/**
 * Boot assets — the es-module-shims source, the automerge/subduction WASM
 * binaries, and the collected host styles. Fetched once and shared across all
 * isolation instances on the page (the promise is cached), since they are
 * identical for every iframe.
 */

import { collectHostStyles } from "./styles.js";

export interface BootAssets {
  esmsSource: string;
  automergeWasm: ArrayBuffer;
  subductionWasm: ArrayBuffer;
  hostStyles: string;
}

let bootAssetsPromise: Promise<BootAssets> | null = null;

export function fetchBootAssets(): Promise<BootAssets> {
  if (bootAssetsPromise) return bootAssetsPromise;

  bootAssetsPromise = Promise.all([
    fetch("/es-module-shims.js").then((r) => {
      if (!r.ok)
        throw new Error(`Failed to fetch es-module-shims: ${r.status}`);
      return r.text();
    }),
    fetch("/automerge.wasm?main").then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch automerge.wasm: ${r.status}`);
      return r.arrayBuffer();
    }),
    fetch("/subduction.wasm").then((r) => {
      if (!r.ok)
        throw new Error(`Failed to fetch subduction.wasm: ${r.status}`);
      return r.arrayBuffer();
    }),
    collectHostStyles(),
  ]).then(([esmsSource, automergeWasm, subductionWasm, hostStyles]) => ({
    esmsSource,
    automergeWasm,
    subductionWasm,
    hostStyles,
  }));

  return bootAssetsPromise;
}
