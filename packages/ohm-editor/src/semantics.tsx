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
  const [evalResult, setEvalResult] = useState<any>(null);

  if (!doc || !handle) {
    return null;
  }

  useEffect(() => {
    try {
      const grammar = ohm.grammar(doc.grammar);
      const match = grammar.match(doc.example);
      setMatch(match);

      if (match.succeeded() && doc.semantics) {
        // Create semantics
        const semantics = grammar.createSemantics();
        const semanticsObj = Function(`return ${doc.semantics}`)();
        semantics.addOperation("eval", semanticsObj);

        // Evaluate
        const adapter = semantics(match);
        const result = adapter.eval();
        setEvalResult(result);
      } else {
        setEvalResult(null);
      }
    } catch (e) {
      console.error("Evaluation error:", e);
      setEvalResult(null);
    }
  }, [doc.grammar, doc.example, doc.semantics]);

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <h2 className="text-2xl font-bold">{doc.title}</h2>

      <div className="flex-1 min-h-0">
        <div className="font-semibold mb-2">Grammar:</div>
        <div className="h-full overflow-auto">
          <MarkdownEditor path={["grammar"]} handle={handle} />
        </div>
      </div>

      <div className="h-48">
        <div className="font-semibold mb-2">Semantics:</div>
        <div className="h-full overflow-auto">
          <MarkdownEditor path={["semantics"]} handle={handle} />
        </div>
      </div>

      <div className="h-24">
        <div className="font-semibold mb-2">Test Input:</div>
        <div className="h-full overflow-auto">
          <MarkdownEditor path={["example"]} handle={handle} />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="font-semibold mb-2">Results:</div>
        <div className="space-y-2">
          <div>
            Parse:{" "}
            {match?.succeeded() ? (
              <span className="text-green-600">Success!</span>
            ) : (
              <span className="text-red-600">{match?.message}</span>
            )}
          </div>
          {evalResult !== null && match?.succeeded() && (
            <div>
              Evaluation:{" "}
              <pre className="inline">{JSON.stringify(evalResult)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
