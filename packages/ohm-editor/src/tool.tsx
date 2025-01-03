import React, { useEffect, useState } from "react";
import { EditorProps, HasAssets, makeTool } from "@patchwork/sdk";
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
  const handle = useHandle<HasAssets>(docUrl);
  const [match, setMatch] = useState<ohm.MatchResult | null>(null);
  const [error, setError] = useState<string | undefined>();

  if (!doc || !handle) {
    return <LoadingState />;
  }

  useEffect(() => {
    try {
      const grammar = ohm.grammar(doc.grammar || "");
      const match = grammar.match(doc.example || "");
      setMatch(match);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse grammar");
      setMatch(null);
    }
  }, [doc.grammar, doc.example]);

  return (
    <PageLayout title={doc.title || "Untitled Grammar"} error={error}>
      <div className="flex-1 min-h-0">
        <EditorSection
          title="Grammar Definition"
          path={["grammar"]}
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
            ? "Grammar successfully parsed input!"
            : match?.message || "No input provided"
        }
      />
    </PageLayout>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
