import React from "react";
import { Icon } from "@patchwork/sdk/ui";
import { TestResult } from "./runner";
import { TestCase, TestExpectation } from "./types";
import { HasAssets } from "@patchwork/sdk";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { DocHandle, updateText } from "@automerge/automerge-repo";
import { Doc } from "../datatype";

interface TestCaseEditorProps {
  testCase: TestCase;
  result: TestResult;
  handle: DocHandle<HasAssets>;
  index: number;
  onDelete: () => void;
}

export const TestCaseEditor: React.FC<TestCaseEditorProps> = ({
  testCase,
  result,
  handle,
  index,
  onDelete,
}) => {
  const [doc, changeDoc] = useDocument<Doc>(handle.url);

  if (!doc) return null;

  const updateName = (name: string) => {
    changeDoc((d) => {
      updateText(d, ["testSuite", "cases", index, "name"], name);
    });
  };

  const updateInput = (input: string) => {
    changeDoc((d) => {
      updateText(d, ["testSuite", "cases", index, "input"], input);
    });
  };

  const toggleDisabled = () => {
    changeDoc((d) => {
      d.testSuite.cases[index].disabled = !d.testSuite.cases[index].disabled;
    });
  };

  const updateExpectationType = (type: TestExpectation["type"]) => {
    changeDoc((d) => {
      const testCase = d.testSuite.cases[index];
      switch (type) {
        case "value":
          testCase.expected = { type, value: null };
          break;
        case "error":
          testCase.expected = { type, error: "" };
          break;
        case "throws":
          testCase.expected = { type };
          break;
      }
    });
  };

  const updateExpectationValue = (value: any) => {
    changeDoc((d) => {
      const testCase = d.testSuite.cases[index];
      if (testCase.expected.type === "value") {
        testCase.expected.value = value;
      }
    });
  };

  const updateExpectationError = (error: string) => {
    changeDoc((d) => {
      const testCase = d.testSuite.cases[index];
      if (
        testCase.expected.type === "error" ||
        testCase.expected.type === "throws"
      ) {
        updateText(
          d,
          ["testSuite", "cases", index, "expected", "error"],
          error
        );
      }
    });
  };

  // Show failure details if there's an error or test failed
  const showDetails = !result.passed || result.error;

  const statusIcon = result.error ? (
    <Icon type="TriangleAlert" className="w-5 h-5 text-yellow-500" />
  ) : result.passed ? (
    <Icon type="CircleCheck" className="w-5 h-5 text-green-500" />
  ) : (
    <Icon type="CircleX" className="w-5 h-5 text-red-500" />
  );

  const expectationDisplay =
    testCase.expected.type === "value"
      ? JSON.stringify(testCase.expected.value)
      : testCase.expected.type === "error"
      ? `Error: ${testCase.expected.error}`
      : `Throws${
          testCase.expected.error ? `: ${testCase.expected.error}` : ""
        }`;

  return (
    <div
      className={`rounded-lg border ${
        !result
          ? "bg-white border-gray-200"
          : result.error
          ? "bg-yellow-50 border-yellow-200"
          : result.passed
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {/* Compact Row */}
      <div className="flex items-center gap-4 px-4 py-2">
        {statusIcon}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          <input
            type="text"
            value={testCase.name || ""}
            onChange={(e) => updateName(e.target.value)}
            placeholder="Test case name"
            className="w-40 px-2 py-1 rounded border-gray-200 bg-white bg-opacity-50"
          />
          <div className="flex-1 min-w-0 flex gap-2">
            <input
              value={testCase.input}
              onChange={(e) => updateInput(e.target.value)}
              placeholder="Input"
              className="flex-1 min-w-0 px-2 py-1 rounded border-gray-200 font-mono text-sm bg-white bg-opacity-50"
            />
            <select
              value={testCase.expected.type}
              onChange={(e) =>
                updateExpectationType(e.target.value as TestExpectation["type"])
              }
              className="w-32 px-2 py-1 rounded border-gray-200 bg-white bg-opacity-50"
            >
              <option value="value">Equal to</option>
              <option value="error">Fails with</option>
              <option value="throws">Throws</option>
            </select>
            <input
              type="text"
              value={
                testCase.expected.type === "value"
                  ? JSON.stringify(testCase.expected.value)
                  : testCase.expected.error || ""
              }
              onChange={(e) => {
                if (testCase.expected.type === "value") {
                  try {
                    updateExpectationValue(JSON.parse(e.target.value));
                  } catch {}
                } else {
                  updateExpectationError(e.target.value);
                }
              }}
              placeholder={
                testCase.expected.type === "value"
                  ? "Expected value (JSON)"
                  : "Expected error"
              }
              className="flex-1 min-w-0 px-2 py-1 rounded border-gray-200 font-mono text-sm bg-white bg-opacity-50"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDisabled}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon
              type={testCase.disabled ? "EyeOff" : "Eye"}
              className="w-5 h-5"
            />
          </button>
          <button
            onClick={onDelete}
            className="text-gray-500 hover:text-red-500"
          >
            <Icon type="Trash2" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Failure Details */}
      {showDetails && (result.result !== undefined || result.error) && (
        <div className="px-4 py-2 border-t bg-white bg-opacity-25">
          <div className="text-sm text-gray-700">
            {result.error ? (
              <div className="text-red-600">{result.error}</div>
            ) : (
              <div className="flex gap-2">
                <span className="font-medium">Got:</span>
                <pre className="inline font-mono">
                  {JSON.stringify(result.result)}
                </pre>
                <span className="font-medium">Expected:</span>
                <pre className="inline font-mono">{expectationDisplay}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TestResultsSummary = ({
  results,
}: {
  results: { passed: number; failed: number; errors: number };
}) => (
  <div className="flex gap-4 text-sm">
    <span className="flex items-center gap-1">
      <Icon type="CircleCheck" className="w-4 h-4 text-green-500" />
      {results.passed} passed
    </span>
    <span className="flex items-center gap-1">
      <Icon type="CircleX" className="w-4 h-4 text-red-500" />
      {results.failed} failed
    </span>
    <span className="flex items-center gap-1">
      <Icon type="TriangleAlert" className="w-4 h-4 text-yellow-500" />
      {results.errors} errors
    </span>
  </div>
);
