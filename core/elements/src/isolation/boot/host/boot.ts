/**
 * bootIsolation — the host-side boot sequence for one `<patchwork-isolation>`
 * instance. Given the element and a serializable boot spec, it:
 *
 *  1. Fetches boot assets (es-module-shims, WASM, host styles) — cached
 *  2. Gets the shared denylist (singleton, populated once from sensitive docs)
 *  3. Builds the allowlist seeded from `spec.rootUrls` (+ transitive content)
 *  4. Creates the intermediary repo gated by allowlist + denylist
 *  5. Starts host-side RPC for plugin loading, navigation, and bridged providers
 *  6. Creates the sandboxed iframe and posts the boot message
 *
 * It returns an {@link IsolationHandle} synchronously; the async work runs in
 * the background. `teardown()` cancels any in-flight boot and tears down
 * everything wired so far — it is idempotent and safe to call at any point.
 *
 * No tool code ever runs in the host: the spec is data only, and the iframe
 * resolves/mounts the root component against its own registry.
 */

import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { RepoProviderElement } from "@inkandswitch/patchwork-providers";
import {
  createIntermediaryRepo,
  type IntermediaryRepo,
  PackagesUrlMapper,
  getRegistries,
  startResourceBridge,
  watchRegistries,
  buildAllowlist,
  handleAccessRequest,
  requestBridgedUrlAccess,
  getDenylist,
  startHostNavigationBridge,
  startHostProvidersBridge,
  resolveBridgedProviders,
  makeBridgedValueFilter,
} from "../../bridges/index.js";
import { generateIframeSrcdoc } from "./srcdoc.js";
import type { IsolationBootSpec } from "../../types.js";
import { log } from "../../log.js";
import { fetchBootAssets } from "./assets.js";
import { readHostAppearance } from "./styles.js";
import { getResolvedImportMap } from "./import-map.js";

export interface IsolationHandle {
  /**
   * Cancel any in-flight boot and tear down everything wired so far (bridges,
   * intermediary repo, iframe). Idempotent.
   */
  teardown(): void;
}

/** The host repo comes from the nearest `<repo-provider>` ancestor of `host`. */
function getRepo(host: HTMLElement) {
  const repoProvider = host.closest<RepoProviderElement>("repo-provider");
  const repo = repoProvider?.repo;
  if (!repo) log("no <repo-provider> ancestor found");
  return repo;
}

