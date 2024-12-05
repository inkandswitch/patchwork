import {
  useDocument,
  useDocuments,
} from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { AmbEmbedDoc } from "./datatype";
import React, { useMemo } from "react";
import { LinkedSheets } from "./components/LinkedSheets";
import {
  AmbSheetDoc,
  Env,
  evalSheet,
  Filter,
  filter2,
  FilteredResults,
} from "@patchwork/ambsheet";
import { AutomergeUrl, DocumentId } from "@automerge/automerge-repo";
import { CellReferenceBlocks } from "./components/CellReferenceBlocks";
import { Button } from "@patchwork/sdk/ui/button";

export const AmbEmbed: React.FC<EditorProps<AmbEmbedDoc, string>> = ({
  docUrl,
}) => {
  const FILTER: Filter = {
    pos: { row: 0, col: 0 },
    values: [2, 3],
  };

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

  const filteredLinkedSheets = useMemo(() => {
    return Object.entries(evaluatedLinkedSheets).reduce((acc, [url, env]) => {
      const filteredResults = filter2(env.results, [FILTER]);
      acc[url as AutomergeUrl] = filteredResults;
      return acc;
    }, {} as Record<AutomergeUrl, FilteredResults>);
  }, [evaluatedLinkedSheets]);

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
        viewerName: "default",
      });
    });
  };

  const handleUpdateBlock = (
    index: number,
    sheetName: string,
    cellName: string,
    viewerName: string
  ) => {
    changeDoc((d) => {
      d.blocks[index].sheetName = sheetName;
      d.blocks[index].cellName = cellName;
      d.blocks[index].viewerName = viewerName;
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
          <Button onClick={handleAddBlock}>Add Cell Reference</Button>
        </div>
        <CellReferenceBlocks
          blocks={doc.blocks}
          linkedSheets={doc.linkedSheets}
          evaluatedSheetsByUrl={evaluatedLinkedSheets}
          filteredResultsByUrl={filteredLinkedSheets}
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
