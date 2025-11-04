import { type AutomergeUrl } from "@automerge/vanillajs";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useDocRef, useReactive } from "@patchwork/context/react";
import { isSelected } from "@patchwork/context/selection";
import { DocLink, FolderDoc } from "@patchwork/filesystem";
import { createDocOfDataType2, DataType } from "@patchwork/plugins";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { openDocument } from "../../lib/navigation";
import { toolify } from "../../lib/toolify";
import { useDatatypeDescriptions } from "@patchwork/react";
import type { TinyPatchworkAccountDoc } from "../../lib/account-doc.js";

const FileEntry = ({
  docLink,
  isSelected,
}: {
  docLink: DocLink;
  isSelected: boolean;
}) => {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDocument(root!, docLink.url);
  };

  return (
    <li ref={setRoot}>
      <a
        onClick={onOpenDocument}
        title={docLink.name}
        className={`${isSelected ? "bg-base-200" : ""}`}
      >
        {docLink.name}
      </a>
    </li>
  );
};

const FolderEntry = ({
  docUrl,
  isSelected,
}: {
  docUrl: AutomergeUrl;
  isSelected: boolean;
}) => {
  const [folderDoc, changeFolderDoc] = useDocument<FolderDoc>(docUrl, {
    suspense: true,
  });
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const repo = useRepo();

  const onOpenDocument = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("open document");
    openDocument(root!, docUrl);
  };

  const onAddDocument = async (dataType: DataType<unknown>) => {
    const docHandle = await createDocOfDataType2(dataType, repo);
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
            className={`flex justify-between items-center w-full ${isSelected ? "bg-base-200" : ""}`}
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
  const docRef = useDocRef<FolderDoc>(docLink.url, { suspense: true });

  const selected = useReactive(isSelected(docRef));

  if (docLink.type === "folder") {
    return <FolderEntry docUrl={docLink.url} isSelected={selected} />;
  }
  return <FileEntry docLink={docLink} isSelected={selected} />;
};

const FolderView = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [rootFolder, changeRootFolder] = useDocument<FolderDoc>(docUrl);
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const repo = useRepo();

  const onAddDocument = async (dataType: DataType<unknown>) => {
    const docHandle = await createDocOfDataType2(dataType, repo);

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
    <div className="w-full flex flex-col gap-2" ref={setRoot}>
      <AddDocumentDropdown
        onAddDocument={onAddDocument}
        className="btn btn-ghost text-left btn-sm w-full justify-start font-bold"
      >
        Create new
        <PlusIcon size={16} />
      </AddDocumentDropdown>

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

function Sidebar({ docUrl }: { docUrl: AutomergeUrl }) {
  const doc = useDocRef<TinyPatchworkAccountDoc | FolderDoc>(docUrl);

  return (
    <div className="p-2 h-full bg-base-300">
      <h2 className="text-xl p-3">
        <span className="text-xs">tiny</span> patchwork
      </h2>
      {doc && (
        <FolderView
          docUrl={
            "rootFolderUrl" in doc.value ? doc.value.rootFolderUrl : docUrl
          }
        />
      )}
    </div>
  );
}

export const renderSidebar = toolify(Sidebar);
