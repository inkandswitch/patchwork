/**
 * Initialize Subduction Wasm module and register it with automerge-repo.
 * This must be imported and awaited BEFORE any automerge-repo code runs.
 *
 * The bundler-target Wasm package auto-initializes on import (via
 * `__wbindgen_start`), so no explicit init call is needed.
 */
console.log("[init-wasm] Starting Wasm initialization...");

import * as subductionModule from "@automerge/automerge-subduction";
import { initSubductionModule } from "@automerge/automerge-repo-subduction-bridge";

try {
  console.log(
    "[init-wasm] Wasm auto-initialized on import, registering module..."
  );
  initSubductionModule(subductionModule);
  console.log("[init-wasm] Subduction Wasm initialized");
} catch (e) {
  console.error("[init-wasm] Failed to initialize:", e);
  throw e;
}
