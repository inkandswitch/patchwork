// @ts-check
// a transitional shim until patchwork uses the .render() pattern
/**
 * @param {import("@patchwork/rootstock").ToolImplementation['EditorComponent']} editorComponent
 * @returns{Promise<import("@patchwork/rootstock").ToolImplementation['render']>}}
 */
export default async function shim(editorComponent) {
  // this handsome incantation is to prevent tools from trying to include react
  // in the bundle, and use the one from the importmap
  const { jsx } = await import(/* @vite-ignore */ `${"react/jsx-runtime"}`);
  const { createRoot } = await import(
    /* @vite-ignore */ `${"react-dom/client"}`
  );
  const { RepoContext } = await import(
    /* @vite-ignore */
    `${"@automerge/automerge-repo-react-hooks"}`
  );

  return (props) => {
    const root = createRoot(props.element);
    const component = () =>
      jsx(RepoContext.Provider, {
        value: props.repo,
        children: jsx(editorComponent, { docUrl: props.handle.url }),
      });
    // a hack to recreate the behaviour of patchwork, that rerenders children on
    // any change
    function rerender() {
      root.render(component());
    }
    rerender();
    props.handle.on("change", rerender);
    return () => {
      root.unmount();
      props.handle.off("change", rerender);
    };
  };
}
