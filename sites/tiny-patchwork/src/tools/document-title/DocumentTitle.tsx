import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { ToolElement } from "@patchwork/plugins";
import { useTitle } from "../../lib/datatype-hooks";

export const DocumentTitle = ({
  docUrl,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl);
  const title = useTitle(doc);

  return <span className="font-semibold">{title ?? "Untitled"}</span>;
};
