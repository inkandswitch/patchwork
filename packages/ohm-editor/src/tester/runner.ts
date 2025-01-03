import * as ohm from "ohm-js";
import { TestCase, TestExpectation } from "./types";

export interface TestResult {
  result?: any;
  error?: string;
  passed: boolean;
}

export function runTest(
  grammar: ohm.Grammar,
  semantics: ohm.Semantics,
  testCase: TestCase
): TestResult {
  try {
    // Skip disabled tests
    if (testCase.disabled) {
      return {
        passed: true,
        error: "Test skipped",
      };
    }

    // Try to match the input
    const match = grammar.match(testCase.input);
    if (!match.succeeded()) {
      // If we expected an error or throw, this might be a pass
      if (
        testCase.expected.type === "error" ||
        testCase.expected.type === "throws"
      ) {
        return {
          error: match.message,
          passed: true,
        };
      }

      return {
        error: `Parse error: ${match.message}`,
        passed: false,
      };
    }

    // If we get here and were expecting an error, that's a fail
    if (
      testCase.expected.type === "error" ||
      testCase.expected.type === "throws"
    ) {
      return {
        result: "Successfully parsed (expected failure)",
        passed: false,
      };
    }

    // Evaluate the semantics
    const adapter = semantics(match);
    const result = adapter.eval();

    // For value expectations, compare the result
    if (testCase.expected.type === "value") {
      const passed =
        JSON.stringify(result) === JSON.stringify(testCase.expected.value);
      return {
        result,
        passed,
      };
    }

    // Shouldn't get here given the type system
    return {
      error: "Invalid test expectation type",
      passed: false,
    };
  } catch (e) {
    // Handle thrown errors
    if (testCase.expected.type === "throws") {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const passed = testCase.expected.error
        ? errorMessage.includes(testCase.expected.error)
        : true;

      return {
        error: errorMessage,
        passed,
      };
    }

    return {
      error: e instanceof Error ? e.message : "Unknown error",
      passed: false,
    };
  }
}

export function runTestSuite(
  grammar: string,
  semanticsCode: string,
  testCases: TestCase[]
): TestResult[] {
  try {
    const grammarInstance = ohm.grammar(grammar);
    const semantics = grammarInstance.createSemantics();
    const semanticsObj = Function(`return ${semanticsCode}`)();
    semantics.addOperation("eval", semanticsObj);

    return testCases.map((testCase) =>
      runTest(grammarInstance, semantics, testCase)
    );
  } catch (e) {
    // If we can't create the grammar or semantics, fail all tests
    const error =
      e instanceof Error ? e.message : "Failed to initialize grammar/semantics";
    return testCases.map((testCase) => ({
      testCase,
      error,
      passed: false,
    }));
  }
}
