import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, HasAssets, makeTool } from "@patchwork/sdk";
import { Doc } from "./datatype";
import React, { useEffect, useState } from "react";
import { MarkdownEditor } from "@patchwork/sdk/markdown";
import * as ohm from "ohm-js";
import { Icon } from "@patchwork/sdk/ui";

interface TestCase {
  input: string;
  expected: any;
  result?: any;
  error?: string;
  passed?: boolean;
}

interface TestResults {
  passed: number;
  failed: number;
  errors: number;
}

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<HasAssets>(docUrl);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [results, setResults] = useState<TestResults>({
    passed: 0,
    failed: 0,
    errors: 0,
  });

  if (!doc || !handle) {
    return null;
  }

  useEffect(() => {
    try {
      // Parse test cases from doc.tests
      const tests: TestCase[] = Function(`return ${doc.tests}`)();

      // Create grammar and semantics
      const grammar = ohm.grammar(doc.grammar);
      const semantics = grammar.createSemantics();
      const semanticsObj = Function(`return ${doc.semantics}`)();
      semantics.addOperation("eval", semanticsObj);

      // Run each test
      const updatedTests = tests.map((test) => {
        try {
          const match = grammar.match(test.input);

          if (!match.succeeded()) {
            return {
              ...test,
              error: `Parse error: ${match.message}`,
              passed: false,
            };
          }

          const adapter = semantics(match);
          const result = adapter.eval();

          const passed =
            JSON.stringify(result) === JSON.stringify(test.expected);

          return {
            ...test,
            result,
            passed,
            error: undefined,
          };
        } catch (e) {
          return {
            ...test,
            error: e instanceof Error ? e.message : "Unknown error",
            passed: false,
          };
        }
      });

      // Update test cases and results
      setTestCases(updatedTests);
      setResults({
        passed: updatedTests.filter((t) => t.passed).length,
        failed: updatedTests.filter((t) => t.passed === false && !t.error)
          .length,
        errors: updatedTests.filter((t) => t.error).length,
      });
    } catch (e) {
      console.error("Test execution error:", e);
    }
  }, [doc.grammar, doc.semantics, doc.tests]);

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <h2 className="text-2xl font-bold">{doc.title}</h2>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col">
          <div className="font-semibold mb-2">Grammar:</div>
          <div className="flex-1 overflow-auto">
            <MarkdownEditor path={["grammar"]} handle={handle} />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="font-semibold mb-2">Semantics:</div>
          <div className="flex-1 overflow-auto">
            <MarkdownEditor path={["semantics"]} handle={handle} />
          </div>
        </div>
      </div>

      <div className="h-48">
        <div className="font-semibold mb-2">Test Cases:</div>
        <div className="h-full overflow-auto">
          <MarkdownEditor path={["tests"]} handle={handle} />
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">Test Results:</div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Icon type="CheckCircle2" className="w-4 h-4 text-green-500" />
              {results.passed} passed
            </span>
            <span className="flex items-center gap-1">
              <Icon type="XCircle" className="w-4 h-4 text-red-500" />
              {results.failed} failed
            </span>
            <span className="flex items-center gap-1">
              <Icon type="AlertCircle" className="w-4 h-4 text-yellow-500" />
              {results.errors} errors
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {testCases.map((test, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                test.error
                  ? "bg-yellow-50"
                  : test.passed
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {test.error ? (
                  <Icon
                    type="AlertCircle"
                    className="w-5 h-5 text-yellow-500"
                  />
                ) : test.passed ? (
                  <Icon
                    type="CheckCircle2"
                    className="w-5 h-5 text-green-500"
                  />
                ) : (
                  <Icon type="XCircle" className="w-5 h-5 text-red-500" />
                )}
                <code className="font-mono">{test.input}</code>
              </div>

              {test.error ? (
                <div className="mt-1 text-sm text-yellow-700">{test.error}</div>
              ) : (
                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    Expected:{" "}
                    <code className="font-mono">
                      {JSON.stringify(test.expected)}
                    </code>
                  </div>
                  <div>
                    Got:{" "}
                    <code className="font-mono">
                      {JSON.stringify(test.result)}
                    </code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
