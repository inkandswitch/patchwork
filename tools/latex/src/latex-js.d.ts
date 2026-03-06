declare module "latex.js" {
  export class HtmlGenerator {
    constructor(options?: { hyphenate?: boolean; styles?: string[] });
    htmlDocument(baseURL?: string): Document;
    stylesAndScripts(baseURL?: string): DocumentFragment;
    domFragment(): DocumentFragment;
    documentTitle(): string;
    reset(): void;
  }

  export function parse(
    input: string,
    options: { generator: HtmlGenerator }
  ): HtmlGenerator;
}
