import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "../lib/toolify";
import { FolderDoc, DocLink } from "@patchwork/filesystem";
import { useState, useRef, useEffect } from "react";
import { createDocOfDataType, DataType } from "@patchwork/plugins";
import { useDatatypeDescriptions } from "../lib/useDatatypeDescriptions";
import { PlusIcon } from "lucide-react";
import { triggerOpenDocument } from "../lib/navigation";

type FolderEntryProps = {
  docLink: DocLink;
  depth?: number;
};

const FolderEntry = ({ docLink, depth = 0 }: FolderEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [doc] = useDocument<FolderDoc>(docLink.url);
  const [scope, setScope] = useState<HTMLElement | null>(null);

  const isFolder = docLink.type === "folder";
  const paddingLeft = `${depth * 16}px`;

  const onOpenDocument = () => {
    console.log("open document");
    triggerOpenDocument(scope!, docLink);
  };

  if (!isFolder) {
    // If it's not a folder, just render the document name with funky styling
    return (
      <div
        ref={setScope}
        className="text-sm py-2 px-3 hover:bg-gradient-to-r hover:from-pink-400 hover:to-purple-500 hover:text-white cursor-pointer truncate transition-all duration-300 transform hover:scale-105 hover:shadow-lg rounded-lg mx-1 my-0.5 group"
        style={{ paddingLeft }}
        title={docLink.name}
        onClick={onOpenDocument}
      >
        <span className="mr-2">📄</span>
        <span className="font-medium group-hover:font-bold">
          {docLink.name}
        </span>
      </div>
    );
  }

  // If it's a folder, render it recursively with funky folder styling
  return (
    <div ref={setScope}>
      <div
        className="text-sm py-2 px-3 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:text-white cursor-pointer font-bold flex items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg rounded-lg mx-1 my-0.5 group"
        style={{ paddingLeft }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-lg animate-pulse">
          {isExpanded ? "📂" : "📁"}
        </span>
        <span className="text-xs transform transition-transform duration-200 group-hover:rotate-12">
          {isExpanded ? "▼" : "▶"}
        </span>
        <button onClick={onOpenDocument} className="group-hover:animate-bounce">
          {docLink.name}
        </button>
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
    <div className="w-[240px] flex-shrink-0 flex flex-col bg-gradient-to-b from-purple-600 via-pink-500 to-orange-400 overflow-y-auto shadow-2xl">
      <div className="p-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg">
        <h2 className="text-lg font-bold animate-pulse flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
            {folderDoc.title}
          </span>
        </h2>
        <AddDocumentButton onAddDocument={onAddDocument} />
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
    <div className="relative mt-2" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-4 py-2 text-sm rounded-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 text-white font-bold shadow-lg transform transition-all duration-300 hover:scale-110 hover:rotate-3 flex items-center justify-center gap-2"
      >
        <span className="text-lg">✨</span>
        <PlusIcon className="animate-spin" />
        <span className="text-lg">✨</span>
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mb-1 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl shadow-2xl max-h-48 overflow-y-auto z-10 border-4 border-yellow-300 animate-pulse">
          {datatypes.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white font-bold flex items-center gap-2">
              <span>😢</span>
              No datatypes available
            </div>
          ) : (
            datatypes.map((dataType, index) => (
              <button
                key={dataType.id}
                onClick={() => handleDatatypeSelect(dataType)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-yellow-300 hover:to-orange-400 hover:text-black focus:outline-none focus:bg-gradient-to-r focus:from-yellow-300 focus:to-orange-400 text-white font-bold transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
              >
                <span className="text-lg">{index % 2 === 0 ? "🚀" : "⭐"}</span>
                <div className="font-bold">{dataType.name}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const renderSidebar = toolify(FolderView);
