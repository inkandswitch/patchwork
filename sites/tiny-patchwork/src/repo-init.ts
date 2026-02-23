/**
 * This module initializes Subduction Wasm before exporting Repo.
 * Import from here instead of @automerge/vanillajs to ensure Wasm is ready.
 */
import initSubduction, {
  Subduction,
  SubductionWebSocket,
  WebCryptoSigner,
} from "@automerge/automerge_subduction";

// Initialize Wasm immediately
await initSubduction();

// Re-export everything from vanillajs (Repo, etc.)
export * from "@automerge/vanillajs";

// Re-export Subduction types we need
export { Subduction, SubductionWebSocket, WebCryptoSigner };

// Re-export the storage bridge
export { SubductionStorageBridge } from "@automerge/automerge-repo-subduction-bridge";
