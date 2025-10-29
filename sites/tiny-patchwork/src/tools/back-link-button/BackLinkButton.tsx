import { AutomergeUrl, parseAutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { ToolElement } from "@patchwork/plugins";
import { useTitle } from "../../lib/datatype-hooks";
import { openDocument } from "../../lib/navigation";

export const BackLinkButton = ({
  docUrl,
  element,
}: {
  docUrl: AutomergeUrl;
  element: ToolElement;
}) => {
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl);
  const originalDocUrl = doc?.["@patchwork"]?.copyOf as
    | AutomergeUrl
    | undefined;
  const [originalDoc] = useDocument<HasPatchworkMetadata>(originalDocUrl);
  const titleOfOriginalDoc = useTitle(originalDoc);

  if (!originalDocUrl) {
    return null;
  }

  // strip the heads because we want to link to the current version of the document
  const originalDocWithoutHeads =
    `automerge:${parseAutomergeUrl(originalDocUrl).documentId}` as AutomergeUrl;

  return (
    <div className="text-base-content text-sm">
      (Copy of{" "}
      <button
        className="link"
        onClick={() => {
          openDocument(element, originalDocUrl);
        }}
      >
        {titleOfOriginalDoc}
      </button>
      )
    </div>
  );
};
