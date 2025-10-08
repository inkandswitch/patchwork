import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { AutomergeUrl } from "@automerge/vanillajs";
import { useDocRef, useReactive } from "@patchwork/context/react";
import { SelectionAPI } from "@patchwork/context/selection";
import { DocLink } from "@patchwork/filesystem";
import { useEffect } from "react";
import { TinyPatchworkAccountDoc } from "../../lib/account-doc";
import { OpenDocumentEvent } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";

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

    // listen to open document events
    useEffect(() => {
      if (element) {
        element.addEventListener("patchwork:open-document", (event) => {
          const { docLink } = event as OpenDocumentEvent;

          console.log("handle open document event", event);

          changeAccountDoc((accountDoc) => {
            accountDoc["@tiny-patchwork"].selectedDocLink = docLink;
          });
        });
      }
    }, [element]);

    // add selectedDocument to context
    const selectedDocRef = useDocRef(selectedDocLink?.url);
    useEffect(
      () => selection.setSelection(selectedDocRef ? [selectedDocRef] : []),
      [selectedDocRef, selection]
    );

    return (
      <div className="w-screen h-screen flex">
        <div className="w-[300px] bg-gray-100 p-2">
          <h2 className="text-xl p-3">
            <span className="text-xs">tiny</span> patchwork
          </h2>

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
  return <patchwork-view doc-url={docLink.url} tool-id={docLink.type} />;
};
