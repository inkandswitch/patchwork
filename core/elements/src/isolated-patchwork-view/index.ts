/**
 * <isolated-patchwork-view> — renders a patchwork tool inside a srcdoc iframe.
 *
 * Same external interface as <patchwork-view> (attributes: doc-url;
 * events: patchwork:mounted, patchwork:open-document) but the tool runs in
 * an iframe with a null origin (srcdoc), no service worker, and no IndexedDB.
 *
 * Tool resolution is deferred to the iframe — the host never pre-resolves
 * which tool to use. Instead, the iframe requests tool information via a
 * PluginRegistryCapability granted through capnweb RPC.
 *
 * Plugin/tool source code is served through package URLs (`/pkg:name/...`)
 * that replace automerge document IDs with package names. Automerge URLs never flow
 * from host to iframe — only from iframe to host (for document references).
 *
 * Host↔iframe communication uses capnweb RPC over MessagePort for type-safe
 * bidirectional method calls with object-capability semantics. A minimal
 * postMessage bootstrap loads capnweb itself before RPC takes over.
 */

import { type AutomergeUrl, type DocumentId, type DocHandle, type PeerId, type Repo, Repo as RepoClass, isValidAutomergeUrl, parseAutomergeUrl } from "@automerge/automerge-repo";
import { MessageChannelNetworkAdapter } from "@automerge/automerge-repo-network-messagechannel";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { RpcTarget, newMessagePortRpcSession } from "capnweb";
import type { RpcStub } from "capnweb";
import {
  getRegistry,
  getAllRegistries,
  getFallbackTool,
  getSupportedTools,
  getSupportedToolsForType,
  type PluginDescription,
  type AccountDoc,
} from "@inkandswitch/patchwork-plugins";
import {
  type HasPatchworkMetadata,
  type FolderDoc,
  type BranchesDoc,
  type ModuleSettingsDoc,
  getImportableUrlFromAutomergeUrl,
  resolvePackageExport,
} from "@inkandswitch/patchwork-filesystem";
import { MountedEvent, OpenDocumentEvent } from "../events.js";
import type {
  HostRpcContract,
  IframeRpcContract,
  PluginMetadata,
  PluginRegistryCapability,
} from "./rpc-types.js";
import { type ResourcePolicy, RestrictivePolicy } from "./resource-policy.js";
import getSrcdocHtml from "./srcdoc.js";
import debug from "debug";

const log = debug("patchwork:elements:isolated-view");

// ---------------------------------------------------------------------------
// Import map resolution
// ---------------------------------------------------------------------------

interface ImportMap {
  imports?: Record<string, string>;
  scopes?: Record<string, Record<string, string>>;
}

/** Resolve the host importmap entries to absolute URLs. */
function resolveImportMap(importMap: ImportMap, baseURI: string): ImportMap {
  const resolved: ImportMap = {};
  if (importMap.imports) {
    resolved.imports = {};
    for (const [key, value] of Object.entries(importMap.imports)) {
      try {
        resolved.imports[key] = new URL(value, baseURI).href;
      } catch {
        resolved.imports[key] = value;
      }
    }
  }
  if (importMap.scopes) {
    resolved.scopes = {};
    for (const [scopeKey, scopeMap] of Object.entries(importMap.scopes)) {
      let rk: string;
      try {
        rk = new URL(scopeKey, baseURI).href;
      } catch {
        rk = scopeKey;
      }
      resolved.scopes[rk] = {};
      for (const [k, v] of Object.entries(scopeMap)) {
        try {
          resolved.scopes[rk][k] = new URL(v, baseURI).href;
        } catch {
          resolved.scopes[rk][k] = v;
        }
      }
    }
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// SyncAllowlist — controls which documents the iframe can sync
// ---------------------------------------------------------------------------

/**
 * Maintains a set of document IDs that the iframe is allowed to sync.
 * Used by the intermediary repo's shareConfig to gate document access.
 */
class SyncAllowlist {
  #allowed = new Set<DocumentId>();

  add(url: AutomergeUrl): void {
    const { documentId } = parseAutomergeUrl(url);
    this.#allowed.add(documentId);
  }

  has(documentId: DocumentId): boolean {
    return this.#allowed.has(documentId);
  }

  hasUrl(url: AutomergeUrl): boolean {
    const { documentId } = parseAutomergeUrl(url);
    return this.#allowed.has(documentId);
  }
}

// ---------------------------------------------------------------------------
// SyncDenylist — documents that must never sync to the iframe
// ---------------------------------------------------------------------------

/**
 * Maintains a set of document IDs that must never be synced to the iframe,
 * regardless of allowlist status. Takes precedence over the allowlist.
 * Used to protect sensitive documents: account doc, module settings,
 * tool/package source code, and branches docs.
 */
class SyncDenylist {
  #denied = new Set<DocumentId>();

  add(url: AutomergeUrl): void {
    const { documentId } = parseAutomergeUrl(url);
    this.#denied.add(documentId);
  }

  has(documentId: DocumentId): boolean {
    return this.#denied.has(documentId);
  }

  hasUrl(url: AutomergeUrl): boolean {
    const { documentId } = parseAutomergeUrl(url);
    return this.#denied.has(documentId);
  }

  get size(): number {
    return this.#denied.size;
  }
}

// ---------------------------------------------------------------------------
// Recursive automerge URL collection
// ---------------------------------------------------------------------------

/** Keys to skip when scanning for automerge URLs in documents. */
const SKIP_KEYS = new Set(["@patchwork"]);

/**
 * Recursively walks a value and collects all valid automerge URLs found.
 * Skips subtrees under keys listed in SKIP_KEYS (e.g. @patchwork metadata).
 */
function collectAutomergeUrls(
  value: unknown,
  urls: Set<AutomergeUrl>,
  key?: string
): void {
  if (key && SKIP_KEYS.has(key)) return;
  if (typeof value === "string") {
    if (isValidAutomergeUrl(value)) urls.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectAutomergeUrls(item, urls);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>))
      collectAutomergeUrls(v, urls, k);
  }
}

// ---------------------------------------------------------------------------
// Denylist population — blocks sensitive documents from syncing to iframe
// ---------------------------------------------------------------------------

/**
 * Denylist a FolderDoc and all its child documents.
 */
