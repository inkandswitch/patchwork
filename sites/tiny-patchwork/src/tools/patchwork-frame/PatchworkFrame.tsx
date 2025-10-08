import { use, useEffect, useMemo, useState } from "react";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { toolify } from "../../lib/toolify";
import { AccountDoc, getAccountDocHandle } from "../../lib/account";
import { DocLink } from "@patchwork/filesystem";
import { OpenDocumentEvent } from "../../lib/navigation";

export type PatchworkFrameDoc = {
  sidebarToolId: string;
  selectedDocLink?: DocLink;
};

export const renderFrame = toolify(
  ({
    docUrl,
    element,
  }: {
    docUrl: AutomergeUrl;
    element: HTMLElement | ShadowRoot;
  }) => {
    const repo = useRepo();
    const accountDocHandle = use(
      useMemo(() => getAccountDocHandle(repo), [repo])
    );
    const [frame, changeFrame] = useDocument<PatchworkFrameDoc>(docUrl, {
      suspense: true,
    });
    const [account] = useDocument<AccountDoc>(accountDocHandle.url, {
      suspense: true,
    });

    // listen to open document events
    useEffect(() => {
      if (element) {
        element.addEventListener("patchwork:open-document", (event) => {
          const { docLink } = event as OpenDocumentEvent;

          changeFrame((frame) => {
            frame.selectedDocLink = docLink;
          });
        });
      }
    }, [element]);

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[300px] bg-gray-100 p-2">
          <h2 className="text-xl p-3">
            <span className="text-xs">tiny</span> patchwork
          </h2>

          <patchwork-view
            doc-url={account.rootFolderUrl}
            tool-id={frame.sidebarToolId}
          />
        </div>

        <div className="w-full h-full overflow-auto">
          {frame.selectedDocLink && (
            <MainView
              docLink={frame.selectedDocLink}
              key={frame.selectedDocLink.url}
            />
          )}
        </div>
      </div>
    );
  }
);

type MainViewProps = {
  docLink: DocLink;
};

const MainView = ({ docLink }: MainViewProps) => {
  return <patchwork-view doc-url={docLink.url} tool-id={docLink.type} />;
};
