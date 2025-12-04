import "./style.css";
import React from "react";
import { AutomergeUrl, parseAutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { getType, HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { ToolElement } from "@inkandswitch/patchwork-plugins";
import { openDocument } from "@inkandswitch/patchwork-elements";
import { useDatatype } from "@patchwork/react";

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
  const originalDocDatatypeId = originalDoc ? getType(originalDoc) : undefined;
  const titleOfOriginalDoc = useDatatype(
    originalDocDatatypeId
  )?.module.getTitle(originalDoc);

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
          openDocument(element, originalDocWithoutHeads);
        }}
      >
        {titleOfOriginalDoc}
      </button>
      )
    </div>
  );
};