export function bootIsolation(
  host: HTMLElement,
  spec: IsolationBootSpec
): IsolationHandle {
  // Cancellation: teardown (or a reconfigure that tears this down) flips this,
  // and every async step re-checks it after an await and bails before mutating
  // more state — a stale boot can't keep running.
  let cancelled = false;
  const stale = () => cancelled;

  // State wired up during the boot, torn down together. All start empty, so
  // teardown() before/during boot is a safe no-op over them.
  const cleanups: Array<() => void> = [];
  let hostRpcPort: MessagePort | null = null;
  let intermediary: IntermediaryRepo | null = null;
  let iframe: HTMLIFrameElement | null = null;

  async function run() {
    const rootUrls = spec.rootUrls;
    log(`init root "${spec.rootComponentId}" with ${rootUrls.length} root URLs`);

    const repo = getRepo(host);
    if (!repo) return;

    let assets;
    try {
      assets = await fetchBootAssets();
    } catch (err) {
      console.error("[patchwork-isolation] failed to load boot assets:", err);
      return;
    }
    if (stale()) return;

    const importMap = getResolvedImportMap();
    const mapper = new PackagesUrlMapper();

    // ── Access control ──────────────────────────────────────
    // Wait for the denylist to finish populating before seeding the allowlist
    // or creating the intermediary repo. Otherwise a protected doc that appears
    // in root content could be allowlisted/synced during the population window
    // (the denylist is built asynchronously).
    const denylist = getDenylist(repo);
    await denylist.whenReady();
    if (stale()) return;

    const allowlist = await buildAllowlist(repo, rootUrls, denylist, stale);
    if (stale()) return;

    intermediary = createIntermediaryRepo({
      allowlist,
      hostRepo: repo,
      denylist,
      onAccessRequest: (documentId) =>
        handleAccessRequest(repo, rootUrls, allowlist, denylist, documentId),
    });

    log("intermediary repo and allowlist ready");

    // ── Bridged providers ────────────────────────────────────
    // The effective set for this instance: shared-providers ∩ ALLOWED_PROVIDERS
    // (see providers-bridge).
    const bridgedProviders = resolveBridgedProviders(host);

    // The bridge filters URLs in bridged values against the allowlist; the
    // silent-vs-prompt policy per provider type lives in the bridge.
    const bridgedValueFilter = makeBridgedValueFilter({
      isAllowed: (url) => allowlist.hasUrl(url as AutomergeUrl),
      requestAccess: (url) =>
        requestBridgedUrlAccess(
          repo,
          rootUrls,
          allowlist,
          denylist,
          url as AutomergeUrl
        ),
    });

    // ── Host-side RPC ───────────────────────────────────────
    const rpcChannel = new MessageChannel();
    hostRpcPort = rpcChannel.port1;

    cleanups.push(
      startResourceBridge({ port: hostRpcPort, mapper }),
      startHostNavigationBridge(hostRpcPort, host, (url) =>
        allowlist.hasUrl(url)
      ),
      startHostProvidersBridge(
        hostRpcPort,
        host,
        bridgedProviders,
        bridgedValueFilter
      ),
      watchRegistries(hostRpcPort, mapper)
    );

    // ── Iframe ──────────────────────────────────────────────
    createIframe(rpcChannel.port2, intermediary.iframePort, mapper, assets, {
      rootComponentId: spec.rootComponentId,
      props: spec.props,
      importMap,
    });
  }

  function createIframe(
    rpcPort: MessagePort,
    syncPort: MessagePort,
    mapper: PackagesUrlMapper,
    assets: Awaited<ReturnType<typeof fetchBootAssets>>,
    config: {
      rootComponentId: string;
      props: Record<string, unknown>;
      importMap: ReturnType<typeof getResolvedImportMap>;
    }
  ) {
    const el = document.createElement("iframe");
    el.sandbox.add("allow-scripts");
    el.style.cssText =
      "border: none; width: 100%; height: 100%; display: block;";
    // Bake the host's current background + color-scheme into the srcdoc so the
    // iframe's first paint matches the host (no flash of white before the
    // theming tool boots inside). Read tool-agnostically off the live element —
    // `host` is still connected, so its ancestors carry the host background.
    el.srcdoc = generateIframeSrcdoc(readHostAppearance(host));
    iframe = el;

    el.addEventListener("load", async () => {
      if (stale() || !el.contentWindow) return;
      log("iframe ready");

      const registryEntries = await getRegistries(mapper);
      if (stale() || !el.contentWindow) return;

      const automergeWasm = assets.automergeWasm.slice(0);
      const subductionWasm = assets.subductionWasm.slice(0);

      log(
        `sending boot message with ${registryEntries.length} registry entries, root "${config.rootComponentId}"`
      );
      el.contentWindow.postMessage(
        {
          type: "boot",
          rootComponentId: config.rootComponentId,
          props: config.props,
          registryEntries,
          esmsSource: assets.esmsSource,
          hostStyles: assets.hostStyles,
          importMap: config.importMap,
          hostOrigin: window.location.origin,
          automergeWasm,
          subductionWasm,
        },
        "*",
        [rpcPort, syncPort, automergeWasm, subductionWasm]
      );
    });

    const onBootMessage = (event: MessageEvent) => {
      if (event.data?.type === "boot-error") {
        console.error(
          "[patchwork-isolation] iframe boot failed:",
          event.data.error
        );
      }
    };
    hostRpcPort!.addEventListener("message", onBootMessage);
    cleanups.push(() =>
      hostRpcPort?.removeEventListener("message", onBootMessage)
    );

    host.appendChild(el);
  }

  let toreDown = false;
  function teardown() {
    if (toreDown) return;
    toreDown = true;
    cancelled = true;
    log("teardown");

    for (const fn of cleanups) fn();
    cleanups.length = 0;

    hostRpcPort?.close();
    hostRpcPort = null;

    intermediary?.shutdown();
    intermediary = null;

    iframe?.remove();
    iframe = null;
  }

  void run();
  return { teardown };
}