async function denylistFolderDoc(
  repo: Repo,
  folderUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(folderUrl);
  try {
    const handle = await repo.find<FolderDoc>(folderUrl);
    await handle.whenReady();
    const doc = handle.doc();
    for (const docLink of doc?.docs ?? []) {
      denylist.add(docLink.url);
    }
  } catch (err) {
    log("denylistFolderDoc: failed to read folder %s: %o", folderUrl, err);
  }
}

/**
 * Denylist a module entry (either a BranchesDoc or a direct FolderDoc)
 * and all its transitive children.
 */
async function denylistModuleEntry(
  repo: Repo,
  moduleUrl: AutomergeUrl,
  denylist: SyncDenylist
): Promise<void> {
  denylist.add(moduleUrl);
  try {
    const handle = await repo.find<HasPatchworkMetadata>(moduleUrl);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      const branchesDoc = doc as unknown as BranchesDoc;
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
      }
    } else {
      await denylistFolderDoc(repo, moduleUrl, denylist);
    }
  } catch (err) {
    log("denylistModuleEntry: failed to read module %s: %o", moduleUrl, err);
  }
}

/**
 * Populate the denylist with all sensitive documents: account doc,
 * module settings docs, and all tool/package source code documents.
 */
async function populateDenylist(
  repo: Repo,
  denylist: SyncDenylist
): Promise<void> {
  // 1. Account document and its persistent denylist document
  const accountHandle = (window as any).accountDocHandle;
  if (accountHandle?.url) {
    denylist.add(accountHandle.url);
    const denylistDocUrl = accountHandle.doc()?.denylistDocUrl;
    if (denylistDocUrl) {
      denylist.add(denylistDocUrl);
    }
  }

  // 2. Module settings documents (from ModuleWatcher)
  const moduleWatcher = (window as any).patchwork?.packages;
  const moduleSettingsUrls: AutomergeUrl[] = [];
  if (moduleWatcher?.urls) {
    for (const url of Object.values(moduleWatcher.urls) as AutomergeUrl[]) {
      if (isValidAutomergeUrl(url)) {
        denylist.add(url);
        moduleSettingsUrls.push(url);
      }
    }
  }

  // 3. Walk module settings → module entries → folder docs → children
  for (const settingsUrl of moduleSettingsUrls) {
    try {
      const handle = await repo.find<ModuleSettingsDoc>(settingsUrl);
      await handle.whenReady();
      const doc = handle.doc();
      for (const moduleUrl of doc?.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
    } catch (err) {
      log("populateDenylist: failed to read module settings %s: %o", settingsUrl, err);
    }
  }

  // 4. Denylist all plugin importUrls from the registry as a catch-all
  for (const [, registry] of getAllRegistries()) {
    for (const plugin of registry.all()) {
      if (plugin.importUrl && isValidAutomergeUrl(plugin.importUrl as string)) {
        await denylistModuleEntry(repo, plugin.importUrl as AutomergeUrl, denylist);
      }
    }
  }

  log("denylist populated with %d documents", denylist.size);
}

/**
 * Check if a document is a sensitive type (branches doc or module settings)
 * and dynamically add it to the denylist if so. Called when URLs are about to
 * be added to the allowlist to prevent sensitive documents from leaking through
 * document content.
 *
 * Returns true if the document was denylisted (caller should skip allowlisting).
 */
async function checkAndDenylistIfSensitive(
  repo: Repo,
  url: AutomergeUrl,
  denylist: SyncDenylist
): Promise<boolean> {
  if (denylist.hasUrl(url)) return true;

  try {
    const handle = await repo.find<HasPatchworkMetadata>(url);
    await handle.whenReady();
    const doc = handle.doc();
    const type = doc?.["@patchwork"]?.type;

    if (type === "branches") {
      log("dynamically denylisting branches doc: %s", url);
      const branchesDoc = doc as unknown as BranchesDoc;
      denylist.add(url);
      for (const branchUrl of Object.values(branchesDoc.branches ?? {})) {
        await denylistFolderDoc(repo, branchUrl, denylist);
      }
      return true;
    }

    if (type === "patchwork:module-settings") {
      log("dynamically denylisting module settings doc: %s", url);
      denylist.add(url);
      const settingsDoc = doc as unknown as ModuleSettingsDoc;
      for (const moduleUrl of settingsDoc.modules ?? []) {
        await denylistModuleEntry(repo, moduleUrl, denylist);
      }
      return true;
    }

    if (type === "patchwork:denylist") {
      log("dynamically denylisting denylist doc: %s", url);
      denylist.add(url);
      return true;
    }
  } catch (err) {
    log("checkAndDenylistIfSensitive: failed to read %s: %o", url, err);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Local-existence check — detects unknown (potentially malicious) documents
// ---------------------------------------------------------------------------

/**
 * Check whether a document exists in local IndexedDB storage using a
 * storage-only repo (no network adapters). Returns quickly in both cases:
 * - Document exists → storage loads it → query reaches `ready` → true
 * - Document doesn't exist → storage reports unavailable → false
 */
async function isDocumentLocal(
  localCheckRepo: RepoClass,
  url: AutomergeUrl
): Promise<boolean> {
  const progress = localCheckRepo.findWithProgress(url);
  const state = progress.peek();
  if (state.state === "ready") return true;
  if (state.state === "unavailable") return false;
  return new Promise((resolve) => {
    const unsub = progress.subscribe((s) => {
      if (s.state === "ready") { unsub(); resolve(true); }
      if (s.state === "unavailable" || s.state === "failed") {
        unsub();
        resolve(false);
      }
    });
  });
}

/**
 * Check whether a URL is a direct child of the user's root folder.
 * Documents in the root folder are trusted even if not yet in local storage.
 */
async function isInRootFolder(
  repo: Repo,
  url: AutomergeUrl
): Promise<boolean> {
  const accountHandle = (window as any).accountDocHandle;
  const rootFolderUrl = accountHandle?.doc()?.rootFolderUrl;
  if (!rootFolderUrl) return false;
  try {
    const rootHandle = await repo.find<FolderDoc>(rootFolderUrl);
    await rootHandle.whenReady();
    const rootDoc = rootHandle.doc();
    for (const docLink of rootDoc?.docs ?? []) {
      if (docLink.url === url) return true;
    }
  } catch (err) {
    log("isInRootFolder: failed to read root folder: %o", err);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Persistent denylist — user-denied documents stored across sessions
// ---------------------------------------------------------------------------

type DenylistDoc = {
  deniedDocuments: AutomergeUrl[];
  "@patchwork": { type: "patchwork:denylist" };
};

/**
 * Wraps a dedicated denylist document for persisting user denials across
 * sessions. The denylist doc is lazily created on first denial and its URL
 * is stored on the account document. The denylist doc itself is
 * session-denylisted so the iframe cannot read it.
 */
class PersistentDenylist {
  #repo: Repo;
  #accountHandle: DocHandle<AccountDoc & HasPatchworkMetadata>;
  #handle: DocHandle<DenylistDoc> | null = null;
  #cache = new Set<string>();

  constructor(
    repo: Repo,
    accountHandle: DocHandle<AccountDoc & HasPatchworkMetadata>
  ) {
    this.#repo = repo;
    this.#accountHandle = accountHandle;
  }

  async init(): Promise<void> {
    const url = (this.#accountHandle.doc() as any)?.denylistDocUrl as
      | AutomergeUrl
      | undefined;
    if (url) {
      this.#handle = await this.#repo.find<DenylistDoc>(url);
      await this.#handle.whenReady();
      for (const u of this.#handle.doc()?.deniedDocuments ?? []) {
        this.#cache.add(u);
      }
    }
  }

  get docUrl(): AutomergeUrl | undefined {
    return this.#handle?.url;
  }

  hasUrl(url: AutomergeUrl): boolean {
    return this.#cache.has(url);
  }

  deny(url: AutomergeUrl): void {
    if (this.#cache.has(url)) return;
    this.#cache.add(url);
    if (!this.#handle) {
      this.#handle = this.#repo.create<DenylistDoc>();
      this.#handle.change((doc: any) => {
        doc["@patchwork"] = { type: "patchwork:denylist" };
        doc.deniedDocuments = [];
      });
      this.#accountHandle.change((doc: any) => {
        doc.denylistDocUrl = this.#handle!.url;
      });
    }
    this.#handle.change((doc: any) => {
      doc.deniedDocuments.push(url);
    });
  }
}

// ---------------------------------------------------------------------------
// Plugin entry point resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a plugin's automerge import URL to an absolute entry point URL
 * and the package name from package.json. The returned URL contains the
 * automerge document ID in the path — the PackageUrlMapper replaces this
 * with the package name before exposing it to the iframe.
 */
async function resolvePluginEntryUrl(
  importUrl: string
): Promise<{ entryUrl: string; packageName?: string } | undefined> {
  const folderPath = getImportableUrlFromAutomergeUrl(
    importUrl as AutomergeUrl
  );
  const base = new URL(folderPath, window.location.origin);
  const packageJsonUrl = new URL("package.json", base).href;

  const response = await fetch(packageJsonUrl);
  if (!response.ok) return undefined;

  const pkgJson = await response.json();
  const entryPoint = resolvePackageExport(pkgJson);
  if (!entryPoint) return undefined;

  return {
    entryUrl: new URL(entryPoint, base).href,
    packageName: pkgJson.name,
  };
}

// ---------------------------------------------------------------------------
// PackageUrlMapper — replaces automerge document IDs with package names
// ---------------------------------------------------------------------------

/**
 * Replaces automerge document ID segments in URLs with package names to
 * hide tool source code locations from the iframe. The real URL
 * `http://host/%automerge%3Axyz.../dist/index.js` becomes
 * `http://host/pkg:@patchwork--folder/dist/index.js`.
 *
 * When a package name is provided (from package.json), it is used as the
 * URL segment. Otherwise falls back to `unknown-0`, `unknown-1`, etc.
 *
 * Uses standard URL parsing and `isValidAutomergeUrl` to identify automerge
 * segments rather than regex matching.
 */
class PackageUrlMapper {
  #counter = 0;
  #segmentToPackage = new Map<string, string>();
  #packageToSegment = new Map<string, string>();

  /**
   * Sanitize a package name for use as a URL path segment.
   * "@patchwork/folder" -> "@patchwork--folder"
   * "@grjte/codemirror-base" -> "@grjte--codemirror-base"
   * "folder" -> "folder"
   */
  #sanitizeName(name: string): string {
    return name.replace(/\//g, "--");
  }

  /**
   * Replace the automerge URL segment in a full URL with a package name.
   * If the segment hasn't been seen before, registers a new mapping.
   * Returns the URL unchanged if no automerge segment is found.
   */
  toPackageUrl(url: string, name?: string): string {
    // Check if we've already mapped a segment in this URL.
    // Match with surrounding `/` delimiters to avoid substring collisions,
    // consistent with toAutomergeUrl's trailing-slash approach.
    for (const [segment, pkg] of this.#segmentToPackage) {
      const from = `/${segment}/`;
      if (url.includes(from)) {
        return url.replace(from, `/pkg:${pkg}/`);
      }
    }
    // Not registered yet — find the automerge URL segment via URL parsing
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split("/").filter(Boolean);
      for (const segment of segments) {
        const decoded = decodeURIComponent(segment);
        if (isValidAutomergeUrl(decoded)) {
          const pkg = name
            ? this.#sanitizeName(name)
            : `unknown-${this.#counter++}`;
          this.#segmentToPackage.set(segment, pkg);
          this.#packageToSegment.set(pkg, segment);
          return url.replace(`/${segment}/`, `/pkg:${pkg}/`);
        }
      }
    } catch {
      // not a valid URL, return as-is
    }
    return url;
  }

  /**
   * Replace the package name in a URL with the real automerge URL segment.
   * Returns null if no package name segment is found.
   */
  toAutomergeUrl(url: string): string | null {
    for (const [pkg, segment] of this.#packageToSegment) {
      // Use trailing slash to avoid prefix matches
      // e.g., pkg:folder/ must not match pkg:folder-viewer/
      const packageSegment = `pkg:${pkg}/`;
      if (url.includes(packageSegment)) {
        return url.replace(packageSegment, `${segment}/`);
      }
    }
    return null;
  }

  /**
   * Rewrite automerge URL strings in module source text, replacing them with
   * package name equivalents. This runs on the host before sending source to
   * the iframe, so real automerge URLs never enter the isolated context.
   */
  rewriteAutomergeUrls(source: string): string {
    for (const [segment, pkg] of this.#segmentToPackage) {
      const decoded = decodeURIComponent(segment);
      source = source.replaceAll(decoded, `pkg:${pkg}`);
    }
    return source;
  }
}

