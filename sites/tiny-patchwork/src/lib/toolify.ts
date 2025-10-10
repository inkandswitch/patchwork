import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { DocHandle, Repo, type AutomergeUrl } from "@automerge/vanillajs";
import { FC, Suspense, createElement } from "react";
import { createRoot } from "react-dom/client";
import { KeyhiveKit } from "@patchwork/identity";

export type ReactToolProps = {
  docUrl: AutomergeUrl;
  element: HTMLElement | ShadowRoot;
  keyhiveKit?: KeyhiveKit;
};

type ToolProps<T = unknown> = {
  handle: DocHandle<T>;
  element: ShadowRoot | HTMLElement;
  repo: Repo;
  keyhiveKit?: KeyhiveKit;
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
          createElement(component, {
            docUrl: toolProps.handle.url,
            element: toolProps.element,
            keyhiveKit: toolProps.keyhiveKit,
          })
        )
      )
    );
  };
};
