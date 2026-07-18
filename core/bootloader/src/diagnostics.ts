/**
 * Tab-side diagnostics bundle orchestrator.
 *
 * Exposed as `window.patchwork.diagnostics` — installed early in boot (before
 * the awaits that can hang) so the console one-liner exists even when boot
 * wedges:
 *
 *     await window.patchwork.diagnostics.export()
 *
 * collects everything we know across all three execution contexts and downloads
 * a single `.zip` the user can send for offline analysis:
 *
 *   manifest.json     environment (time, browser/OS, quota, memory, support
 *                     flags), tab repo, modules, plugins, worker + service
 *                     worker snapshots, an index of the raw IDB dump, and a
 *                     prominent secrets warning.
 *   logs/{tab,worker,sw}.log
 *   idb/<db>.<store>.{index.json,bin}   full raw IndexedDB dump (see idb-dump.ts)
 *
 * Resilience is the priority: this must work when the system is broken. Every
 * collector is wrapped so one failure can't abort the bundle, per-source
 * requests time out (a wedged SharedWorker can't hang the export), and the
 * trigger is installed early in boot — before the awaits that can hang — so the
 * worst failure modes (boot hangs, dead worker) are still capturable.
 *
 * Per the "full visibility" policy this dumps EVERYTHING, including full
 * document contents, the complete localStorage, and the private Ed25519 signing
 * key (in the raw `subduction-signer` IDB dump). The bundle is therefore a
 * secret — the export prints a loud warning saying so.
 */

import { strToU8, zipSync, type Zippable } from "fflate";
import { formatLogEntries, RingLogger } from "./logger.js";
import { dumpAllDatabases } from "./idb-dump.js";
import {
  requestServiceWorkerDiagnostics,
  requestWorkerDiagnostics,
} from "./setup.js";

const SECRETS_WARNING =
  "This bundle contains your FULL document contents, your COMPLETE localStorage, " +
  "and your PRIVATE Ed25519 signing key (the `subduction-signer` IndexedDB store). " +
  "Anyone who has it can impersonate you and read all your data. Treat it like a " +
  "password: only send it over a trusted channel, and never commit it or post it publicly.";

const MANIFEST_SCHEMA_VERSION = 1;
const BIN_FORMAT_VERSION = 1;
const PER_SOURCE_TIMEOUT_MS = 8_000;

export interface DiagnosticsExportResult {
  filename: string;
  bytes: number;
}

export interface TabDiagnostics {
  /** Collect everything and download the bundle. The console one-liner. */
  export(): Promise<DiagnosticsExportResult>;
  /** Re-download the last bundle (if a browser throttled the first click). */
  redownload(): boolean;
  /** Drop a labelled lifecycle marker into the persistent log. */
  breadcrumb(name: string, data?: unknown): void;
  /** Allow the persistent tab log to begin flushing (after boot). */
  start(): void;
  setRepo(repo: unknown): void;
  setModuleWatcher(moduleWatcher: unknown): void;
  setPlugins(plugins: unknown): void;
  setAccountUrl(url: string | undefined): void;
  setConfig(config: Record<string, unknown>): void;
  setHive(hive: unknown): void;
}

async function safe<T>(
  label: string,
  errors: string[],
  fn: () => Promise<T> | T,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    errors.push(`${label}: ${String(err)}`);
    return fallback;
  }
}

class TabDiagnosticsImpl implements TabDiagnostics {
  readonly #log: RingLogger;
  readonly #siteName: string;
  #repo: any;
  #moduleWatcher: any;
  #plugins: any;
  #hive: any;
  #accountUrl: string | undefined;
  #config: Record<string, unknown> = {};
  #lastBundle: { filename: string; blob: Blob } | undefined;

  constructor(siteName: string, log: RingLogger) {
    this.#siteName = siteName;
    this.#log = log;
  }

  start(): void {
    this.#log.start();
  }

  setRepo(repo: unknown): void {
    this.#repo = repo;
  }
  setModuleWatcher(moduleWatcher: unknown): void {
    this.#moduleWatcher = moduleWatcher;
  }
  setPlugins(plugins: unknown): void {
    this.#plugins = plugins;
  }
  setAccountUrl(url: string | undefined): void {
    this.#accountUrl = url;
  }
  setConfig(config: Record<string, unknown>): void {
    this.#config = config;
  }
  setHive(hive: unknown): void {
    this.#hive = hive;
  }