// ---------------------------------------------------------------------------
// Plugin metadata conversion
// ---------------------------------------------------------------------------

/**
 * Convert a host-side PluginDescription to a PluginMetadata object suitable
 * for sending to the iframe. Copies known optional fields; the caller provides
 * the already-mapped importUrl.
 */
function pluginToMetadata(
  plugin: PluginDescription,
  importUrl: string,
): PluginMetadata {
  const meta: PluginMetadata = {
    id: plugin.id,
    type: plugin.type,
    name: plugin.name,
    importUrl,
  };
  if (plugin.icon != null) meta.icon = plugin.icon;
  if ("unlisted" in plugin) meta.unlisted = (plugin as any).unlisted;
  if ("supportedDatatypes" in plugin)
    meta.supportedDatatypes = (plugin as any).supportedDatatypes;
  if ("tags" in plugin) meta.tags = (plugin as any).tags;
  if ("forTitleBar" in plugin) meta.forTitleBar = (plugin as any).forTitleBar;
  return meta;
}

// ---------------------------------------------------------------------------
// PluginRegistryTarget — capnweb capability for querying the plugin registry
// ---------------------------------------------------------------------------

/**
 * Host-side capability that the iframe receives as a capnweb stub. Each
 * method call is proxied back to this target on the host.
 */
