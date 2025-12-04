import "./styles.css";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { getType, HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { ToolElement } from "@inkandswitch/patchwork-plugins";
import { useDatatype } from "@patchwork/react";

export const DocumentTitle = ({
  docUrl,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl);
  const docDatatypeId = doc ? getType(doc) : undefined;
  const title = useDatatype(docDatatypeId)?.module.getTitle(doc);

  return (
    <span className="font-semibold whitespace-nowrap h-full flex items-center">
      {title ?? "Untitled"}
    </span>
  );
};
