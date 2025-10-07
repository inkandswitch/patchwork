import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "../lib/toolify";
import { FolderDoc, DocLink } from "@patchwork/filesystem";
import { useState, useRef, useEffect } from "react";
import { createDocOfDataType, DataType } from "@patchwork/plugins";
import { useDatatypeDescriptions } from "../lib/useDatatypeDescriptions";
import { PlusIcon } from "lucide-react";

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
  const [folderDoc, changeFolderDoc] = useDocument<FolderDoc>(docUrl, {
    suspense: true,
  });
  const repo = useRepo();

  const onAddDocument = async (dataType: DataType<unknown>) => {
    const docHandle = createDocOfDataType(dataType, repo);
    changeFolderDoc((doc) => {
      doc.docs.push({
        name: dataType.name,
        type: dataType.id,
        url: docHandle.url,
      });
    });
  };

  return (
    <div className="w-[200px] flex-shrink-0 flex flex-col bg-gray-100 border-r border-gray-300 overflow-y-auto">
      <div className="p-2 border-b border-gray-300 font-semibold text-gray-700">
        {folderDoc.title} <AddDocumentButton onAddDocument={onAddDocument} />
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

const AddDocumentButton = ({
  onAddDocument,
}: {
  onAddDocument: (dataType: DataType<unknown>) => void;
}) => {
  const datatypes = useDatatypeDescriptions();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDatatypeSelect = (dataType: DataType<unknown>) => {
    onAddDocument(dataType);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-3 py-2 text-sm text-white rounded flex items-center justify-between"
      >
        <PlusIcon />
      </button>

      {isDropdownOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-10">
          {datatypes.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              No datatypes available
            </div>
          ) : (
            datatypes.map((dataType) => (
              <button
                key={dataType.id}
                onClick={() => handleDatatypeSelect(dataType)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                <div className="font-medium">{dataType.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {dataType.name}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const renderSidebar = toolify(FolderView);