class PluginRegistryTarget extends RpcTarget implements PluginRegistryCapability {
  #repo: Repo;
  #mapper: PackageUrlMapper;

  constructor(repo: Repo, mapper: PackageUrlMapper) {
    super();
    this.#repo = repo;
    this.#mapper = mapper;
  }

  /**
   * Convert a host-side plugin object to PluginMetadata with a package
   * importUrl. Returns null if the plugin has no importUrl or entry point
   * resolution fails (e.g., plugin not synced locally).
   */
  async #toMetadata(plugin: PluginDescription): Promise<PluginMetadata | null> {
    if (!plugin.importUrl) return null;

    const resolved = await resolvePluginEntryUrl(plugin.importUrl);
    if (!resolved) return null;

    return pluginToMetadata(
      plugin,
      this.#mapper.toPackageUrl(resolved.entryUrl, resolved.packageName),
    );
  }

  async list(pluginType: string): Promise<PluginMetadata[]> {
    const registry = getRegistry(pluginType);
    const all = registry.all();
    const results = await Promise.all(all.map((p) => this.#toMetadata(p)));
    return results.filter((m): m is PluginMetadata => m != null);
  }

  async listRegistryTypes(): Promise<string[]> {
    return Array.from(getAllRegistries().keys());
  }

  async get(pluginId: string): Promise<PluginMetadata | null> {
    // Search across all registry types
    for (const [, registry] of getAllRegistries()) {
      const plugin = registry.get(pluginId);
      if (plugin) return this.#toMetadata(plugin);
    }
    return null;
  }

  async getSupportedToolsForType(type: string): Promise<PluginMetadata[]> {
    const tools = getSupportedToolsForType(type);
    const results = await Promise.all(tools.map((t) => this.#toMetadata(t)));
    return results.filter((m): m is PluginMetadata => m != null);
  }

  async getFallbackTool(docUrl: string): Promise<PluginMetadata | null> {
    const handle = await this.#repo.find<HasPatchworkMetadata>(
      docUrl as AutomergeUrl
    );
    const doc = handle.doc();
    if (!doc) return null;

    const tool = getFallbackTool(doc);
    if (!tool) return null;

    return this.#toMetadata(tool);
  }

  async getSupportedTools(docUrl: string): Promise<PluginMetadata[]> {
    const handle = await this.#repo.find<HasPatchworkMetadata>(
      docUrl as AutomergeUrl
    );
    const doc = handle.doc();
    if (!doc) return [];

    const tools = getSupportedTools(doc);
    const results = await Promise.all(tools.map((t) => this.#toMetadata(t)));
    return results.filter((m): m is PluginMetadata => m != null);
  }
}

// ---------------------------------------------------------------------------
// HostApi — root RPC target exposed to the iframe
// ---------------------------------------------------------------------------

/**
 * Host-side RPC target exposed to the isolated iframe via capnweb.
 * The iframe calls these methods through its RpcStub<HostRpcContract>.
 */
class HostApi extends RpcTarget implements HostRpcContract {
  #element: HTMLElement;
  #policy: ResourcePolicy;
  #repo: Repo;
  #mapper: PackageUrlMapper;
  #registryTarget: PluginRegistryTarget;
  #allowlist: SyncAllowlist;
  #denylist: SyncDenylist;
  #localCheckRepo: RepoClass;
  #persistentDenylist: PersistentDenylist | null;

  constructor(
    element: HTMLElement,
    policy: ResourcePolicy,
    repo: Repo,
    mapper: PackageUrlMapper,
    allowlist: SyncAllowlist,
    denylist: SyncDenylist,
    localCheckRepo: RepoClass,
    persistentDenylist: PersistentDenylist | null
  ) {
    super();
    this.#element = element;
    this.#policy = policy;
    this.#repo = repo;
    this.#mapper = mapper;
    this.#registryTarget = new PluginRegistryTarget(repo, mapper);
    this.#allowlist = allowlist;
    this.#denylist = denylist;
    this.#localCheckRepo = localCheckRepo;
    this.#persistentDenylist = persistentDenylist;
  }

  getPluginRegistry(): PluginRegistryCapability {
    return this.#registryTarget;
  }

  #checkPolicy(url: string): void {
    if (!this.#policy.canFetch(url)) {
      log("policy denied: %s", url);
      throw new Error(`Access denied: ${url}`);
    }
  }

  async loadModuleSource(url: string): Promise<string> {
    // Resolve pkg: URLs back to real automerge-backed paths
    const realUrl = this.#mapper.toAutomergeUrl(url);
    if (realUrl) {
      const res = await fetch(realUrl);
      if (!res.ok) throw new Error(`Failed to load module: ${url} (${res.status})`);
      const source = await res.text();
      return this.#mapper.rewriteAutomergeUrls(source);
    }
    this.#checkPolicy(url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load module: ${url} (${res.status})`);
    return res.text();
  }

  async fetchResource(
    url: string
  ): Promise<{ contentType: string; body: string | Uint8Array }> {
    // Resolve pkg: URLs for fetch too (e.g., CSS, images from tool packages)
    const resolvedUrl = this.#mapper.toAutomergeUrl(url);
    if (!resolvedUrl) {
      this.#checkPolicy(url);
    }
    const realUrl = resolvedUrl ?? url;
    const res = await fetch(realUrl);
    if (!res.ok) throw new Error(`Failed to fetch resource: ${url} (${res.status})`);
    const contentType = res.headers.get("content-type") || "";
    const isBinary =
      contentType.includes("wasm") || contentType.includes("octet-stream");
    if (isBinary) {
      const buf = await res.arrayBuffer();
      return { contentType, body: new Uint8Array(buf) };
    }
    const body = await res.text();
    return { contentType, body };
  }

  onMounted(url: string, toolId: string): void {
    this.#element.dispatchEvent(
      new MountedEvent({ url: url as AutomergeUrl, toolId })
    );
  }

  async #promptUserAccess(
    url: AutomergeUrl,
    title: string,
    type: string
  ): Promise<boolean> {
    return window.confirm(
      `This tool wants to access a document:\n\n` +
      `Title: ${title}\n` +
      `Type: ${type}\n` +
      `URL: ${url}\n\n` +
      `Allow access?`
    );
  }

  /**
   * Shared trust hierarchy check for document access. Returns:
   * - "allowed": document is trusted (allowlisted, local, or in root folder)
   * - "blocked": document is denylisted or sensitive
   * - "unknown": document has never been seen — caller must prompt the user
   */
  async #checkTrustHierarchy(
    automergeUrl: AutomergeUrl
  ): Promise<"allowed" | "blocked" | "unknown"> {
    // 1. Session denylist
    if (this.#denylist.hasUrl(automergeUrl)) {
      log("trust: blocked by session denylist: %s", automergeUrl);
      return "blocked";
    }
    // 2. Persistent denylist
    if (this.#persistentDenylist?.hasUrl(automergeUrl)) {
      log("trust: blocked by persistent denylist: %s", automergeUrl);
      return "blocked";
    }
    // 3. Dynamic sensitive-type check
    const denied = await checkAndDenylistIfSensitive(
      this.#repo, automergeUrl, this.#denylist
    );
    if (denied) {
      log("trust: dynamically denylisted: %s", automergeUrl);
      return "blocked";
    }
    // 4. Already allowlisted
    if (this.#allowlist.hasUrl(automergeUrl)) return "allowed";
    // 5. In root folder → trusted
    if (await isInRootFolder(this.#repo, automergeUrl)) {
      this.#allowlist.add(automergeUrl);
      return "allowed";
    }
    // 6. Exists locally → trusted
    if (await isDocumentLocal(this.#localCheckRepo, automergeUrl)) {
      this.#allowlist.add(automergeUrl);
      return "allowed";
    }
    // 7. Unknown — needs user approval
    return "unknown";
  }

  async onOpenDocument(
    url: string,
    toolId?: string,
    title?: string,
    docType?: string
  ): Promise<void> {
    const automergeUrl = url as AutomergeUrl;

    const trust = await this.#checkTrustHierarchy(automergeUrl);
    if (trust === "blocked") return;

    if (trust === "allowed") {
      this.#element.dispatchEvent(
        new OpenDocumentEvent({
          url: automergeUrl,
          toolId,
          title,
          type: docType,
        })
      );
      return;
    }

    // Unknown document — two-step approval
    const allowSync = window.confirm(
      `Unknown Document\n\n` +
      `A document was found that has never been seen on this device.\n` +
      `This may be an attempt by a tool to access an unauthorized document.\n\n` +
      `URL: ${automergeUrl}\n\n` +
      `Allow syncing this document for preview?`
    );
    if (!allowSync) {
      this.#persistentDenylist?.deny(automergeUrl);
      return;
    }

    const handle = await this.#repo.find<HasPatchworkMetadata>(automergeUrl);
    await handle.whenReady();
    const doc = handle.doc();
    const docTitle = (doc as any)?.title ?? title ?? "Unknown document";
    const docTypeStr = doc?.["@patchwork"]?.type ?? docType ?? "unknown";

    const allowAccess = window.confirm(
      `Document Preview\n\n` +
      `Title: ${docTitle}\n` +
      `Type: ${docTypeStr}\n` +
      `URL: ${automergeUrl}\n\n` +
      `Allow this tool to access this document?`
    );
    if (!allowAccess) {
      this.#persistentDenylist?.deny(automergeUrl);
      return;
    }

    this.#allowlist.add(automergeUrl);
    this.#element.dispatchEvent(
      new OpenDocumentEvent({
        url: automergeUrl,
        toolId,
        title,
        type: docType,
      })
    );
  }

  async requestDocumentAccess(url: string): Promise<boolean> {
    const automergeUrl = url as AutomergeUrl;

    const trust = await this.#checkTrustHierarchy(automergeUrl);
    if (trust === "blocked") return false;
    if (trust === "allowed") return true;

    // Unknown document — two-step approval
    const allowSync = window.confirm(
      `Unknown Document\n\n` +
      `A document was found that has never been seen on this device.\n` +
      `This may be an attempt by a tool to access an unauthorized document.\n\n` +
      `URL: ${automergeUrl}\n\n` +
      `Allow syncing this document for preview?`
    );
    if (!allowSync) {
      this.#persistentDenylist?.deny(automergeUrl);
      return false;
    }

    const handle = await this.#repo.find<HasPatchworkMetadata>(automergeUrl);
    await handle.whenReady();
    const doc = handle.doc();
    const docTitle = (doc as any)?.title ?? "Unknown document";
    const docTypeStr = doc?.["@patchwork"]?.type ?? "unknown";

    const allowAccess = window.confirm(
      `Document Preview\n\n` +
      `Title: ${docTitle}\n` +
      `Type: ${docTypeStr}\n` +
      `URL: ${automergeUrl}\n\n` +
      `Allow this tool to access this document?`
    );
    if (!allowAccess) {
      this.#persistentDenylist?.deny(automergeUrl);
      return false;
    }

    this.#allowlist.add(automergeUrl);
    return true;
  }

}

