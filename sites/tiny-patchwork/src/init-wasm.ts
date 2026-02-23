/**
 * Initialize Subduction Wasm module and register it with automerge-repo.
 * This must be imported and awaited BEFORE any automerge-repo code runs.
 */
import initSubduction from "@automerge/automerge_subduction";
import * as subductionModule from "@automerge/automerge_subduction";
import { initSubductionModule } from "@automerge/automerge-repo-subduction-bridge";

await initSubduction();
initSubductionModule(subductionModule);

console.log("Subduction Wasm initialized");
