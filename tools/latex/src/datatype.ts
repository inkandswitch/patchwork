import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";
import { updateText } from "@automerge/automerge";

export type LaTeXDoc = {
  content: string;
};

const DEFAULT_CONTENT = `\\documentclass{article}
\\title{Untitled}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}

Hello, World!

\\end{document}`;

export function getDocTitle(content: string): string {
  const match = content.match(/\\title\{([^}]*)\}/);
  return match ? match[1] : "Untitled";
}

export const LaTeXDatatype: DatatypeImplementation<LaTeXDoc> = {
  init(doc: LaTeXDoc) {
    doc.content = DEFAULT_CONTENT;
  },

  getTitle(doc: LaTeXDoc) {
    return getDocTitle(doc.content);
  },

  setTitle(doc: LaTeXDoc, title: string) {
    const hasTitle = doc.content.match(/\\title\{[^}]*\}/);
    if (hasTitle) {
      updateText(
        doc,
        ["content"],
        doc.content.replace(/\\title\{[^}]*\}/, `\\title{${title}}`)
      );
    }
  },
};
