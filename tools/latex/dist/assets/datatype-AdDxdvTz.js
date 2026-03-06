import { updateText } from "@automerge/automerge";
const DEFAULT_CONTENT = `\\documentclass{article}
\\title{Untitled}
\\author{}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}

Hello, World!

\\end{document}`;
function getDocTitle(content) {
  const match = content.match(/\\title\{([^}]*)\}/);
  return match ? match[1] : "Untitled";
}
const LaTeXDatatype = {
  init(doc) {
    doc.content = DEFAULT_CONTENT;
  },
  getTitle(doc) {
    return getDocTitle(doc.content);
  },
  setTitle(doc, title) {
    const hasTitle = doc.content.match(/\\title\{[^}]*\}/);
    if (hasTitle) {
      updateText(
        doc,
        ["content"],
        doc.content.replace(/\\title\{[^}]*\}/, `\\title{${title}}`)
      );
    }
  }
};
export {
  LaTeXDatatype,
  getDocTitle
};
//# sourceMappingURL=datatype-AdDxdvTz.js.map
