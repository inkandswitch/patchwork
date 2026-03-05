import { registerTransform } from "./registry";

const LATEXJS_BASE_URL = "https://cdn.jsdelivr.net/npm/latex.js/dist/";

type LatexJsModule = typeof import("latex.js");
let cachedModule: LatexJsModule | null = null;

async function loadLatexJs(): Promise<LatexJsModule> {
  if (cachedModule) return cachedModule;
  cachedModule = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/latex.js/dist/latex.mjs"
  );
  return cachedModule!;
}

registerTransform({
  type: "latex-to-html",
  name: "LaTeX → HTML",
  description: "Renders LaTeX source to HTML using latex.js",
  async run(doc: any): Promise<string> {
    const content = typeof doc === "string" ? doc : doc?.content;
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
});
