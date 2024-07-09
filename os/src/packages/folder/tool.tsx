import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as A from "@automerge/automerge/next";
import React from "react";

import { useDataType } from "@/datatypes";
import { selectDocLink } from "@/explorer/hooks/useSelectedDocLink";
import { Icon } from "@/lib/icons";
import { EditorProps, Tool, useToolsForDataType } from "@/tools";
import { DocLink, FolderDoc } from "./datatype";
import { MountOnlyWhenVisible } from "./MountOnlyWhenVisible";

export const FolderViewerWithEmbeds: React.FC<EditorProps<never, never>> = ({
  docUrl,
  docHeads,
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
          <FolderEntryView docLink={docLink} key={index} />
        ))}
      </div>
    </div>
  );
};

type FolderEntryView = {
  docLink: DocLink;
};

export const FolderEntryView = ({ docLink }) => {
  const dataType = useDataType(docLink.type);
  const tool = useToolsForDataType(docLink.type)[0];

  const icon = tool?.icon ?? dataType?.icon;

  return (
    <div className="h-72">
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

          <div className="h-64 border border-gray-300">
            {!tool && <div>No editor available</div>}
            {tool && docLink.type !== "folder" && (
              <MountOnlyWhenVisible height={"16rem"}>
                {React.createElement(tool.editorComponent, {
                  docUrl: docLink.url,
                })}
              </MountOnlyWhenVisible>
            )}
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

const FolderListItem: React.FC<{ docLink: DocLink }> = ({ docLink }) => {
  const dataType = useDataType(docLink.type);
  const icon = dataType?.icon;

  return (
    <div
      key={docLink.url}
      className="px-2 py-1 underline cursor-pointer flex font-medium items-center underline-offset-2 hover:bg-gray-100 underline-gray-400"
      onClick={() => selectDocLink(docLink)}
    >
      <Icon type={icon} size={14} className="mr-2" />
      {docLink.name}
    </div>
  );
};

export const FolderViewerList: React.FC<EditorProps<never, never>> = ({
  docUrl,
  docHeads,
}: EditorProps<never, never>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads

  const folderAtHeads = docHeads ? A.view(folder, docHeads) : folder;

  if (!folder) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {folderAtHeads.docs.map((docLink) => (
        <FolderListItem key={docLink.url} docLink={docLink} />
      ))}
    </div>
  );
};

export const folderViewerListTool: Tool = {
  type: "patchwork:tool",
  id: "folder-list",
  name: "List",
  editorComponent: FolderViewerList,
  supportedDataTypes: ["folder"],
};

export const folderViewerWithEmbedsTool: Tool = {
  type: "patchwork:tool",
  id: "folder-embeds",
  name: "Embeds",
  editorComponent: FolderViewerWithEmbeds,
  supportedDataTypes: ["folder"],
};
