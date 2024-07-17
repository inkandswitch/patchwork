import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import React from "react";

import { useDataType } from "@/datatypes";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { Icon } from "@/lib/icons";
import { EditorProps, Tool, useToolsForDataType } from "@/tools";
import { DocLink, DocPath, FolderDoc } from "./datatype";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { AccountDoc, UIStateDoc, useCurrentAccount } from "@/explorer/account";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { VersionControlSidecarDoc } from "@/sdk";
import { Button } from "@/shadcn/ui/button";
import { GitBranchIcon } from "lucide-react";

export const FolderViewer: React.FC<EditorProps<never, never>> = ({
  docUrl,
  docHeads,
  getFakeDocPathForDocUrl,
}: EditorProps<never, never>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads

  const [versionControlMetadata, changeVersionControlMetadata] =
    useDocument<VersionControlSidecarDoc>(folder?.versionControlMetadataUrl);

  const folderAtHeads = docHeads ? A.view(folder, docHeads) : folder;

  if (!folder) {
    return null;
  }

  return (
    <div className="p-2 h-full overflow-hidden">
      <div className="text-gray-500 text-sm mb-4 pb-2 border-b border-gray-300 flex items-center gap-4">
        <div>{folderAtHeads.docs.length} documents</div>
        <div>
          {versionControlMetadata?.isBranchScope ? (
            <div className="flex items-center">
              <GitBranchIcon className="h-4 w-4" />
              <div>Branchable folder</div>
            </div>
          ) : (
            <div className="flex items-center">
              <GitBranchIcon className="h-4 w-4" />
              <div>Not a branchable folder</div>
              <Button
                onClick={() => {
                  changeVersionControlMetadata((d) => {
                    d.isBranchScope = true;
                    // @ts-expect-error it's fine see previous line
                    d.branches = [];
                  });
                }}
                variant="outline"
                size="sm"
                className="ml-2 text-xs h-8"
              >
                Make branchable
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-10 px-4 h-full overflow-y-auto pb-24">
        {folderAtHeads.docs.map((docLink, index) => (
          <FolderEntryView
            docLink={docLink}
            key={index}
            getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
          />
        ))}
      </div>
    </div>
  );
};

type FolderEntryView = {
  docLink: DocLink;
  getFakeDocPathForDocUrl: (docUrl: AutomergeUrl) => DocPath;
};

export const FolderEntryView = ({
  docLink,
  getFakeDocPathForDocUrl,
}: FolderEntryView) => {
  const account = useCurrentAccount();
  const [accountDoc] = useDocument<AccountDoc>(account?.handle.url);
  const uiStateHandle = useHandle<UIStateDoc>(accountDoc?.uiStateUrl);
  const docPath = getFakeDocPathForDocUrl(docLink.url);
  const { cloneOrMainOm } = useBranchScopeAndActiveBranchInfo(
    docPath,
    uiStateHandle
  );

  const dataType = useDataType(docLink.type);
  const tool = useToolsForDataType(docLink.type)[0];

  const icon = tool?.icon ?? dataType?.icon;

  return (
    <div>
      {!tool ? (
        <div className="flex gap-2 items-center font-medium mb-1">
          Unknown type: {docLink.type}
        </div>
      ) : (
        <>
          <div className="flex gap-2 items-center font-medium mb-1">
            <Icon type={icon} size={16} />
            <div>{docLink.name}</div>
            <button
              className="text-sm text-gray-500 underline align-bottom cursor-pointer"
              onClick={() => {
                selectDocLink(docLink);
              }}
            >
              Open
            </button>
          </div>
          <div className="h-72 border border-gray-300">
            {!tool && <div>No editor available</div>}
            {tool &&
              docLink.type !== "folder" &&
              React.createElement(tool.editorComponent, {
                docUrl: cloneOrMainOm?.url,
                getFakeDocPathForDocUrl,
              })}
            {docLink.type === "folder" && (
              <div className="bg-gray-50 justify-center items-center flex h-full">
                Click "open" to see nested folder contents
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const folderViewerTool: Tool = {
  type: "patchwork:tool",
  id: "folder",
  name: "Folder",
  editorComponent: FolderViewer,
  supportedDataTypes: ["folder"],
};
