import type { IsolationBootSpec } from "../../types.js";

/**
 * Structural equality for two boot specs. `props` is structured-clone JSON and
 * `rootUrls` is computed deterministically by the host, so a stable JSON
 * stringify is a sound and cheap comparison — it lets `configure()` ignore a
 * host that recomputes and re-hands an unchanged spec, avoiding a needless
 * (expensive) iframe reboot.
 */
export function specsEqual(a: IsolationBootSpec, b: IsolationBootSpec): boolean {
  if (a.rootComponentId !== b.rootComponentId) return false;
  if (a.rootUrls.length !== b.rootUrls.length) return false;
  for (let i = 0; i < a.rootUrls.length; i++) {
    if (a.rootUrls[i] !== b.rootUrls[i]) return false;
  }
  return JSON.stringify(a.props) === JSON.stringify(b.props);
}
