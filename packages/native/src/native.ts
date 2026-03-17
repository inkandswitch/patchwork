import type { ShareItem } from "./types.js";

/**
 * PatchworkNative — bridges Patchwork JS to system capabilities.
 *
 * Designed so it could theoretically be an installable plugin:
 * - Works in both Tauri and browser contexts (graceful fallback)
 * - All methods are async
 * - No direct dependency on Tauri internals — uses the local HTTP API
 */
export class PatchworkNative {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:3030") {
    this.baseUrl = baseUrl;
  }

  /** Whether we're running inside a Tauri webview. */
  get isTauri(): boolean {
    return "__TAURI__" in globalThis;
  }

  /**
   * Eval arbitrary JS in the Patchwork webview.
   * Works from outside (via HTTP) or inside (directly).
   */
  async eval(code: string): Promise<string> {
    if (this.isTauri) {
      // We're already in the webview — just eval directly
      const fn = new Function(`return (async () => { ${code} })()`);
      const result = await fn();
      return result === undefined ? "undefined" : JSON.stringify(result);
    }

    // External caller — use the HTTP eval endpoint
    const res = await fetch(`${this.baseUrl}/eval`, {
      method: "POST",
      body: code,
    });
    if (!res.ok) {
      throw new Error(`eval failed: ${await res.text()}`);
    }
    return res.text();
  }

  /**
   * List all registered datatypes.
   */
  async listDatatypes(): Promise<Array<{ id: string; name: string; icon?: string }>> {
    const result = await this.eval(`
      const { getRegistry } = window.patchwork.plugins;
      const registry = getRegistry("patchwork:datatype");
      return registry.all()
        .filter(d => !d.unlisted)
        .map(d => ({ id: d.id, name: d.name, icon: d.icon }));
    `);
    return JSON.parse(result);
  }

  /**
   * List all registered tools.
   */
  async listTools(): Promise<Array<{ id: string; name: string; supportedDatatypes: string | string[] }>> {
    const result = await this.eval(`
      const { getRegistry } = window.patchwork.plugins;
      const registry = getRegistry("patchwork:tool");
      return registry.all()
        .filter(t => !t.unlisted)
        .map(t => ({ id: t.id, name: t.name, supportedDatatypes: t.supportedDatatypes }));
    `);
    return JSON.parse(result);
  }

  /**
   * Create a new document of a given datatype.
   * Returns the document URL.
   */
  async createDocument(datatypeId: string): Promise<string> {
    const result = await this.eval(`
      const { getRegistry, createDocOfDatatype2 } = window.patchwork.plugins;
      const registry = getRegistry("patchwork:datatype");
      const loaded = await registry.load("${datatypeId}");
      if (!loaded) throw new Error("Unknown datatype: ${datatypeId}");
      const handle = await createDocOfDatatype2(loaded, window.patchwork.repo);
      return handle.url;
    `);
    return JSON.parse(result);
  }

  /**
   * Navigate the current window to a document.
   */
  async openDocument(docId: string, opts?: { tool?: string; type?: string }): Promise<void> {
    const tool = opts?.tool ? `&tool=${opts.tool}` : "";
    const type = opts?.type ? `&type=${opts.type}` : "";
    await this.eval(`
      window.location.hash = "doc=${docId}${tool}${type}";
    `);
  }

  /**
   * Handle shared content from the system share sheet.
   * Emits a custom event that tools can listen for.
   */
  async handleShare(item: ShareItem): Promise<void> {
    const payload = JSON.stringify(item);
    await this.eval(`
      window.dispatchEvent(new CustomEvent("patchwork:share", {
        detail: ${payload}
      }));
    `);
  }
}
