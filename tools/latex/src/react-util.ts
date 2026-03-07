import type {
  ToolImplementation,
  ToolElement,
} from "@inkandswitch/patchwork-plugins";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export type ReactToolProps = {
  docUrl: AutomergeUrl;
  element: ToolElement;
};

export function toolify(
  editorComponent: React.FC<ReactToolProps>
): ToolImplementation {
  return (handle, element) => {
    const root = createRoot(element);

    root.render(
      createElement(
        RepoContext.Provider,
        { value: element.repo as any },
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
