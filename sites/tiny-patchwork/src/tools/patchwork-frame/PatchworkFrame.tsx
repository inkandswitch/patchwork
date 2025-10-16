import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { CONTEXT } from "@patchwork/context";
import { KeyhiveKit } from "@patchwork/identity";
import { useEffect, useState } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { openDocument } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";

CONTEXT.subscribe(() => {
  console.log("!! CONTEXT changed", CONTEXT.dump());
});

export const renderFrame = toolify(
  ({
    docUrl,
    element,
  }: {
    docUrl: AutomergeUrl;
    element: HTMLElement | ShadowRoot;
    keyhiveKit?: KeyhiveKit;
  }) => {
    const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkAccountDoc>(
      docUrl,
      {
        suspense: true,
      }
    );

    const { rootFolderUrl, contextSidebarToolId, rootFolderToolId, mainView } =
      accountDoc["@tiny-patchwork"];

    const [mainViewElement, setMainViewElement] = useState<HTMLElement | null>(
      null
    );

    const repo = useRepo();

    // listen to open document events
    useEffect(() => {
      if (element) {
        (element as HTMLElement).addEventListener(
          "patchwork:open-document",
          (event) => {
            if (!mainViewElement) {
              return;
            }

            openDocument(mainViewElement, event.detail.url);
          }
        );
      }
    }, [changeAccountDoc, element, repo, mainViewElement]);

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[400px] flex flex-col">
          {rootFolderToolId && (
            <patchwork-view
              class="h-full"
              doc-url={rootFolderUrl}
              tool-id={rootFolderToolId}
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
