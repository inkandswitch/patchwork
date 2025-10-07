import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "../utils";
import { FolderDoc, DocLink } from "@patchwork/filesystem";
import { useState } from "react";

type FolderEntryProps = {
  docLink: DocLink;
  depth?: number;
};

const FolderEntry = ({ docLink, depth = 0 }: FolderEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [doc] = useDocument<FolderDoc>(docLink.url);

  const isFolder = docLink.type === "folder";
  const paddingLeft = `${depth * 16}px`;

  if (!isFolder) {
    // If it's not a folder, just render the document name
    return (
      <div
        className="text-sm py-1 px-2 hover:bg-gray-200 cursor-pointer truncate"
        style={{ paddingLeft }}
        title={docLink.name}
      >
        📄 {docLink.name}
      </div>
    );
  }

  // If it's a folder, render it recursively
  return (
    <div>
      <div
        className="text-sm py-1 px-2 hover:bg-gray-200 cursor-pointer font-medium flex items-center gap-1"
        style={{ paddingLeft }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
        <span>📁 {docLink.name}</span>
      </div>
      {isExpanded && doc && doc.docs && (
        <div>
          {doc.docs.map((childDocLink, index) => (
            <FolderEntry
              key={childDocLink.url || index}
              docLink={childDocLink}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderView = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [folderDoc] = useDocument<FolderDoc>(docUrl);
  const repo = useRepo();

  if (!folderDoc) {
    return (
      <div className="w-[200px] flex-shrink-0 flex flex-col gap-2 bg-gray-100 p-2 border-r border-gray-300">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col bg-gray-100 border-r border-gray-300 overflow-y-auto">
      <div className="p-2 border-b border-gray-300 font-semibold text-gray-700">
        {folderDoc.title || "Mini Patchwork"}
      </div>
      <div className="flex-1 overflow-y-auto">
        {folderDoc.docs &&
          folderDoc.docs.map((docLink, index) => (
            <FolderEntry
              key={docLink.url || index}
              docLink={docLink}
              depth={0}
            />
          ))}
      </div>
    </div>
  );
};

export const renderSidebar = toolify(FolderView);
