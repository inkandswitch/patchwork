import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import React, { useMemo } from "react";

import { useDataType } from "@/datatypes";
import { useUIStateHandle } from "@/explorer/account";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { Icon } from "@/lib/icons";
import { EditorProps, Tool, useToolsForDataType } from "@/tools";
import { useBranchScopeAndActiveBranchInfo } from "@/versionControl/hooks";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { DocLink, DocPath, FolderDoc } from "./datatype";
import { useAnnotations } from "@/versionControl/annotations";
import { diffWithProvenance } from "@/versionControl/utils";
import { HasVersionControlMetadata } from "@/versionControl/schema";

export const FolderViewer: React.FC<EditorProps<never, never>> = ({
  docUrl,
  docHeads,
  getFakeDocPathForDocUrl,
}: EditorProps<never, never>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads

  const folderAtHeads = docHeads ? A.view(folder, docHeads) : folder;

  if (!folder) {
    return null;
  }

  return (
    <div className="p-2 h-full overflow-hidden">
      <div className="text-gray-500 text-sm mb-4 pb-2 border-b border-gray-300">
        {folderAtHeads.docs.length} documents
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
  const uiStateHandle = useUIStateHandle();
  const docPath = getFakeDocPathForDocUrl(docLink.url);
  const { cloneOrMainOm, baseHeads } = useBranchScopeAndActiveBranchInfo(
    docPath,
    uiStateHandle
  );

  const dataType = useDataType(docLink.type);
  const tool = useToolsForDataType(docLink.type)[0];

  const icon = tool?.icon ?? dataType?.icon;

  // TODO: we shouldn't have to duplicate this code here, also right now the change highlights can't be disabled
  const diff = useMemo(() => {
    if (baseHeads && cloneOrMainOm) {
      return diffWithProvenance(
        cloneOrMainOm.doc,
        baseHeads,
        A.getHeads(cloneOrMainOm.doc)
      );
    }
  }, [baseHeads, cloneOrMainOm]);

  const annotationProps = useAnnotations({
    doc: cloneOrMainOm?.doc as A.Doc<HasVersionControlMetadata>,
    dataType,
    isCommentInputFocused: false,
    diff,
  });

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
                ...annotationProps,
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
