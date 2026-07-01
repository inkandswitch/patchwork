/**
 * Host-side setup: how an isolation iframe gets born. `bootIsolation` runs the
 * boot sequence and returns a handle; the leaf modules (assets, styles,
 * import-map, spec) are the self-contained reads it composes.
 */

export { bootIsolation, type IsolationHandle } from "./boot.js";
export { specsEqual } from "./spec.js";
