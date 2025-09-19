// @ts-check
import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";

/**
 * @import {LegacyEditorProps, ToolImplementation} from "@patchwork/rootstock"
 */

// a transitional shim until patchwork uses the .render() pattern
/**
 * @param {React.FC<LegacyEditorProps>} editorComponent
 * @returns {ToolImplementation['render']}}
 */
export default function shim(editorComponent) {
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
