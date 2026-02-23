export const plugins = [
  {
    type: "patchwork:datatype",
    id: "markdown",
    name: "Markdown",
    icon: "FileText",
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "patchwork:datatype",
    id: "essay",
    name: "Markdown",
    icon: "FileText",
    unlisted: true,
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "codemirror:extension",
    id: "codemirror-markdown",
    name: "Markdown",
    supportedDatatypes: ["essay", "markdown"],
    importPath: "./dist/mount-ext-markdown.js",
  },
  {
    type: "codemirror:extension",
    id: "codemirror-markdown-links",
    name: "Markdown Clickable Links",
    supportedDatatypes: ["essay", "markdown"],
    importPath: "./dist/mount-ext-links.js",
  },
];
