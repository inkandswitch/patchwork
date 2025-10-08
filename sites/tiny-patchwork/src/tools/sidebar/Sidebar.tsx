import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "../../lib/toolify";
import { FolderDoc, DocLink } from "@patchwork/filesystem";
import { useState } from "react";
import { createDocOfDataType, DataType } from "@patchwork/plugins";
import { useDatatypeDescriptions } from "../../lib/useDatatypeDescriptions";
import { PlusIcon } from "lucide-react";
import { triggerOpenDocument } from "../../lib/navigation";

const FileEntry = ({ docLink }: { docLink: DocLink }) => {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("open document");
    triggerOpenDocument(root!, docLink);
  };

  return (
    <li ref={setRoot}>
      <a onClick={onOpenDocument} title={docLink.name}>
        {docLink.name}
      </a>
    </li>
  );
};

const FolderEntry = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [folderDoc, changeFolderDoc] = useDocument<FolderDoc>(docUrl, {
    suspense: true,
  });
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const repo = useRepo();

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("open document");
    triggerOpenDocument(root!, {
      url: docUrl,
      name: folderDoc.title,
      type: "folder",
    });
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

  // If it's a folder, render it recursively using details/summary
  return (
    <li ref={setRoot}>
      <details open>
        <summary>
          <button
            onClick={onOpenDocument}
            className="flex justify-between items-center w-full"
          >
            {folderDoc.title}

            <AddDocumentDropdown onAddDocument={onAddDocument}>
              Add
            </AddDocumentDropdown>
          </button>
        </summary>
        {folderDoc && folderDoc.docs && (
          <ul>
            {folderDoc.docs.map((childDocLink, index) => (
              <DocLinkEntry
                key={childDocLink.url || index}
                docLink={childDocLink}
              />
            ))}
          </ul>
        )}
      </details>
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

    triggerOpenDocument(root!, docLink);
  };

  return (
    <div className="w-full flex flex-col gap-2" ref={setRoot}>
      <hr className="border-gray-200" />

      <AddDocumentDropdown
        onAddDocument={onAddDocument}
        className="btn btn-ghost text-left btn-sm w-full justify-start font-medium"
      >
        Create new
        <PlusIcon size={16} />
      </AddDocumentDropdown>

      <hr className="border-gray-200" />

      <ul className="menu p-0 w-full">
        {rootFolder?.docs.map((docLink, index) => (
          <DocLinkEntry docLink={docLink} key={index} />
        ))}
      </ul>
    </div>
  );
};

const AddDocumentDropdown = ({
  onAddDocument,
  className,
  children,
}: {
  onAddDocument: (dataType: DataType<unknown>) => void;
  className?: string;
  children: React.ReactNode;
}) => {
  const datatypes = useDatatypeDescriptions();

  const handleDatatypeSelect = (dataType: DataType<unknown>) => {
    onAddDocument(dataType);
  };

  return (
    <div className="dropdown">
      <button tabIndex={0} className={className}>
        {children}
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-1 p-2 shadow-sm"
      >
        {datatypes.length === 0 ? (
          <li className="disabled">
            <span className="text-base-content/60">No datatypes available</span>
          </li>
        ) : (
          datatypes.map((dataType) => (
            <li key={dataType.id}>
              <button
                onClick={(evt) => {
                  (document.activeElement as HTMLElement)?.blur();
                  handleDatatypeSelect(dataType);
                }}
                className="text-left"
              >
                <span className="font-medium">{dataType.name}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export const renderSidebar = toolify(FolderView);
