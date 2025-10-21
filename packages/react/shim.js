// @ts-check
import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";

/**
 * @import {LegacyEditorProps, ToolImplementation} from "@patchwork/plugins"
 */

// a transitional shim until patchwork uses the .render() pattern
/**
 * @param {React.FC<LegacyEditorProps>} editorComponent
 * @returns {ToolImplementation}}
 */
export default function patchworkReactShim(editorComponent) {
  return (handle, element) => {
    const root = createRoot(element);

    const component = () =>
      jsx(RepoContext.Provider, {
        value: element.repo,
        children: jsx(editorComponent, { docUrl: handle.url }),
      });
    // a hack to recreate the behaviour of patchwork, that rerenders children on
    // any change
    function rerender() {
      root.render(component());
    }
    rerender();
    handle.on("change", rerender);
    return () => {
      root.unmount();
      handle.off("change", rerender);
    };
  };
}
