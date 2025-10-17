import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { CONTEXT } from "@patchwork/context";
import { KeyhiveKit } from "@patchwork/identity";
import { useEffect, useState } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { openDocument, OpenDocumentEvent } from "../../lib/navigation";
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
        element.addEventListener("patchwork:open-document", (event) => {
          const { docLink } = event as OpenDocumentEvent;

          if (!mainViewElement) {
            return;
          }

          openDocument(mainViewElement, docLink);
        });
      }
    }, [changeAccountDoc, element, repo, mainViewElement]);

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[500px] bg-gray-100 p-2 flex flex-col">
          <div className="p-2">
            <h2 className="text-xl p-3">
              <span className="text-xs">tiny</span> patchwork
            </h2>
          </div>
          {rootFolderToolId && (
            // @ts-expect-error fix later
            <patchwork-view
              doc-url={rootFolderUrl}
              tool-id={rootFolderToolId}
            />
          )}
        </div>

        <div className="w-full h-full overflow-auto">
          {mainView && (
            // @ts-expect-error fix later
            <patchwork-view
              ref={setMainViewElement}
              doc-url={mainView.documentUrl}
              tool-id={mainView.toolId}
              key={mainView.documentUrl}
            />
          )}
        </div>

        {contextSidebarToolId && (
          <div className="w-[500px] bg-gray-100">
            {/* @ts-expect-error fix later */}
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