  breadcrumb(name: string, data?: unknown): void {
    this.#log.record("info", [
      "[breadcrumb]",
      name,
      ...(data === undefined ? [] : [data]),
    ]);
  }

  async export(): Promise<DiagnosticsExportResult> {
    const startedAt = Date.now();
    this.breadcrumb("diagnostics-export-start");
    console.warn(
      `[patchwork] Generating diagnostics bundle.\n${SECRETS_WARNING}`
    );

    const errors: string[] = [];

    const environment = await safe(
      "environment",
      errors,
      () => collectEnvironment(this.#siteName),
      {}
    );
    const tabRepo = await safe(
      "tabRepo",
      errors,
      () => collectRepo(this.#repo),
      null
    );
    const modules = await safe(
      "modules",
      errors,
      () => collectModules(this.#moduleWatcher),
      null
    );
    const pluginsInfo = await safe(
      "plugins",
      errors,
      () => collectPlugins(this.#plugins),
      null
    );

    const worker = await safe(
      "worker",
      errors,
      () => requestWorkerDiagnostics(PER_SOURCE_TIMEOUT_MS),
      null
    );
    const serviceWorker = await safe(
      "serviceWorker",
      errors,
      () => requestServiceWorkerDiagnostics(PER_SOURCE_TIMEOUT_MS),
      null
    );

    const idb = await safe(
      "idb",
      errors,
      () =>
        dumpAllDatabases({
          fallbackNames: [
            "automerge",
            `${this.#siteName}-keyhive`,
            "subduction-signer",
          ],
          exclude: (name) => name.startsWith("patchwork-logs-"),
        }),
      { dumps: [], databases: [], errors: ["idb dump did not run"] }
    );

    const tabLogs = await safe(
      "tabLogs",
      errors,
      () => this.#log.readForExport(),
      {
        entries: [],
        dropped: 0,
      }
    );

    const manifest = {
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      binFormatVersion: BIN_FORMAT_VERSION,
      WARNING: SECRETS_WARNING,
      generatedAt: new Date(startedAt).toISOString(),
      generationMs: Date.now() - startedAt,
      siteName: this.#siteName,
      config: this.#config,
      accountUrl: this.#accountUrl ?? null,
      environment,
      tabRepo,
      modules,
      plugins: pluginsInfo,
      // Logs go to logs/{worker,sw}.log; keep them out of the manifest to avoid
      // duplicating (potentially large) log arrays.
      worker: withoutLogs(worker),
      serviceWorker: withoutLogs(serviceWorker),
      idb: {
        databases: idb.databases,
        stores: idb.dumps.map((d) => ({
          db: d.db,
          store: d.store,
          recordCount: d.index.recordCount,
          byteLength: d.index.byteLength,
          truncated: d.index.truncated ?? false,
        })),
        errors: idb.errors,
      },
      logs: {
        tab: { count: tabLogs.entries.length, dropped: tabLogs.dropped },
        worker: {
          count: worker?.logs?.length ?? 0,
          dropped: worker?.logsDropped ?? 0,
        },
        sw: {
          count: serviceWorker?.logs?.length ?? 0,
          dropped: serviceWorker?.logsDropped ?? 0,
        },
      },
      collectionErrors: errors,
    };

    const files: Zippable = {
      "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
      "logs/tab.log": strToU8(formatLogEntries(tabLogs.entries)),
      "logs/worker.log": strToU8(formatLogEntries(worker?.logs ?? [])),
      "logs/sw.log": strToU8(formatLogEntries(serviceWorker?.logs ?? [])),
    };
    for (const dump of idb.dumps) {
      const base = `idb/${sanitize(dump.db)}.${sanitize(dump.store)}`;
      files[`${base}.index.json`] = strToU8(JSON.stringify(dump.index));
      // Automerge chunks are near-incompressible; store the raw bin without
      // deflate (level 0) so we don't burn CPU on it.
      files[`${base}.bin`] = [dump.bin, { level: 0 }];
    }

    const zipped = zipSync(files, { level: 6 });

    const keyTag = worker?.signer?.verifyingKeyHex?.slice(0, 8) ?? "nokey";
    const stamp = new Date(startedAt).toISOString().replace(/[:.]/g, "-");
    const filename = `patchwork-diagnostics-${sanitize(this.#siteName)}-${keyTag}-${stamp}.zip`;

    const blob = downloadZip(zipped, filename);
    this.#lastBundle = { filename, blob };

    this.breadcrumb("diagnostics-export-done", {
      filename,
      bytes: zipped.byteLength,
    });
    console.info(
      `[patchwork] diagnostics bundle ready: ${filename} (${formatBytes(zipped.byteLength)}). ` +
        `If the download didn't start, run window.patchwork.diagnostics.redownload().`
    );

    return { filename, bytes: zipped.byteLength };
  }

  redownload(): boolean {
    if (!this.#lastBundle) {
      console.warn(
        "[patchwork] no diagnostics bundle yet — run export() first"
      );
      return false;
    }
    triggerDownload(this.#lastBundle.blob, this.#lastBundle.filename);
    return true;
  }
}

let singleton: TabDiagnosticsImpl | undefined;

/**
 * Install the tab-side diagnostics surface. Idempotent. Should be called as
 * early as possible in boot (before the awaits that can hang) so the trigger
 * and log capture exist even when boot wedges.
 */
export function initTabDiagnostics(options: {
  siteName: string;
}): TabDiagnostics {
  if (singleton) return singleton;

  const log = new RingLogger("tab");
  installConsoleCapture(log);

  singleton = new TabDiagnosticsImpl(options.siteName, log);
  try {
    if (!(globalThis as any).patchwork) (globalThis as any).patchwork = {};
    (globalThis as any).patchwork.diagnostics = singleton;
  } catch {
    // non-window context — ignore
  }
  singleton.breadcrumb("tab-diagnostics-installed");
  return singleton;
}

// ─── Console / error capture ─────────────────────────────────────────────

let consolePatched = false;

function installConsoleCapture(log: RingLogger): void {
  if (consolePatched) return;
  consolePatched = true;

  for (const level of ["log", "info", "warn", "error", "debug"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: any[]) => {
      original(...args);
      log.record(level, args);
    };
  }

  try {
    globalThis.addEventListener?.("error", (event: any) => {
      log.record("error", [
        `uncaught error: ${event?.message}`,
        event?.error instanceof Error ? event.error.stack : undefined,
      ]);
    });
    globalThis.addEventListener?.("unhandledrejection", (event: any) => {
      const reason = event?.reason;
      log.record("error", [
        "unhandled rejection:",
        reason instanceof Error ? reason.stack || reason.message : reason,
      ]);
    });
  } catch {
    // addEventListener unavailable — fine
  }
}

// ─── Collectors ──────────────────────────────────────────────────────────

async function collectEnvironment(
  siteName: string
): Promise<Record<string, unknown>> {
  const now = Date.now();
  const nav: any = typeof navigator !== "undefined" ? navigator : {};
  const env: Record<string, unknown> = {};

  // Time — captured prominently for cross-timezone correlation with your logs.
  const resolved = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions();
    } catch {
      return {} as Intl.ResolvedDateTimeFormatOptions;
    }
  })();
  env.time = {
    iso: new Date(now).toISOString(),
    epochMs: now,
    timezone: resolved.timeZone ?? null,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    locale: resolved.locale ?? null,
  };

  env.siteName = siteName;
  if (typeof location !== "undefined") {
    env.url = location.href;
    env.hash = location.hash;
    env.origin = location.origin;
  }
  if (typeof document !== "undefined") {
    env.referrer = document.referrer;
    env.visibilityState = document.visibilityState;
  }
  env.online = nav.onLine ?? null;

  // Browser / OS — accurate version + platform via UA Client Hints when
  // available, with a UA-string fallback.
  const browser: Record<string, unknown> = {
    userAgent: nav.userAgent ?? null,
    appVersion: nav.appVersion ?? null,
    platform: nav.platform ?? null,
    vendor: nav.vendor ?? null,
    language: nav.language ?? null,
    languages: nav.languages ?? null,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    deviceMemory: nav.deviceMemory ?? null,
    maxTouchPoints: nav.maxTouchPoints ?? null,
    cookieEnabled: nav.cookieEnabled ?? null,
  };
  const uaData = nav.userAgentData;
  if (uaData) {
    browser.uaDataBrands = uaData.brands;
    browser.uaDataMobile = uaData.mobile;
    browser.uaDataPlatform = uaData.platform;
    try {
      browser.uaDataHighEntropy = await uaData.getHighEntropyValues([
        "architecture",
        "bitness",
        "model",
        "platformVersion",
        "uaFullVersion",
        "fullVersionList",
        "formFactor",
      ]);
    } catch (err) {
      browser.uaDataHighEntropyError = String(err);
    }
  }
  env.browser = browser;

  if (typeof screen !== "undefined") {
    env.screen = {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      devicePixelRatio:
        typeof window !== "undefined" ? window.devicePixelRatio : null,
      innerWidth: typeof window !== "undefined" ? window.innerWidth : null,
      innerHeight: typeof window !== "undefined" ? window.innerHeight : null,
    };
  }

  // Storage quota / persistence + JS heap.
  const storage: Record<string, unknown> = {};
  try {
    if (nav.storage?.estimate) {
      const est = await nav.storage.estimate();
      storage.usage = est.usage;
      storage.quota = est.quota;
      storage.usageDetails = (est as any).usageDetails ?? null;
    }
    if (nav.storage?.persisted)
      storage.persisted = await nav.storage.persisted();
  } catch (err) {
    storage.error = String(err);
  }
  env.storage = storage;

  const perfMemory =
    (typeof performance !== "undefined" && (performance as any).memory) || null;
  if (perfMemory) {
    env.memory = {
      jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
      totalJSHeapSize: perfMemory.totalJSHeapSize,
      usedJSHeapSize: perfMemory.usedJSHeapSize,
    };
  }

  // Support flags — a missing SharedWorker (Chrome Android, some Safari) may
  // itself be the failure, so record availability explicitly.
  env.support = {
    serviceWorker:
      typeof navigator !== "undefined" && "serviceWorker" in navigator,
    serviceWorkerController:
      typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller,
    sharedWorker: typeof SharedWorker !== "undefined",
    indexedDB: typeof indexedDB !== "undefined",
    storageManager: !!nav.storage,
    userAgentData: !!uaData,
    crossOriginIsolated:
      typeof globalThis !== "undefined"
        ? ((globalThis as any).crossOriginIsolated ?? null)
        : null,
  };

  // Full localStorage dump (per "dump everything").
  const ls: Record<string, string | null> = {};
  try {
    if (typeof localStorage !== "undefined") {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key != null) ls[key] = localStorage.getItem(key);
      }
    }
  } catch (err) {
    (ls as Record<string, unknown>).__error = String(err);
  }
  env.localStorage = ls;

  // Service worker registration details (stale/waiting SW is a classic bug).
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      const w = (worker: ServiceWorker | null) =>
        worker ? { scriptURL: worker.scriptURL, state: worker.state } : null;
      env.serviceWorkerRegistration = {
        scope: reg.scope,
        updateViaCache: reg.updateViaCache,
        active: w(reg.active),
        installing: w(reg.installing),
        waiting: w(reg.waiting),
      };
    }
  } catch (err) {
    env.serviceWorkerRegistrationError = String(err);
  }

  return env;
}

