/**
 * Initialize Subduction Wasm module and register it with automerge-repo.
 * This must be imported and awaited BEFORE any automerge-repo code runs.
 */
console.log("[init-wasm] Starting Wasm initialization...");

// @ts-expect-error - TS doesn't see the default export but it exists at runtime
import initSubduction from "@automerge/automerge_subduction";
import * as subductionModule from "@automerge/automerge_subduction";
import { initSubductionModule } from "@automerge/automerge-repo-subduction-bridge";

try {
  console.log("[init-wasm] Imports loaded, calling initSubduction()...");
  await initSubduction();
  console.log("[init-wasm] Wasm loaded, registering module...");
  initSubductionModule(subductionModule);
  console.log("[init-wasm] Subduction Wasm initialized");
} catch (e) {
  console.error("[init-wasm] Failed to initialize:", e);
  throw e;
}
