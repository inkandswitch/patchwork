import * as Automerge from "@automerge/automerge";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import React, { useCallback, useState } from "react";
import styles from "../folder-list-view.module.css";

import { selectDocLink, Icon, EditorProps, dataTypeById } from "@patchwork/sdk";
import { DocLink, FolderDoc } from "@/packages/folder/datatype";
import { IconType } from "@/lib/icons";

const FolderListItem: React.FC<{ docLink: DocLink }> = ({ docLink }) => {
  const dataType = dataTypeById(docLink.type);
  const icon = dataType?.icon;

  return (
    <div className={styles.folderListView}>
      <div
        key={docLink.url}
        className="px-2 py-1 underline cursor-pointer flex font-medium items-center underline-offset-2 hover:bg-gray-100 underline-gray-400"
        onClick={() => selectDocLink(docLink)}
      >
        <Icon type={icon as IconType} size={14} className="mr-2" />
        {docLink.name}
      </div>
    </div>
  );
};

export const FolderViewerList: React.FC<EditorProps<unknown, unknown>> = ({
  docUrl,
  docHeads,
}: EditorProps<unknown, unknown>) => {
  const [folder] = useDocument<FolderDoc>(docUrl); // used to trigger re-rendering when the doc loads

  const folderAtHeads =
    folder && docHeads ? Automerge.view(folder, docHeads) : folder;

  if (!folder) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      {folderAtHeads?.docs.map((docLink) => (
        <FolderListItem key={docLink.url} docLink={docLink} />
      ))}
    </div>
  );
};
