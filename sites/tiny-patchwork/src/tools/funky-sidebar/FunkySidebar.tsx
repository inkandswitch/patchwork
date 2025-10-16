import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "../../lib/toolify";
import { FolderDoc, DocLink } from "@patchwork/filesystem";
import { useState } from "react";
import { createDocOfDataType, DataType } from "@patchwork/plugins";
import { useDatatypeDescriptions } from "../../lib/datatype-hooks";
import {
  PlusIcon,
  FolderIcon,
  FileIcon,
  SparklesIcon,
  RocketIcon,
} from "lucide-react";
import { openDocument } from "../../lib/navigation";
import { useDocRef } from "@patchwork/context/react";
import type { TinyPatchworkAccountDoc } from "../../lib/account-doc.js";

const FileEntry = ({ docLink }: { docLink: DocLink }) => {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("open document");
    openDocument(root!, docLink.url);
  };

  const getRandomColor = () => {
    const colors = [
      "from-pink-500 to-violet-500",
      "from-cyan-500 to-blue-500",
      "from-green-400 to-emerald-500",
      "from-yellow-400 to-orange-500",
      "from-purple-500 to-pink-500",
      "from-indigo-500 to-purple-500",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <li
      ref={setRoot}
      className="transform transition-all duration-300 hover:scale-105"
    >
      <a
        onClick={onOpenDocument}
        title={docLink.name}
        className={`
          flex items-center gap-3 p-3 rounded-xl cursor-pointer
          bg-gradient-to-r ${getRandomColor()}
          text-white font-medium shadow-lg
          hover:shadow-xl hover:shadow-purple-500/25
          transition-all duration-300 ease-out
          ${isHovered ? "animate-pulse" : ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <FileIcon size={18} className="animate-bounce" />
        <span className="truncate">{docLink.name}</span>
        {isHovered && <SparklesIcon size={16} className="animate-spin" />}
      </a>
    </li>
  );
};

const FolderEntry = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [folderDoc, changeFolderDoc] = useDocument<FolderDoc>(docUrl, {
    suspense: true,
  });
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const repo = useRepo();

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("open document");
    openDocument(root!, docUrl);
  };

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

  const toggleFolder = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <li ref={setRoot} className="mb-2">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-1 shadow-lg hover:shadow-2xl transition-all duration-300">
        <div className="bg-gray-900/90 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={toggleFolder}
              className={`
                flex items-center gap-3 text-white font-bold text-lg
                transition-all duration-300 hover:scale-105
                ${isHovered ? "animate-pulse" : ""}
              `}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <FolderIcon
                size={24}
                className={`
                  transition-all duration-300
                  ${isOpen ? "rotate-12 text-yellow-400" : "text-blue-400"}
                  ${isHovered ? "animate-bounce" : ""}
                `}
              />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {folderDoc.title}
              </span>
              {isHovered && (
                <RocketIcon size={20} className="animate-spin text-pink-400" />
              )}
            </button>

            <AddDocumentDropdown onAddDocument={onAddDocument}>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:scale-110">
                <PlusIcon size={16} className="animate-pulse" />
                Add
              </div>
            </AddDocumentDropdown>
          </div>

          {isOpen && folderDoc && folderDoc.docs && (
            <ul className="mt-4 space-y-2 pl-4 border-l-2 border-gradient-to-b from-purple-500 to-pink-500">
              {folderDoc.docs.map((childDocLink, index) => (
                <DocLinkEntry
                  key={childDocLink.url || index}
                  docLink={childDocLink}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
};

const DocLinkEntry = ({ docLink }: { docLink: DocLink }) => {
  if (docLink.type === "folder") {
    return <FolderEntry docUrl={docLink.url} />;
  }
  return <FileEntry docLink={docLink} />;
};

const FolderView = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [rootFolder, changeRootFolder] = useDocument<FolderDoc>(docUrl);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [isCreateHovered, setIsCreateHovered] = useState(false);
  const repo = useRepo();

  const onAddDocument = async (dataType: DataType<unknown>) => {
    const docHandle = createDocOfDataType(dataType, repo);
    const docLink = {
      name: dataType.name,
      type: dataType.id,
      url: docHandle.url,
    };

    changeRootFolder((doc) => {
      doc.docs.push(docLink);
    });

    openDocument(root!, docLink.url);
  };

  return (
    <div
      className="w-full flex flex-col gap-6 p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen"
      ref={setRoot}
    >
      {/* Funky Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
          ✨ FUNKY SIDEBAR ✨
        </h2>
        <div className="w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full mt-2 animate-pulse"></div>
      </div>

      {/* Psychedelic Create Button */}
      <AddDocumentDropdown
        onAddDocument={onAddDocument}
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500
          text-white font-bold text-lg py-4 px-6 rounded-2xl
          shadow-2xl hover:shadow-pink-500/50
          transition-all duration-500 ease-out
          transform hover:scale-110 hover:rotate-1
          ${isCreateHovered ? "animate-bounce" : ""}
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000
        `}
        onMouseEnter={() => setIsCreateHovered(true)}
        onMouseLeave={() => setIsCreateHovered(false)}
      >
        <div className="flex items-center justify-center gap-3">
          <RocketIcon size={24} className="animate-spin" />
          <span>CREATE SOMETHING AWESOME</span>
          <SparklesIcon size={24} className="animate-pulse" />
        </div>
      </AddDocumentDropdown>

      {/* Rainbow Separator */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 rounded-full h-2 animate-pulse"></div>
        <div className="relative bg-gray-900 h-2 rounded-full mx-1"></div>
      </div>

      {/* Document List */}
      <ul className="space-y-3 flex-1">
        {rootFolder?.docs.map((docLink, index) => (
          <DocLinkEntry docLink={docLink} key={index} />
        ))}
      </ul>

      {/* Floating Particles Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full
              animate-pulse opacity-30
            `}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const AddDocumentDropdown = ({
  onAddDocument,
  className,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  onAddDocument: (dataType: DataType<unknown>) => void;
  className?: string;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => {
  const datatypes = useDatatypeDescriptions();
  const [isOpen, setIsOpen] = useState(false);

  const handleDatatypeSelect = (dataType: DataType<unknown>) => {
    onAddDocument(dataType);
    setIsOpen(false);
  };

  const getRandomEmoji = () => {
    const emojis = ["🚀", "✨", "🎨", "🎭", "🎪", "🎯", "🎲", "🎸", "🎺", "🎻"];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div className="dropdown">
      <button
        tabIndex={0}
        className={className}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </button>
      {isOpen && (
        <ul className="dropdown-content menu bg-gradient-to-br from-purple-800 to-pink-800 rounded-2xl z-50 p-4 shadow-2xl border-2 border-purple-400 min-w-[200px] transform animate-in slide-in-from-top-2 duration-300">
          {datatypes.length === 0 ? (
            <li className="disabled">
              <span className="text-purple-200">No datatypes available 😢</span>
            </li>
          ) : (
            datatypes.map((dataType, index) => (
              <li key={dataType.id} className="mb-2">
                <button
                  onClick={(evt) => {
                    evt.preventDefault();
                    (document.activeElement as HTMLElement)?.blur();
                    handleDatatypeSelect(dataType);
                  }}
                  className={`
                    w-full text-left p-3 rounded-xl
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    text-white font-medium
                    hover:from-pink-500 hover:to-purple-500
                    transform hover:scale-105 hover:rotate-1
                    transition-all duration-300
                    shadow-lg hover:shadow-xl
                    flex items-center gap-3
                  `}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <span className="text-xl animate-bounce">
                    {getRandomEmoji()}
                  </span>
                  <span className="font-bold">{dataType.name}</span>
                  <SparklesIcon size={16} className="ml-auto animate-pulse" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

function FunkySidebar({ docUrl }: { docUrl: AutomergeUrl }) {
  const doc = useDocRef<TinyPatchworkAccountDoc | FolderDoc>(docUrl);

  return (
    doc && (
      <FolderView
        docUrl={
          "@tiny-patchwork" in doc.value
            ? doc.value["@tiny-patchwork"].rootFolderUrl
            : docUrl
        }
      />
    )
  );
}

export const renderSidebar = toolify(FunkySidebar);