function collectRepo(repo: any): Record<string, unknown> | null {
  if (!repo) return null;
  const handlesRecord: Record<string, any> = repo.handles ?? {};
  const handles = Object.entries(handlesRecord).map(([documentId, handle]) => {
    let state: string | undefined;
    let heads: string[] | null | undefined;
    try {
      state = handle?.state;
    } catch {}
    try {
      heads = handle?.heads?.() ?? null;
    } catch {
      heads = null;
    }
    return { documentId, state, heads };
  });
  const peers = (repo.peers ?? []).map((p: unknown) => String(p));
  return {
    peerId: repo.peerId != null ? String(repo.peerId) : null,
    peers,
    peerCount: peers.length,
    handleCount: handles.length,
    handles,
  };
}

function collectModules(moduleWatcher: any): Record<string, unknown> | null {
  if (!moduleWatcher) return null;
  const settingsHandles: Record<string, unknown> = {};
  for (const [name, handle] of Object.entries(moduleWatcher.handles ?? {})) {
    let doc: any;
    try {
      doc = (handle as any)?.doc?.();
    } catch {}
    settingsHandles[name] = {
      url: (handle as any)?.url ?? null,
      modules: doc?.modules ?? null,
      branches: doc?.branches ?? null,
    };
  }
  return {
    urls: moduleWatcher.urls ?? null,
    settingsHandles,
    staticManifests: moduleWatcher.staticManifests ?? null,
  };
}