// ---------------------------------------------------------------------------
// Custom element registration
// ---------------------------------------------------------------------------

export interface RegisterIsolatedPatchworkViewElementParams {
  name?: string;
  repo: Repo;
  /**
   * Optional resource policy factory. Receives the host origin and the set of
   * resolved importmap URLs so the policy can make allowlist decisions.
   * Defaults to RestrictivePolicy (blocks cross-origin and automerge URL paths).
   */
  createPolicy?: (hostOrigin: string, importMapUrls: Set<string>) => ResourcePolicy;
}

export interface IsolatedPatchworkViewElement extends HTMLElement {
  repo: Repo;
  docUrl?: AutomergeUrl;
  toolId?: string;
}

export function registerIsolatedPatchworkViewElement(
  params: RegisterIsolatedPatchworkViewElementParams
) {
  const elementName = params.name ?? "isolated-patchwork-view";
  const repo = params.repo;
  const createPolicy = params.createPolicy ??
    ((hostOrigin: string, importMapUrls: Set<string>) =>
      new RestrictivePolicy(hostOrigin, importMapUrls));

  if (customElements.get(elementName)) {
    console.error(`can't redefine custom element "${elementName}"`);
    return;
  }

  const attrs = {
    docUrl: "doc-url",
    toolId: "tool-id",
  };

  customElements.define(
    elementName,
    class IsolatedPatchworkViewElement extends HTMLElement {
      #docUrl: AutomergeUrl | null = null;
      #toolId: string | null = null;
      #iframe: HTMLIFrameElement | null = null;
      #repoChannel: MessageChannel | null = null;
      #rpcChannel: MessageChannel | null = null;
      #iframeStub: RpcStub<IframeRpcContract> | null = null;
      #initEpoch = 0;
      #readyHandler: ((e: MessageEvent) => void) | null = null;
      #bootstrapChannel: MessageChannel | null = null;
      #registryUnsubs: (() => void)[] = [];
      #intermediaryRepo: RepoClass | null = null;
      #hostRepoAdapter: MessageChannelNetworkAdapter | null = null;
      #intermediaryHostAdapter: MessageChannelNetworkAdapter | null = null;
      #intermediaryIframeAdapter: MessageChannelNetworkAdapter | null = null;
      #hostChannel: MessageChannel | null = null;
      #allowlist: SyncAllowlist | null = null;
      #denylist: SyncDenylist | null = null;
      #localCheckRepo: RepoClass | null = null;
      #persistentDenylist: PersistentDenylist | null = null;
      #rootDocUnsub: (() => void) | null = null;

      get docUrl() {
        return this.#docUrl;
      }

      set docUrl(url: AutomergeUrl | null) {
        if (this.#docUrl === url) return;
        this.#docUrl = url;
        if (url) this.setAttribute(attrs.docUrl, url);
        else this.removeAttribute(attrs.docUrl);
      }

      get toolId() {
        return this.#toolId;
      }

      set toolId(id: string | null) {
        if (this.#toolId === id) return;
        this.#toolId = id;
        if (id) this.setAttribute(attrs.toolId, id);
        else this.removeAttribute(attrs.toolId);
      }

      static get observedAttributes() {
        return [attrs.docUrl, attrs.toolId];
      }

      connectedCallback() {
        if (!this.style.position) {
          this.style.position = "relative";
        }
        this.style.display = "block";

        this.#docUrl = this.getAttribute(attrs.docUrl) as AutomergeUrl;
        this.#toolId = this.getAttribute(attrs.toolId);
        this.#init();
      }

      disconnectedCallback() {
        this.#teardown();
      }

      attributeChangedCallback(
        name: string,
        old: string | null,
        val: string | null
      ) {
        if (old === val) return;

        if (name === attrs.toolId) {
          this.#toolId = val;
        } else if (name === attrs.docUrl) {
          this.#docUrl = val as AutomergeUrl;
        }

        this.#teardown();
        this.#init();
      }

      async #init() {
        if (!this.#docUrl) return;
        if (this.#iframe) return;

        const epoch = ++this.#initEpoch;
        const docUrl = this.#docUrl;
        const toolId = this.#toolId;
        log("init %s tool=%s", docUrl, toolId);

        // Pre-fetch tool-independent assets in parallel (the sandboxed
        // iframe cannot fetch anything itself).

        // Collect host page stylesheets so tools inside the iframe get the
        // same CSS framework (Tailwind/DaisyUI utility classes, etc.).
        const hostStyles = await Promise.all(
          Array.from(document.styleSheets).map(async (sheet) => {
            try {
              // Inline <style> tags — read cssRules directly
              return Array.from(sheet.cssRules)
                .map((r) => r.cssText)
                .join("\n");
            } catch {
              // Cross-origin <link> stylesheets — fetch the href
              if (sheet.href) {
                try {
                  return await fetch(sheet.href).then((r) => r.text());
                } catch {
                  return "";
                }
              }
              return "";
            }
          })
        ).then((sheets) => sheets.filter(Boolean).join("\n"));

        const [esmsSource, automergeWasm, subductionWasm] = await Promise.all([
          fetch("/es-module-shims.js").then((r) => r.text()),
          fetch("/automerge.wasm").then((r) => r.arrayBuffer()),
          fetch("/subduction.wasm").then((r) => r.arrayBuffer()),
        ]);
        if (epoch !== this.#initEpoch) return;

        // Create srcdoc iframe with sandbox for security isolation
        const iframe = document.createElement("iframe");
        iframe.sandbox.add("allow-scripts");
        iframe.srcdoc = getSrcdocHtml(window.location.origin);
        iframe.style.cssText =
          "position:absolute;inset:0;border:none;width:100%;height:100%;";
        this.appendChild(iframe);
        this.#iframe = iframe;

        // Wait for iframe to signal readiness (with timeout)
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            window.removeEventListener("message", handler);
            this.#readyHandler = null;
            reject(new Error("isolated-patchwork-view: iframe ready timeout (10s)"));
          }, 10_000);
          const handler = (e: MessageEvent) => {
            if (e.data?.type !== "isolated-patchwork-ready") return;
            if (e.source !== iframe.contentWindow) return;
            clearTimeout(timeout);
            window.removeEventListener("message", handler);
            this.#readyHandler = null;
            resolve();
          };
          this.#readyHandler = handler;
          window.addEventListener("message", handler);
        });

        if (epoch !== this.#initEpoch) return;
        log("iframe ready");

        // Resolve importmap to absolute host-origin URLs (needed before
        // bootstrap channel setup to restrict which URLs it can serve).
        const importMapEl = document.querySelector('script[type="importmap"]');
        const rawImportMap = importMapEl
          ? JSON.parse(importMapEl.textContent || "{}")
          : { imports: {} };
        const importMap = resolveImportMap(rawImportMap, document.baseURI);

        // Collect the set of URLs the bootstrap channel is allowed to serve.
        const allowedBootstrapUrls = new Set<string>();
        if (importMap.imports) {
          for (const url of Object.values(importMap.imports)) {
            allowedBootstrapUrls.add(url);
          }
        }

        // Bootstrap channel — handles module loading before capnweb RPC is
        // ready. Only importmap URLs are allowed.
        const bootstrapChannel = new MessageChannel();
        bootstrapChannel.port1.onmessage = async (e) => {
          const { id, type, url } = e.data;
          if (type !== "load-module-source") return;
          if (!allowedBootstrapUrls.has(url)) {
            log("bootstrap denied: %s", url);
            bootstrapChannel.port1.postMessage({
              id,
              ok: false,
              error: `Bootstrap: URL not in importmap: ${url}`,
            });
            return;
          }
          try {
            const source = await fetch(url).then((r) => r.text());
            bootstrapChannel.port1.postMessage({ id, ok: true, value: source });
          } catch (err) {
            bootstrapChannel.port1.postMessage({
              id,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        };
        bootstrapChannel.port1.start();
        this.#bootstrapChannel = bootstrapChannel;

        // Set up document sync denylist and allowlist with intermediary repo.
        // The denylist blocks sensitive documents (account, module settings,
        // tool source code) from ever syncing to the iframe. The allowlist
        // controls which remaining documents can sync.
        const allowlist = new SyncAllowlist();
        allowlist.add(docUrl);
        this.#allowlist = allowlist;

        const denylist = new SyncDenylist();
        this.#denylist = denylist;
        // Fire-and-forget: populates denylist asynchronously. The most critical
        // entries (account doc, module settings URLs) are added synchronously
        // within populateDenylist before any awaits.
        populateDenylist(repo, denylist);

        // Storage-only repo for checking local document existence without
        // triggering network sync. Shares the same IndexedDB as the host repo.
        const localCheckRepo = new RepoClass({
          peerId: `local-check-${crypto.randomUUID().slice(0, 8)}` as PeerId,
          storage: new IndexedDBStorageAdapter(),
          isEphemeral: false,
        });
        this.#localCheckRepo = localCheckRepo;

        // Persistent denylist for user-denied documents (survives across sessions)
        const accountHandle = (window as any).accountDocHandle;
        let persistentDenylist: PersistentDenylist | null = null;
        if (accountHandle) {
          persistentDenylist = new PersistentDenylist(repo, accountHandle);
          await persistentDenylist.init();
          // Session-denylist the persistent denylist doc itself
          if (persistentDenylist.docUrl) {
            denylist.add(persistentDenylist.docUrl);
          }
        }
        this.#persistentDenylist = persistentDenylist;

        const hostRepoPeerId = repo.peerId;
        const intermediaryRepo = new RepoClass({
          peerId: `intermediary-${crypto.randomUUID().slice(0, 8)}` as PeerId,
          isEphemeral: true,
          shareConfig: {
            announce: async (_peerId: PeerId, documentId?: DocumentId) => {
              if (!documentId) return false;
              if (denylist.has(documentId)) return false;
              return allowlist.has(documentId);
            },
            access: async (peerId: PeerId, documentId?: DocumentId) => {
              // Accept everything from the host repo
              if (peerId === hostRepoPeerId) return true;
              // Gate iframe peer by denylist then allowlist
              if (!documentId) return false;
              if (denylist.has(documentId)) return false;
              return allowlist.has(documentId);
            },
          },
        });
        this.#intermediaryRepo = intermediaryRepo;

        // Auto-allowlist documents created inside the iframe.
        // When the intermediary learns about a document it doesn't recognize,
        // it must have been created by the iframe (since the intermediary has
        // no storage and starts empty, and host-originated docs are already
        // on the allowlist). This is safe because repo.create() always
        // generates a new document ID — it can't be used to access existing docs.
        intermediaryRepo.on("document", ({ handle }) => {
          const { documentId } = parseAutomergeUrl(handle.url);
          if (denylist.has(documentId)) {
            log("refusing to auto-allowlist denylisted document: %s", handle.url);
            return;
          }
          if (!allowlist.has(documentId)) {
            log("auto-allowlisting iframe-created document: %s", handle.url);
            allowlist.add(handle.url);
          }
        });

        // Connect intermediary ↔ host repo
        const hostChannel = new MessageChannel();
        const hostAdapter = new MessageChannelNetworkAdapter(
          hostChannel.port1,
          { useWeakRef: true }
        );
        repo.networkSubsystem.addNetworkAdapter(hostAdapter);
        this.#hostRepoAdapter = hostAdapter;
        const intermediaryHostAdapter = new MessageChannelNetworkAdapter(
          hostChannel.port2,
          { useWeakRef: true }
        );
        intermediaryRepo.networkSubsystem.addNetworkAdapter(intermediaryHostAdapter);
        this.#hostChannel = hostChannel;
        this.#intermediaryHostAdapter = intermediaryHostAdapter;

        // Connect intermediary ↔ iframe
        const repoChannel = new MessageChannel();
        const intermediaryIframeAdapter = new MessageChannelNetworkAdapter(
          repoChannel.port1,
          { useWeakRef: true }
        );
        intermediaryRepo.networkSubsystem.addNetworkAdapter(intermediaryIframeAdapter);
        this.#repoChannel = repoChannel;
        this.#intermediaryIframeAdapter = intermediaryIframeAdapter;

        // Populate allowlist from all automerge URLs found in the root document.
        // Each URL is checked against the denylist and dynamically screened for
        // sensitive document types (branches, module settings) before allowlisting.
        const rootHandle = await repo.find(docUrl);
        await rootHandle.whenReady();
        const rootDoc = rootHandle.doc();
        const addUrlsFromDoc = async (doc: unknown) => {
          const urls = new Set<AutomergeUrl>();
          collectAutomergeUrls(doc, urls);
          for (const url of urls) {
            // 1. Session denylist
            if (denylist.hasUrl(url)) continue;
            // 2. Persistent denylist
            if (persistentDenylist?.hasUrl(url)) continue;
            // 3. Dynamic sensitive-type check
            const denied = await checkAndDenylistIfSensitive(repo, url, denylist);
            if (denied) continue;
            // 4. Already allowlisted
            if (allowlist.hasUrl(url)) continue;
            // 5. In root folder → trusted
            if (await isInRootFolder(repo, url)) {
              allowlist.add(url);
              continue;
            }
            // 6. Exists locally → trusted
            if (await isDocumentLocal(localCheckRepo, url)) {
              allowlist.add(url);
              continue;
            }
            // 7. Unknown document — two-step approval
            const allowSync = window.confirm(
              `Unknown Document\n\n` +
              `A document was found that has never been seen on this device.\n` +
              `This may be an attempt by a tool to access an unauthorized document.\n\n` +
              `URL: ${url}\n\n` +
              `Allow syncing this document for preview?`
            );
            if (!allowSync) {
              persistentDenylist?.deny(url);
              continue;
            }
            // Sync via host repo and preview
            const handle = await repo.find<HasPatchworkMetadata>(url);
            await handle.whenReady();
            const previewDoc = handle.doc();
            const title = (previewDoc as any)?.title ?? "Unknown";
            const type = previewDoc?.["@patchwork"]?.type ?? "unknown";
            const allowAccess = window.confirm(
              `Document Preview\n\n` +
              `Title: ${title}\nType: ${type}\nURL: ${url}\n\n` +
              `Allow this tool to access this document?`
            );
            if (!allowAccess) {
              persistentDenylist?.deny(url);
              continue;
            }
            allowlist.add(url);
          }
        };
        await addUrlsFromDoc(rootDoc);
        log("allowlisted URLs from root document");
        // Watch for new URLs added to the root document
        const onRootChange = ({ doc }: { doc: unknown }) => {
          void addUrlsFromDoc(doc);
        };
        rootHandle.on("change", onRootChange);
        this.#rootDocUnsub = () => rootHandle.off("change", onRootChange);

        if (epoch !== this.#initEpoch) return;
        log("intermediary repo and allowlist ready");

        // Set up capnweb RPC channel with the HostApi and package URL mapper.
        const rpcChannel = new MessageChannel();
        const policy = createPolicy(window.location.origin, allowedBootstrapUrls);
        const mapper = new PackageUrlMapper();
        const hostApi = new HostApi(this, policy, repo, mapper, allowlist, denylist, localCheckRepo, persistentDenylist);
        this.#iframeStub = newMessagePortRpcSession<IframeRpcContract>(
          rpcChannel.port1,
          hostApi
        );
        this.#rpcChannel = rpcChannel;

        // Send init message with transferred ports and pre-fetched assets.
        // Tool resolution is deferred — the iframe will request it via the
        // PluginRegistryCapability after RPC is established.
        log("sending init message");
        iframe.contentWindow!.postMessage(
          {
            type: "isolated-patchwork-init",
            docUrl,
            toolId,
            importMap,
            hostOrigin: window.location.origin,
            hostStyles,
            esmsSource,
            automergeWasm,
            subductionWasm,
          },
          "*",
          [
            repoChannel.port2,
            bootstrapChannel.port2,
            rpcChannel.port2,
            automergeWasm,
            subductionWasm,
          ]
        );

        // Subscribe to host registry changes and push updates to the iframe.
        // When plugins are re-registered (e.g., ModuleWatcher discovers a
        // newer version), the iframe's local registry is updated to match.
        for (const [, registry] of getAllRegistries()) {
          const unsub = registry.on("registered", (plugin) => {
            if (!plugin.importUrl || !this.#iframeStub) return;
            log("pushing registry update: %s", plugin.id);
            const folderPath = getImportableUrlFromAutomergeUrl(
              plugin.importUrl as AutomergeUrl
            );
            const folderUrl = new URL(folderPath, window.location.origin).href;
            const packageUrl = mapper.toPackageUrl(folderUrl);
            const meta = pluginToMetadata(plugin, packageUrl);
            this.#iframeStub!.onPluginRegistered(meta);
          });
          this.#registryUnsubs.push(unsub);
        }
        log("registry subscriptions active");
      }

      #teardown() {
        log("teardown");
        this.#initEpoch++;

        if (this.#readyHandler) {
          window.removeEventListener("message", this.#readyHandler);
          this.#readyHandler = null;
        }

        if (this.#rootDocUnsub) {
          this.#rootDocUnsub();
          this.#rootDocUnsub = null;
        }

        // Tear down intermediary repo and its adapters
        if (this.#hostRepoAdapter) {
          this.#hostRepoAdapter.disconnect();
          this.#hostRepoAdapter = null;
        }
        if (this.#intermediaryHostAdapter) {
          this.#intermediaryHostAdapter.disconnect();
          this.#intermediaryHostAdapter = null;
        }
        if (this.#intermediaryIframeAdapter) {
          this.#intermediaryIframeAdapter.disconnect();
          this.#intermediaryIframeAdapter = null;
        }
        if (this.#hostChannel) {
          this.#hostChannel.port1.close();
          this.#hostChannel.port2.close();
          this.#hostChannel = null;
        }
        if (this.#intermediaryRepo) {
          this.#intermediaryRepo.shutdown();
          this.#intermediaryRepo = null;
        }
        this.#allowlist = null;
        this.#denylist = null;
        if (this.#localCheckRepo) {
          this.#localCheckRepo.shutdown();
          this.#localCheckRepo = null;
        }
        this.#persistentDenylist = null;

        if (this.#repoChannel) {
          this.#repoChannel.port1.close();
          this.#repoChannel.port2.close();
          this.#repoChannel = null;
        }

        if (this.#bootstrapChannel) {
          this.#bootstrapChannel.port1.close();
          this.#bootstrapChannel.port2.close();
          this.#bootstrapChannel = null;
        }

        if (this.#rpcChannel) {
          this.#rpcChannel.port1.close();
          this.#rpcChannel.port2.close();
          this.#rpcChannel = null;
        }

        this.#iframeStub = null;

        for (const unsub of this.#registryUnsubs) unsub();
        this.#registryUnsubs = [];

        if (this.#iframe) {
          this.#iframe.remove();
          this.#iframe = null;
        }
      }
    }
  );
}
