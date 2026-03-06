import type { Plugin } from "@inkandswitch/patchwork-plugins";

const LATEXJS_BASE_URL = "https://cdn.jsdelivr.net/npm/latex.js/dist/";

type LatexJsModule = typeof import("latex.js");
let cachedLatexJs: LatexJsModule | null = null;

async function loadLatexJs(): Promise<LatexJsModule> {
  if (cachedLatexJs) return cachedLatexJs;
  cachedLatexJs = await import("latex.js");
  return cachedLatexJs!;
}

export const plugins: Plugin<any>[] = [
  {
    type: "patchwork:datatype",
    id: "latex",
    name: "LaTeX",
    icon: "FileText",
    async load() {
      const { LaTeXDatatype } = await import("./datatype");
      return LaTeXDatatype;
    },
  },
  {
    type: "patchwork:tool",
    id: "latex",
    name: "LaTeX Editor",
    icon: "FileText",
    supportedDatatypes: ["latex"],
    async load() {
      const { renderLaTeXEditor } = await import("./LaTeXEditor");
      return renderLaTeXEditor;
    },
  },
  {
    type: "patchwork:transform",
    id: "latex-to-html",
    name: "LaTeX → HTML",
    inputTypes: ["essay", "latex"],
    async load() {
      return {
        async run(input: any): Promise<string> {
          const content = typeof input === "string" ? input : input?.content;
          if (!content || typeof content !== "string") {
            return "<html><body><p>No LaTeX content</p></body></html>";
          }
          try {
            const mod = await loadLatexJs();
            const generator = new mod.HtmlGenerator({ hyphenate: false });
            const parsed = mod.parse(content, { generator }) as any;
            const htmlDoc = parsed.htmlDocument(LATEXJS_BASE_URL);
            return "<!DOCTYPE html>\n" + htmlDoc.documentElement.outerHTML;
          } catch (e: any) {
            const msg = e.location
              ? `Line ${e.location.start.line}, Col ${e.location.start.column}: ${e.message}`
              : e.message || "Failed to render LaTeX";
            return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;color:#ef4444;"><h3>LaTeX Error</h3><pre>${msg}</pre></body></html>`;
          }
        },
      };
    },
  },
];
