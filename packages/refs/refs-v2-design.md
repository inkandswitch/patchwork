# Patchwork Refs v2

## Goals

- **Single unified class** - No inheritance (`PathRef`, `IdRef`, etc.)
- **Decoupled from annotations** - Annotations live in `Context`
- **DocHandle-shaped API** - Familiar interface
- **Serializable as URIs** - Pass refs as strings over network
- **String equality** - `a.url === b.url` for comparison
- **Composable** - Reference anything at any depth
- **Stable by default** - Uses Automerge ObjectIds when possible

## Core API

```typescript
class Ref<TDoc, TPath> {
  readonly docHandle: DocHandle<TDoc>;
  readonly path: PathSegment[];
  readonly options: RefOptions;

  value(): T | undefined;
  doc(): Doc<TDoc>;
  change(fn: (val: T, ctx: RefContext) => void | T): void;
  on(event: "change", callback: (payload) => void): () => void;

  get url(): string;
  equals(other: Ref): boolean;
  valueOf(): string;
  toString(): string;
}

// Factory function with type inference
function ref<TDoc, TPath>(
  docHandle: DocHandle<TDoc>,
  ...segments: PathInput[]
): Ref<TDoc, TPath>;
```

## Creating Refs

```typescript
// Factory function with automatic type inference
const titleRef = ref(handle, "todos", 0, "title");
titleRef.value(); // string | undefined

// Constructor (requires explicit path array)
const titleRef2 = new Ref(handle, ["todos", 0, "title"]);
```

### Path Segments

- `string` - Property access: `'todos'`, `'title'`
- `number` - Array index, **stable by default** (resolves to ObjectId): `0`, `2`
- `{ key: value }` - Where clause (exact match), **stable by default**: `{ title: "Buy milk" }`
- `[n, m]` - Text/array range, **stable by default** (converts to cursors): `[10, 20]`
- `at(x)` - Makes any segment **dynamic/unstable**: `at(0)`, `at({ title: "x" })`, `at([10, 20])`

### The `at()` Function

```typescript
function at(
  segment: string | number | Record<string, any> | [number, number]
): PathSegment;
```

Marks a segment as dynamic/unstable, preventing stabilization to ObjectIds or cursors.

### Examples

```typescript
// Property access
ref(handle, "title"); // → Ref<string>
ref(handle, "user", "name"); // → Ref<string>

// Array access (stable by default)
ref(handle, "todos", 0); // Tracks by ObjectId
ref(handle, "todos", 0, "title"); // → Ref<string>

// Dynamic array access (positional)
ref(handle, "todos", at(0)); // Always index 0
ref(handle, "todos", at(0), "title");

// Where clauses (stable by default)
ref(handle, "todos", { id: "abc" }); // Tracks by ObjectId
ref(handle, "todos", { done: false }, "title");

// Dynamic where clauses (re-query)
ref(handle, "todos", at({ done: false }));

// Text ranges (stable by default)
ref(handle, "note", [0, 10]); // Tracks with cursors
ref(handle, "note", at([0, 10])); // Positional indices

// Deep paths
ref(handle, "users", 0, "profile", "settings", "theme");
```

## Using Refs

### Reading Values

```typescript
const value = ref.value(); // T | undefined
const doc = ref.doc(); // Full document
const url = ref.url; // Serialized URI
```

### Changing Values

```typescript
ref.change((val: T, ctx: RefContext) => void | T)
```

**Behavior:**

- **Objects/arrays:** Mutate in place (return `void`)
- **Primitives:** Return new value
- **Text:** Use `ctx.splice()` or `ctx.updateText()` helpers

**Examples:**

```typescript
// Objects: mutate in place
todoRef.change((todo) => {
  todo.done = true;
});

// Primitives: return new value
counterRef.change((n) => n + 1);
stringRef.change((str) => str.toUpperCase());

// Text: use context helpers
textRef.change((text, ctx) => {
  ctx.splice(0, 5, "Hello");
});

textRef.change((text, ctx) => {
  ctx.updateText("New full text");
});
```

### Listening to Changes

```typescript
const unsubscribe = ref.on("change", (payload) => {
  console.log(payload.doc); // Updated document
  console.log(payload.patches); // Automerge patches
});

// Cleanup
unsubscribe();
```

**Behavior:** Only fires when patches affect the ref's path or descendants.

### Equality & Serialization

```typescript
// Compare refs
ref1.equals(ref2); // boolean
ref1.url === ref2.url; // String comparison

// Serialize
const url = ref.url; // "automerge:docId/path#heads"

// Deserialize
const ref = await findRef(repo, url);
const ref2 = Ref.fromUrl(handle, path, heads);
```

## URL Format

```
automerge:<docId>/<path>#<heads>
```

**Examples:**

```
automerge:abc123/title
automerge:abc123/todos/$2@abc123def/title           # Stable (ObjectId)
automerge:abc123/todos/0/title                      # Dynamic (positional)
automerge:abc123/note/[$5@abc,$10@def]              # Stable range (cursors)
automerge:abc123/note/[10,20]                       # Dynamic range
automerge:abc123/todos/$2@abc#hash1,hash2           # Time-travel
```

**Path Segment Encoding:**

- `property` - Property name
- `$objectId` - Stable ObjectId (format: `$number@hash`)
- `0`, `1`, `2` - Dynamic numeric indices
- `[$cursor1,$cursor2]` - Stable cursors (format: `[$n@hash,$m@hash]`)
- `[10,20]` - Dynamic numeric range
- `{"key":"value"}` - Dynamic where clause (JSON-encoded)

**Fragment:** `#heads` - Comma-separated heads for time-travel

## Behavior

### Resolution

- **Path traversal:** Returns `undefined` if any segment fails to resolve
- **ObjectId lookup:** Searches arrays for objects with matching ObjectId
- **Where clauses:** Finds first item matching all key-value pairs
- **Ranges:**
  - Stable: Uses cursors (survives text edits)
  - Dynamic: Uses numeric indices

### Construction

- **Never throws:** Creating a ref always succeeds, even for invalid paths
- **Lazy resolution:** Paths are resolved on `.value()` access, not construction
- **Automatic stabilization:** Numeric indices and where clauses automatically resolve to ObjectIds during construction

## Stability Guarantees

| Segment Type         | Stability   | Survives             |
| -------------------- | ----------- | -------------------- |
| `0` (numeric)        | **Stable**  | Reordering, moves    |
| `at(0)`              | **Dynamic** | Nothing (positional) |
| `{ title: "x" }`     | **Stable**  | Reordering, moves    |
| `at({ title: "x" })` | **Dynamic** | Nothing (re-queries) |
| `[10, 20]` (range)   | **Stable**  | Text edits           |
| `at([10, 20])`       | **Dynamic** | Nothing (positional) |

## Type Inference

TypeScript automatically infers types from document schema and path:

```typescript
type Doc = {
  title: string;
  todos: Array<{ title: string; done: boolean }>;
};

const handle: DocHandle<Doc> = ...;

const titleRef = ref(handle, 'title');
// titleRef: Ref<Doc, ['title']>
// titleRef.value() → string | undefined

const todoRef = ref(handle, 'todos', 0, 'done');
// todoRef: Ref<Doc, ['todos', 0, 'done']>
// todoRef.value() → boolean | undefined

todoRef.change((done) => !done);
// done is inferred as boolean
```
