import React, { useEffect, useState } from "react";
import { EditorProps } from "@patchwork/sdk";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import { Doc } from "../datatype";
import { TestCase } from "./types";
import { TestResult, runTestSuite } from "./runner";
import { LoadingState, PageLayout } from "../shared-components";
import { TestResultsSummary, TestCaseEditor } from "./test-components";
import { Icon } from "@patchwork/sdk/ui";

let nextId = 1;
const createTestCase = (): TestCase => ({
  id: `test-${nextId++}`,
  name: "",
  input: "",
  expected: { type: "value", value: null },
  disabled: false,
});

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<Doc>(docUrl);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [error, setError] = useState<string | undefined>();

  if (!doc || !handle) {
    return <LoadingState />;
  }

  useEffect(() => {
    try {
      setError(undefined);
      const results = runTestSuite(
        doc.grammar,
        doc.semantics,
        doc.testSuite.cases
      );
      setTestResults(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run tests");
      setTestResults([]);
    }
  }, [doc.grammar, doc.semantics, doc.testSuite.cases]);

  const deleteTestCase = (index: number) => {
    changeDoc((d) => {
      d.testSuite.cases.splice(index, 1);
    });
  };

  const addTestCase = () => {
    changeDoc((d) => {
      d.testSuite.cases.push(createTestCase());
    });
  };

  const results = {
    passed: testResults.filter((r) => r.passed).length,
    failed: testResults.filter((r) => !r.passed).length,
    errors: testResults.filter((r) => r.error && !r.passed).length,
  };

  return (
    <PageLayout title={doc.title || "Untitled Grammar"} error={error}>
      <div className="grid grid-rows-[auto_1fr] h-full gap-4">
        {/* Top row: Grammar and Semantics */}
        <div className="h-64 min-h-0 grid grid-cols-2 gap-4">
          <div className="min-h-0 border rounded-lg p-4 bg-gray-50">
            <div className="font-medium mb-2">Grammar:</div>
            <pre className="h-full overflow-auto font-mono text-sm">
              {doc.grammar}
            </pre>
          </div>
          <div className="min-h-0 border rounded-lg p-4 bg-gray-50">
            <div className="font-medium mb-2">Semantics:</div>
            <pre className="h-full overflow-auto font-mono text-sm">
              {doc.semantics}
            </pre>
          </div>
        </div>

        {/* Test Cases and Results */}
        <div className="min-h-0 flex flex-col">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-gray-800">Test Cases</h3>
              <TestResultsSummary results={results} />
            </div>
            <button
              onClick={addTestCase}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <Icon type="Plus" className="w-4 h-4" />
              Add Test Case
            </button>
          </div>

          <div className="overflow-auto flex-1">
            <div className="space-y-4">
              {doc.testSuite.cases.map((testCase, index) => (
                <TestCaseEditor
                  key={testCase.id}
                  testCase={testCase}
                  result={testResults[index] || { testCase, passed: false }}
                  handle={handle}
                  index={index}
                  onDelete={() => deleteTestCase(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
