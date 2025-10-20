import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/vanillajs";
import type { ToolElement, ToolImplementation } from "@patchwork/plugins";
import { createElement } from "react";

export type ReactToolProps = {
  docUrl: AutomergeUrl;
  element: ToolElement;
};

/**
 * @import {LegacyEditorProps, ToolImplementation} from "@patchwork/plugins"
 */

export function toolify(
  editorComponent: React.FC<ReactToolProps>
): ToolImplementation {
  return (handle, element) => {
    const root = createRoot(element);

    root.render(
      createElement(
        RepoContext.Provider,
        { value: element.repo },
        createElement(editorComponent, {
          docUrl: handle.url,
          element,
        })
      )
    );

    return () => {
      root.unmount();
    };
  };
}
