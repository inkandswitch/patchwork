import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import {
  FolderDoc,
  getType,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { ToolElement } from "@inkandswitch/patchwork-plugins";
import "./styles.css";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { useDatatype } from "@inkandswitch/patchwork-react";

export const AddDocToSidebarButton = ({
  docUrl,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const repo = useRepo();

  const [doc] = useDocument<HasPatchworkMetadata>(docUrl);
  const docDatatypeId = doc ? getType(doc) : undefined;
  const title = useDatatype(docDatatypeId)?.module.getTitle(doc);

  const onAddDocToSidebar = async () => {
    // hack: get reference to the account doc handle through window
    const accountDocHandle = (window as any).accountDocHandle as DocHandle<{
      rootFolderUrl: AutomergeUrl;
    }>;

    const rootFolderDocHandle = await repo.find<FolderDoc>(
      accountDocHandle.doc().rootFolderUrl
    );

    rootFolderDocHandle.change((doc) => {
      doc.docs.unshift({
        name: title ?? "Untitled",
        url: docUrl,
        type: docDatatypeId!,
      });
    });
  };

  if (!docDatatypeId) {
    return null;
  }

  return (
    <div className="h-full flex items-center min-w-0 w-fit">
      <button className="btn btn-ghost" onClick={onAddDocToSidebar}>
        Add to sidebar
      </button>
    </div>
  );
};
