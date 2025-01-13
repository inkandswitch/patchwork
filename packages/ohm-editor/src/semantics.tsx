import React, { useEffect, useState } from "react";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as ohm from "ohm-js";
import { Doc } from "./datatype";
import {
  LoadingState,
  ErrorState,
  EditorSection,
  ResultsPanel,
  PageLayout,
} from "./shared-components";

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<Doc>(docUrl);
  const [match, setMatch] = useState<ohm.MatchResult | null>(null);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [error, setError] = useState<string | undefined>();

  if (!doc || !handle) {
    return <LoadingState />;
  }

  useEffect(() => {
    try {
      // Reset states
      setError(undefined);
      setMatch(null);
      setEvalResult(null);

      // Parse grammar
      const grammar = ohm.grammar(doc.grammar || "");
      const match = grammar.match(doc.example || "");
      setMatch(match);

      if (match.succeeded() && doc.semantics) {
        // Create and evaluate semantics
        const semantics = grammar.createSemantics();
        const semanticsObj = Function(`return ${doc.semantics}`)();
        semantics.addOperation("eval", semanticsObj);

        const adapter = semantics(match);
        const result = adapter.eval();
        setEvalResult(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate grammar");
    }
  }, [doc.grammar, doc.example, doc.semantics]);

  const evaluationDetails = evalResult !== null && match?.succeeded() && (
    <div className="grid grid-cols-1 gap-2">
      <div className="font-medium text-gray-700">Evaluation Result:</div>
      <pre className="bg-gray-100 p-2 rounded-lg overflow-auto text-sm">
        {JSON.stringify(evalResult, null, 2)}
      </pre>
    </div>
  );

  return (
    <PageLayout title={doc.title || "Untitled Grammar"} error={error}>
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <EditorSection
          title="Grammar Definition"
          path={["grammar"]}
          handle={handle}
          error={error}
        />
        <EditorSection
          title="Semantics Definition"
          path={["semantics"]}
          handle={handle}
          error={error}
        />
      </div>

      <div className="h-32">
        <EditorSection
          title="Test Input"
          path={["example"]}
          handle={handle}
          height="32"
        />
      </div>

      <ResultsPanel
        success={match?.succeeded()}
        message={
          match?.succeeded()
            ? "Grammar and semantics successfully evaluated!"
            : match?.message || "No input provided"
        }
        details={evaluationDetails}
      />
    </PageLayout>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
