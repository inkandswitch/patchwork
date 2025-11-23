import type { DocHandle } from "@automerge/automerge-repo";
import { ref, Ref } from "./ref";

// =============================================================================
// Test Document Types
// =============================================================================

type TodoDoc = {
  title: string;
  count: number;
  todos: Array<{
    id: string;
    title: string;
    done: boolean;
    tags: string[];
  }>;
  metadata: {
    created: Date;
    modified: Date;
  };
};

declare const handle: DocHandle<TodoDoc>;

// =============================================================================
// Basic Path Inference
// =============================================================================

// String property
const titleRef = ref(handle, "title");

// Number property
const countRef = ref(handle, "count");

// Object property
const metadataRef = ref(handle, "metadata");

// =============================================================================
// Array Access
// =============================================================================

// Array element by index
const todoRef = ref(handle, "todos", 0);

// Nested property in array element
const todoTitleRef = ref(handle, "todos", 0, "title");

const todoDoneRef = ref(handle, "todos", 0, "done");

// Nested array
const todoTagsRef = ref(handle, "todos", 0, "tags");

// =============================================================================
// Nested Object Access
// =============================================================================

const createdRef = ref(handle, "metadata", "created");

const modifiedRef = ref(handle, "metadata", "modified");

// =============================================================================
// Deep Paths
// =============================================================================

type DeepDoc = {
  level1: {
    level2: {
      level3: {
        value: number;
      };
    };
  };
};

declare const deepHandle: DocHandle<DeepDoc>;

const deepRef = ref(deepHandle, "level1", "level2", "level3", "value");

// =============================================================================
// Complex Types
// =============================================================================

type ComplexDoc = {
  users: Array<{
    id: string;
    profile: {
      name: string;
      settings: {
        theme: "light" | "dark";
        notifications: {
          email: boolean;
          push: boolean;
        };
      };
    };
  }>;
};

declare const complexHandle: DocHandle<ComplexDoc>;

const themeRef = ref(complexHandle, "users", 0, "profile", "settings", "theme");
themeRef.value();
themeRef.change((theme) => "dark");

const emailRef = ref(
  complexHandle,
  "users",
  0,
  "profile",
  "settings",
  "notifications",
  "email"
);

// =============================================================================
// Value and Change Methods
// =============================================================================

// value() returns T | undefined
const title: string | undefined = titleRef.value();

// change() accepts correct type
titleRef.change((t) => {
  const _check: string = t;
  return t.toUpperCase();
});

countRef.change((n) => {
  const _check: number = n;
  return n + 1;
});

todoDoneRef.change((done) => {
  const _check: boolean = done;
  return !done;
});

// =============================================================================
// Invalid Paths Should Be Unknown
// =============================================================================

// Nonexistent property returns unknown (not a type error, just unknown)
const badRef = ref(handle, "nonexistent" as any);

// =============================================================================
// Where Clauses Infer Array Element Type
// =============================================================================

// Where clauses filter arrays, so they return the array element type
const whereRef = ref(handle, "todos", { id: "abc" });

// Where clause with nested access
const whereTitleRef = ref(handle, "todos", { done: true }, "title");

// =============================================================================
// Untyped Handle Falls Back to Any
// =============================================================================

declare const untypedHandle: DocHandle<any>;

const anyRef = ref(untypedHandle, "foo", "bar");

// =============================================================================
// Empty Path Returns Doc Type
// =============================================================================

const rootRef = ref(handle);
