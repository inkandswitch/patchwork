import { updateText } from "@automerge/automerge";
const DEFAULT_CONTENT = `\\documentclass{article}
\\title{On the Composability of Local-First Software}
\\author{A.~Researcher}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Introduction}

Local-first software prioritises data ownership and offline capability
while still enabling real-time collaboration. This paper explores how
\\emph{composable transforms} can extend the utility of such systems by
allowing users to build custom data pipelines in the browser.

\\section{Background}

\\subsection{CRDTs and Automerge}

Conflict-free Replicated Data Types provide a mathematical foundation
for merging concurrent edits without coordination. Automerge implements
these ideas in a practical library, enabling applications where every
device holds a full copy of the data.

\\subsection{Moldable Development}

The concept of moldable development, as championed by Glamorous Toolkit,
argues that developers should be able to create \\emph{contextual tools}
cheaply and in many combinations. We adapt this philosophy to
end-user document environments.

\\section{Approach}

Our system introduces \\textbf{pipes}---lightweight transform elements
placed between views in a flexible spatial layout:

\\begin{itemize}
  \\item Each pipe applies a single transform function to its input.
  \\item Pipes chain: the output of one becomes the input of the next.
  \\item Transforms are registered as plugins, discovered at runtime.
\\end{itemize}

For example, a LaTeX document can be piped through a renderer to produce
HTML, then through a text extractor, and finally through a word counter
---all updating live as the user types.

\\section{Conclusion}

By treating transforms as composable, user-arrangeable primitives,
we bring the spirit of Unix pipes and moldable development to
collaborative document environments.

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
//# sourceMappingURL=datatype-B3I_tbUY.js.map
