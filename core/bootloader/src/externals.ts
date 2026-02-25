/**
 * these dependencies will be built into the outdir, and injected into the importmap
 */
const externals = [
  "@automerge/automerge",
  "@automerge/automerge/slim",
  "@automerge/automerge-repo",
  "@automerge/automerge-repo/slim",
  "@automerge/automerge-repo-keyhive",
  "@keyhive/keyhive",
  "@keyhive/keyhive/slim",
  "@inkandswitch/patchwork-bootloader",
  "@inkandswitch/patchwork-elements",
  "@inkandswitch/patchwork-filesystem",
  "@inkandswitch/patchwork-plugins",

  // sad
  "@codemirror/state",
  "@codemirror/view",
  "@codemirror/language",

  // react
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",

  // rip
  "solid-js",
  "solid-js/html",
  "solid-js/web",
  "solid-js/h",
  "solid-js/store",
  "solid-js/jsx-runtime",
];
export default externals;
