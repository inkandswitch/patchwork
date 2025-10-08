import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { CONTEXT, PathRef } from "@patchwork/context";
import { useReactive } from "@patchwork/context/react";
import { SelectionAPI } from "@patchwork/context/selection";
import { DocLink } from "@patchwork/filesystem";
import { useEffect } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";

CONTEXT.subscribe(() => {
  console.log("CONTEXT changed", CONTEXT.refs);
});

export const renderFrame = toolify(
  ({
    docUrl,
    element,
  }: {
    docUrl: AutomergeUrl;
    element: HTMLElement | ShadowRoot;
  }) => {
    const selection = useReactive(SelectionAPI);

    const [accountDoc, changeAccountDoc] = useDocument<TinyPatchworkAccountDoc>(
      docUrl,
      {
        suspense: true,
      }
    );

    const { rootFolderUrl, sidebarToolId, selectedDocLink } =
      accountDoc["@tiny-patchwork"];

    const repo = useRepo();

    // listen to open document events
    useEffect(() => {
      if (element) {
        element.addEventListener("patchwork:open-document", (event) => {
          const { docLink } = event as OpenDocumentEvent;

          console.log("handle open document event", event);

          repo.find(docLink.url).then((handle) => {
            selection.setSelection([new PathRef(handle, [])]);
          });

          changeAccountDoc((accountDoc) => {
            accountDoc["@tiny-patchwork"].selectedDocLink = docLink;
          });
        });
      }
    }, [changeAccountDoc, element, repo, selection]);

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[300px] bg-gray-100 p-2">
          <h2 className="text-xl p-3">
            <span className="text-xs">tiny</span> patchwork
          </h2>
          {/* @ts-expect-error fix later */}
          <patchwork-view doc-url={rootFolderUrl} tool-id={sidebarToolId} />
        </div>

        <div className="w-full h-full overflow-auto">
          {selectedDocLink && (
            // todo: patchwork-view does't update if  doc url changes
            <MainView docLink={selectedDocLink} key={selectedDocLink.url} />
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
  // @ts-expect-error fix later
  return <patchwork-view doc-url={docLink.url} tool-id={docLink.type} />;
};
