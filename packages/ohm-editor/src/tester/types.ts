// Types of test expectations
export type TestExpectation =
  | { type: "value"; value: any }
  | { type: "error"; error: string }
  | { type: "throws"; error?: string };

// A single test case
export interface TestCase {
  id: string; // Unique identifier for the test
  name?: string; // Optional descriptive name
  input: string; // Input text to parse
  expected: TestExpectation;
  disabled?: boolean; // Optional flag to skip test
}

// Test suite document type
export interface TestSuite {
  cases: TestCase[];
  metadata?: {
    description?: string;
    tags?: string[];
  };
}