function collectPlugins(plugins: any): Record<string, unknown> | null {
  const getAllRegistries = plugins?.getAllRegistries;
  if (typeof getAllRegistries !== "function") return null;
  const out: Record<string, unknown> = {};
  const registries: Map<string, any> = getAllRegistries();
  for (const [type, registry] of registries) {
    try {
      out[type] = registry
        .all()
        .map((p: any) => ({ id: p.id, importUrl: p.importUrl }));
    } catch (err) {
      out[type] = { error: String(err) };
    }
  }
  return out;
}

// ─── Download helpers ────────────────────────────────────────────────────

function downloadZip(bytes: Uint8Array, filename: string): Blob {
  const blob = new Blob([bytes as BlobPart], { type: "application/zip" });
  triggerDownload(blob, filename);
  return blob;
}

function triggerDownload(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    console.error(
      "[patchwork] diagnostics download failed; the bundle is on " +
        "window.patchwork.diagnostics — call redownload() to retry",
      err
    );
  }
}

/** Drop the `logs` array from a worker/SW snapshot for the manifest (the logs
 * ship as separate `logs/*.log` files). */
function withoutLogs(
  snapshot: { logs?: unknown } | null
): Record<string, unknown> | null {
  if (!snapshot) return null;
  const rest: Record<string, unknown> = { ...snapshot };
  delete rest.logs;
  return rest;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}
