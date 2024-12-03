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
import { CellReferenceBlocks } from "./components/CellReferenceBlocks";

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

  const handleAddBlock = () => {
    changeDoc((d) => {
      d.blocks.push({
        type: "cellReference",
        sheetName: Object.keys(doc.linkedSheets)[0] || "",
        cellName: "",
      });
    });
  };

  const handleUpdateBlock = (
    index: number,
    sheetName: string,
    cellName: string
  ) => {
    changeDoc((d) => {
      d.blocks[index].sheetName = sheetName;
      d.blocks[index].cellName = cellName;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <LinkedSheets
        linkedSheets={doc.linkedSheets}
        evaluatedSheets={evaluatedLinkedSheets}
        onChange={handleLinkedSheetsChange}
      />
      <div className="flex-1 p-4">
        <div className="mb-4">
          <button
            onClick={handleAddBlock}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Cell Reference
          </button>
        </div>
        <CellReferenceBlocks
          blocks={doc.blocks}
          linkedSheets={doc.linkedSheets}
          onUpdateBlock={handleUpdateBlock}
        />
      </div>
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
