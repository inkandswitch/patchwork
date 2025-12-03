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
  "@patchwork/bootloader",
  "@patchwork/elements",
  "@patchwork/filesystem",
  "@patchwork/plugins",

  // sad
  "@codemirror/state",
  "@codemirror/view",
];
export default externals;
