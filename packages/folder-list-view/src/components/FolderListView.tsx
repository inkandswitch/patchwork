import { DocLink, FolderDoc } from "../../../folder/src/datatype";
import * as Automerge from "@automerge/automerge";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, selectDocLink, dataTypeById } from "@patchwork/sdk";
import { Icon, IconType } from "@patchwork/sdk/ui";
import { useDataTypes } from "@patchwork/sdk/hooks";
import styles from "../folder-list-view.module.css";

const FolderListItem: React.FC<{ docLink: DocLink }> = ({ docLink }) => {
  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, docLink.type);
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
