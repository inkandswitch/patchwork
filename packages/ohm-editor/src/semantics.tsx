import React, { useCallback, useEffect, useState } from "react";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { updateText } from "@automerge/automerge-repo";
import * as ohm from "ohm-js";
import { Doc } from "./datatype";
import {
  LoadingState,
  ErrorState,
  EditorSection,
  ResultsPanel,
  PageLayout,
} from "./shared-components";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Button, Icon, Input } from "@patchwork/sdk/ui";

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<Doc>(docUrl);
  const [match, setMatch] = useState<ohm.MatchResult | null>(null);

  const setSemanticsName = useCallback(
    (semanticsName: string) => {
      changeDoc((d) => updateText(d, ["semanticsName"], semanticsName));
    },
    [changeDoc]
  );

  const setExampleArgs = useCallback(
    (args: string) => {
      changeDoc((d) => (d.exampleArgs = args));
    },
    [changeDoc]
  );

  // Parens indicate that the semantics function takes arguments, so we show the example args input
  const shouldShowExampleArgs = doc?.semanticsName?.match("\\(");

  const [evalResult, setEvalResult] = useState<any>(null);
  const [error, setError] = useState<string | undefined>();
  const [showGrammar, setShowGrammar] = useState(true);

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
        semantics.addOperation(doc.semanticsName || "eval", semanticsObj);

        const adapter = semantics(match);
        const args = JSON.parse(doc.exampleArgs || "{}");
        console.log({ args, adapter });
        const result = adapter.eval(...args);
        const evalResult = JSON.stringify(result, null, 2);
        setEvalResult(evalResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to evaluate grammar");
    }
  }, [doc.grammar, doc.example, doc.semantics]);

  const evaluationDetails = evalResult !== null && match?.succeeded() && (
    <div className="grid grid-cols-1 gap-2">
      <div className="font-medium text-gray-700">Evaluation Result:</div>
      <pre className="bg-gray-100 p-2 rounded-lg overflow-auto text-sm">
        {evalResult}
      </pre>
    </div>
  );

  return (
    <PageLayout title={doc.title || "Untitled Grammar"} error={error}>
      <PanelGroup
        direction="vertical"
        className="flex-1 min-h-0 overflow-hidden"
      >
        <Panel defaultSize={70} className="overflow-hidden">
          <div className="h-full overflow-hidden">
            <PanelGroup direction="horizontal" className="h-full">
              <Panel defaultSize={60} className="overflow-hidden">
                <div className="h-full overflow-hidden flex flex-col">
                  <div className="flex items-center h-8 flex-none">
                    <span className="font-semibold text-gray-800 px-2">
                      Semantics Definition
                    </span>
                    {!showGrammar && (
                      <Button
                        variant="ghost"
                        className="ml-auto h-8 px-2"
                        onClick={() => setShowGrammar(true)}
                      >
                        <Icon type="ChevronLeft" className="w-4 h-4 mr-2" />
                        Show Grammar
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center h-8 flex-none">
                    <Input
                      value={doc?.semanticsName}
                      onChange={(e) => setSemanticsName(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <EditorSection
                      title=""
                      path={["semantics"]}
                      handle={handle}
                      error={error}
                    />
                  </div>
                </div>
              </Panel>
              {showGrammar && (
                <>
                  <PanelResizeHandle className="w-2 bg-gray-100 hover:bg-gray-200 transition-colors cursor-col-resize" />
                  <Panel defaultSize={40} className="overflow-hidden">
                    <div className="h-full overflow-hidden flex flex-col">
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-2 py-1 h-8 font-medium flex-none"
                        onClick={() => setShowGrammar(false)}
                      >
                        <Icon type="ChevronRight" className="w-4 h-4 mr-2" />
                        Grammar Definition
                      </Button>
                      <div className="flex-1 overflow-hidden">
                        <EditorSection
                          title=""
                          path={["grammar"]}
                          handle={handle}
                          error={error}
                        />
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </Panel>

        <PanelResizeHandle className="h-2 bg-gray-100 hover:bg-gray-200 transition-colors cursor-row-resize" />

        <Panel defaultSize={30} className="overflow-hidden">
          <div className="h-full flex flex-col gap-4 overflow-hidden">
            <div className="h-32 flex-none">
              <EditorSection
                title="Test Input"
                path={["example"]}
                handle={handle}
              />
            </div>
            {shouldShowExampleArgs && (
              <div className="flex items-center h-8 flex-none">
                <Input
                  value={doc?.exampleArgs}
                  onChange={(e) => setExampleArgs(e.target.value)}
                />
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-auto">
              <ResultsPanel
                success={match?.succeeded()}
                message={
                  match?.succeeded()
                    ? "Grammar and semantics successfully evaluated!"
                    : match?.message || "No input provided"
                }
                details={evaluationDetails}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </PageLayout>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
