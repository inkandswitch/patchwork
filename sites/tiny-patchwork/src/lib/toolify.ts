import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { type AutomergeUrl } from "@automerge/vanillajs";
import { ToolProps } from "@patchwork/plugins";
import { FC, Suspense, createElement } from "react";
import { createRoot } from "react-dom/client";

export type ReactToolProps = {
  docUrl: AutomergeUrl;
};

export const toolify = (
  component: FC<ReactToolProps>
): ((toolProps: ToolProps) => void) => {
  return (toolProps: ToolProps) => {
    const root = createRoot(toolProps.element);
    root.render(
      createElement(
        Suspense,
        null,
        createElement(
          RepoContext.Provider,
          { value: toolProps.repo },
          createElement(component, { docUrl: toolProps.handle.url })
        )
      )
    );
  };
};
