import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { useEffect, useState } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { openDocument } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";

export const renderFrame = toolify(
  ({
    docUrl,
    element,
  }: {
    docUrl: AutomergeUrl;
    element: HTMLElement | ShadowRoot;
  }) => {
    const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkAccountDoc>(
      docUrl,
      {
        suspense: true,
      }
    );

    const { rootFolderUrl, contextSidebarToolId, sidebarToolId, mainView } =
      accountDoc;

    const [mainViewElement, setMainViewElement] = useState<HTMLElement | null>(
      null
    );

    const repo = useRepo();

    // listen to open document events
    useEffect(() => {
      if (element) {
        (element as HTMLElement).addEventListener(
          "patchwork:open-document",
          function (event) {
            if (!mainViewElement) {
              return;
            }
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (event.target === this) {
              openDocument(
                mainViewElement,
                event.detail.url,
                event.detail.toolId
              );
            }
          }
        );
      }
    }, [changeAccountDoc, element, repo, mainViewElement]);

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[400px] flex flex-col">
          {sidebarToolId && (
            <patchwork-view
              class="h-full"
              doc-url={docUrl}
              tool-id={sidebarToolId}
            />
          )}
        </div>

        <div className="w-full h-full overflow-auto">
          {mainView && (
            <patchwork-view
              ref={setMainViewElement}
              doc-url={mainView.documentUrl}
              tool-id={mainView.toolId}
              key={mainView.documentUrl}
            />
          )}
        </div>

        {contextSidebarToolId && (
          <div className="w-[400px] bg-gray-100">
            <patchwork-view
              doc-url={rootFolderUrl} // todo: context tool doesn't have a doc url
              tool-id={contextSidebarToolId}
            />
          </div>
        )}
      </div>
    );
  }
);
