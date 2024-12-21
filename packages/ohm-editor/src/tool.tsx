import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, HasAssets, makeTool } from "@patchwork/sdk";
import { Doc } from "./datatype";
import React, { useEffect, useState } from "react";
import { MarkdownEditor } from "@patchwork/sdk/markdown";
import * as ohm from "ohm-js";

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<HasAssets>(docUrl);
  const [match, setMatch] = useState<ohm.MatchResult | null>(null);

  if (!doc || !handle) {
    return null;
  }

  useEffect(() => {
    const grammar = ohm.grammar(doc.grammar);
    const match = grammar.match(doc.example);
    console.log(match);
    setMatch(match);
  }, [doc.grammar, doc.example]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-4xl font-bold mb-4">{doc.title}</h2>
      <div className="h-full overflow-auto min-h-0 w-full scroll-smooth">
        <MarkdownEditor path={["grammar"]} handle={handle} />
      </div>
      <div className="h-16 overflow-auto min-h-0 w-full scroll-smooth">
        <MarkdownEditor path={["example"]} handle={handle} />
      </div>
      <div className="match_result">
        {match?.succeeded() ? "Success!" : match?.message}
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
