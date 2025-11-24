/**
 * Type checking file for Ref type inference.
 * Hover over variables to verify correct type inference.
 * This file is not executed - it's purely for type checking.
 */

import type { DocHandle } from "@automerge/automerge-repo";
import { ref } from "../factory";
import type { MutableText } from "../types";

type TestDoc = {
  title: string;
  count: number;
  todos: Array<{ title: string; done: boolean }>;
  user: {
    name: string;
    email: string;
  };
};

declare const handle: DocHandle<TestDoc>;

// String refs should receive MutableText
const titleRef = ref(handle, "title");
titleRef.change((text) => {
  // text should be MutableText
  text.splice(0, 5, "Hello");
  text.updateText("New");
  text.toUpperCase(); // Should have all string methods
  const _t1: typeof text = {} as MutableText; // Should pass
});

// Number refs should receive number
const countRef = ref(handle, "count");
countRef.change((count) => {
  // count should be number
  const _n: typeof count = 0; // Should pass
  return count + 1;
});

// Object refs should receive the object
const userRef = ref(handle, "user");
userRef.change((user) => {
  // user should be { name: string; email: string }
  user.name = "Alice";
  user.email = "alice@example.com";
  const _u: typeof user = { name: "", email: "" }; // Should pass
});

// Nested string refs should receive MutableText
const nameRef = ref(handle, "user", "name");
nameRef.change((name) => {
  // name should be MutableText
  name.splice(0, 0, "Dr. ");
  const _n: typeof name = {} as MutableText; // Should pass
});

// Array element refs
const todoRef = ref(handle, "todos", 0);
todoRef.change((todo) => {
  // todo should be { title: string; done: boolean }
  todo.done = true;
  const _t: typeof todo = { title: "", done: false }; // Should pass
});

// Array element string field refs should receive MutableText
const todoTitleRef = ref(handle, "todos", 0, "title");
todoTitleRef.change((title) => {
  // title should be MutableText
  title.toUpperCase();
  const _t: typeof title = {} as MutableText; // Should pass
});

// value() return types
const titleValue = titleRef.value();
// titleValue should be string | undefined
const _tv: typeof titleValue = "" as string | undefined;

const countValue = countRef.value();
// countValue should be number | undefined
const _cv: typeof countValue = 0 as number | undefined;

const userValue = userRef.value();
// userValue should be { name: string; email: string } | undefined
const _uv: typeof userValue = { name: "", email: "" } as
  | { name: string; email: string }
  | undefined;

// Root document ref
const rootRef = ref(handle);
rootRef.change((doc) => {
  // doc should be TestDoc
  doc.title = "New Title";
  doc.count = 42;
  const _d: typeof doc = {} as TestDoc; // Should pass
});
