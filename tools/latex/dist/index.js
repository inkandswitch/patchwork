(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode(".latex-container {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n  font-family: system-ui, -apple-system, sans-serif;\n  color: var(--text, #1a1a1a);\n  background: var(--bg, #ffffff);\n}\n\n.latex-cm-container {\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n\n.latex-loading {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 100%;\n  height: 100%;\n  color: var(--text-muted, #999);\n  font-size: 13px;\n}\n\n@media (prefers-color-scheme: dark) {\n  .latex-container {\n    --text: #e5e5e5;\n    --text-muted: #888;\n    --bg: #1a1a1a;\n  }\n}"));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    let allSettled = function(promises$2) {
      return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
        status: "fulfilled",
        value: value$1
      }), (reason) => ({
        status: "rejected",
        reason
      }))));
    };
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = allSettled(deps.map((dep) => {
      dep = assetsURL(dep, importerUrl);
      if (dep in seen) return;
      seen[dep] = true;
      const isCss = dep.endsWith(".css");
      const cssSelector = isCss ? '[rel="stylesheet"]' : "";
      if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
        const link$1 = links[i$1];
        if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
      }
      else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
      const link = document.createElement("link");
      link.rel = isCss ? "stylesheet" : scriptRel;
      if (!isCss) link.as = "script";
      link.crossOrigin = "";
      link.href = dep;
      if (cspNonce) link.setAttribute("nonce", cspNonce);
      document.head.appendChild(link);
      if (isCss) return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
      });
    }));
  }
  function handlePreloadError(err$2) {
    const e$1 = new Event("vite:preloadError", { cancelable: true });
    e$1.payload = err$2;
    window.dispatchEvent(e$1);
    if (!e$1.defaultPrevented) throw err$2;
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
const LATEXJS_BASE_URL = "https://cdn.jsdelivr.net/npm/latex.js/dist/";
let cachedLatexJs = null;
async function loadLatexJs() {
  if (cachedLatexJs) return cachedLatexJs;
  cachedLatexJs = await __vitePreload(() => import("./assets/latex-BT1_7jU3.js"), true ? [] : void 0, import.meta.url);
  return cachedLatexJs;
}
const plugins = [
  {
    type: "patchwork:datatype",
    id: "latex",
    name: "LaTeX",
    icon: "FileText",
    async load() {
      const { LaTeXDatatype } = await __vitePreload(async () => {
        const { LaTeXDatatype: LaTeXDatatype2 } = await import("./assets/datatype-AdDxdvTz.js");
        return { LaTeXDatatype: LaTeXDatatype2 };
      }, true ? [] : void 0, import.meta.url);
      return LaTeXDatatype;
    }
  },
  {
    type: "patchwork:tool",
    id: "latex",
    name: "LaTeX Editor",
    icon: "FileText",
    supportedDatatypes: ["latex"],
    async load() {
      const { renderLaTeXEditor } = await __vitePreload(async () => {
        const { renderLaTeXEditor: renderLaTeXEditor2 } = await import("./assets/LaTeXEditor-ibSPDNNx.js");
        return { renderLaTeXEditor: renderLaTeXEditor2 };
      }, true ? [] : void 0, import.meta.url);
      return renderLaTeXEditor;
    }
  },
  {
    type: "patchwork:transform",
    id: "latex-to-html",
    name: "LaTeX → HTML",
    inputTypes: ["essay", "latex"],
    async load() {
      return {
        async run(input) {
          const content = typeof input === "string" ? input : input?.content;
          if (!content || typeof content !== "string") {
            return "<html><body><p>No LaTeX content</p></body></html>";
          }
          try {
            const mod = await loadLatexJs();
            const generator = new mod.HtmlGenerator({ hyphenate: false });
            const parsed = mod.parse(content, { generator });
            const htmlDoc = parsed.htmlDocument(LATEXJS_BASE_URL);
            return "<!DOCTYPE html>\n" + htmlDoc.documentElement.outerHTML;
          } catch (e) {
            const msg = e.location ? `Line ${e.location.start.line}, Col ${e.location.start.column}: ${e.message}` : e.message || "Failed to render LaTeX";
            return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;color:#ef4444;"><h3>LaTeX Error</h3><pre>${msg}</pre></body></html>`;
          }
        }
      };
    }
  }
];
export {
  plugins
};
//# sourceMappingURL=index.js.map
