import {
  useDocument,
  useDocuments,
} from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { AmbEmbedDoc } from "./datatype";
import React, { useMemo } from "react";
import { LinkedSheets } from "./components/LinkedSheets";
import { AmbSheetDoc, Env, evalSheet } from "@patchwork/ambsheet";
import { AutomergeUrl, DocumentId } from "@automerge/automerge-repo";

export const AmbEmbed: React.FC<EditorProps<AmbEmbedDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument<AmbEmbedDoc>(docUrl);
  const linkedSheets = useDocuments<AmbSheetDoc>(
    Object.values(doc?.linkedSheets || {})
  );

  const evaluatedLinkedSheets = useMemo(() => {
    return Object.entries(linkedSheets).reduce((acc, [id, doc]) => {
      acc[`automerge:${id}` as AutomergeUrl] = evalSheet(doc.data);
      return acc;
    }, {} as Record<AutomergeUrl, Env>);
  }, [linkedSheets]);

  if (!doc) {
    return null;
  }

  const handleLinkedSheetsChange = (newSheets: typeof doc.linkedSheets) => {
    changeDoc((d) => {
      d.linkedSheets = newSheets;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <LinkedSheets
        linkedSheets={doc.linkedSheets}
        evaluatedSheets={evaluatedLinkedSheets}
        onChange={handleLinkedSheetsChange}
      />
      <div className="flex-1 p-4">{/* Rest of the content will go here */}</div>
    </div>
  );
};

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambEmbed",
  name: "Amb Embed",
  supportedDataTypes: ["ambEmbed"],
  EditorComponent: AmbEmbed,
});
