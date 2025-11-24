import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "../ref";
import { ref } from "../factory";

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

type StringyDoc = {
  text: string;
};

declare const stringyHandle: DocHandle<StringyDoc>;

const textRef = ref(stringyHandle, "text", [10, 20]);
textRef.value();
textRef.change((text) => text.toUpperCase());

const textRefDirect = new Ref(stringyHandle, ["text"]);

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
  return t.toUpperCase();
});

countRef.change((n) => {
  return n + 1;
});

todoDoneRef.change((done) => {
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
whereRef.value();

whereRef.change((todo) => {
  todo.done = true;
});

// this should error, but doesnt:
whereRef.change((todo) => {
  return { ...todo, done: true };
});

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

// =============================================================================
// Direct constructor usage requires manual type
// =============================================================================

// With 'as const', types are inferred automatically!
const titleRefDirect = new Ref(handle, ["todos", 0, "title"]);
// titleRefDirect is Ref<string> - same as ref(handle, 'todos', 0, 'title')

// You can also explicitly provide the type
const titleRefManual = new Ref(handle, ["todos", 0, "title"]);

titleRefManual.value();
