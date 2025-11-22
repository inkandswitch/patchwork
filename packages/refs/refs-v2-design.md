# Patchwork Refs v2 - Design Spec

## Goals

- **Single unified class** - No inheritance (`PathRef`, `IdRef`, etc.)
- **Decoupled from annotations** - Annotations live in `Context`
- **DocHandle-shaped API** - Familiar interface
- **Serializable as URIs** - Pass refs as strings over network
- **String equality** - `a.url === b.url` for comparison
- **Composable** - Reference anything at any depth
- **Stable by default** - Uses Automerge ObjectIds when possible

## Core Types

```typescript
type PathSegment =
  | string // Property name
  | number // Array index (or ObjectId lookup)
  | { $id: string } // Explicit ObjectId
  | Record<string, any> // Where clause (exact match in array)
  | [number, number] // Unstable range
  | [Cursor, Cursor]; // Stable range

class Ref<T> {
  docHandle: DocHandle;
  path: PathSegment[];
  options: { heads?: Automerge.Heads };
}
```

## Creation API

### Factory Function

```typescript
ref(docHandle: DocHandle, ...segments: PathBuilder[]): Ref
```

**Path Segments:**

- `string` - Property access: `'todos'`, `'title'`
- `number` - Array index, **stable by default** (resolves to ObjectId): `0`, `2`
- `{ key: value }` - Where clause (exact match in array), **stable by default**: `{ title: "Buy milk" }`
- `[n, m]` - Text/array range, **stable by default** (converts to cursors): `[10, 20]`
- `object` - Direct object reference (extracts ObjectId): `todo`
- `at(x)` - Makes any segment **dynamic/unstable**: `at(0)`, `at({ title: "x" })`, `at([10, 20])`

### The `at()` Function

```typescript
function at<T>(segment: T): DynamicSegment<T>;
```

Marks a segment as dynamic/unstable. Returns a wrapper object that signals to the ref builder that this segment should not be stabilized.

**Implementation:**

```typescript
type DynamicSegment<T> = { __dynamic: true; value: T };

function at<T>(segment: T): DynamicSegment<T> {
  return { __dynamic: true, value: segment };
}

// Type guard
function isDynamic(segment: any): segment is DynamicSegment<any> {
  return segment && segment.__dynamic === true;
}
```

### Examples

```typescript
// Stable (numeric index → ObjectId)
ref(docHandle, "todos", 0, "title");

// Dynamic/unstable (explicit at())
ref(docHandle, "todos", at(0), "title");

// Stable (where clause → ObjectId)
ref(docHandle, "todos", { title: "Buy milk" }, "done");

// Dynamic/unstable (where clause without ObjectId)
ref(docHandle, "todos", at({ title: "Buy milk" }), "done");

// Stable (object reference → ObjectId)
const todo = doc.todos[2];
ref(docHandle, "todos", todo, "done");

// Stable range (converts to cursors)
ref(docHandle, "notes", 0, "content", [10, 20]);

// Dynamic/unstable range (numeric indices)
ref(docHandle, "notes", 0, "content", at([10, 20]));

// Deep composition (mixed stable/unstable)
ref(
  docHandle,
  "boards",
  { id: "b1" }, // Stable: where clause → ObjectId
  "columns",
  2, // Stable: index → ObjectId
  "cards",
  at(0), // Dynamic: explicit at()
  "title"
);
```

### Text Ranges

```typescript
// Stable range (converts to cursors by default)
ref(docHandle, "notes", 0, "content", [10, 20]);

// Dynamic/unstable range (numeric indices via at())
ref(docHandle, "notes", 0, "content", at([10, 20]));
```

## Ref API

### Reading

```typescript
ref.value(): T | undefined        // Current value (undefined if path invalid)
ref.doc(): Doc                    // Full document (synchronous)
ref.url: string                   // Canonical URI
```

### Mutation

```typescript
ref.change(fn: (val: T) => void | T)
```

**Behavior:**

- **Objects/arrays:** Mutate in place (return `void`)
- **Primitives/immutable strings:** Return new value
- **Automerge Text (full string):** Use `splice()` or `updateText()` helper functions
- **Ranges (text selection):** Receive string value, return new string (converted to splice operations)

### Text Mutation Helpers

```typescript
function splice(
  text: string,
  index: number,
  deleteCount: number,
  insert?: string
): void;
function updateText(text: string, newValue: string): void;
```

These are wrapper functions around `Automerge.splice()` and `Automerge.updateText()` that work within the `ref.change()` callback context.

**Usage:**

```typescript
// Using splice
contentRef.change((text) => {
  splice(text, 0, 5, "Hello");
});

// Using updateText
contentRef.change((text) => {
  updateText(text, "Entirely new text");
});
```

**Implementation Note:** These functions capture the ref's path and document from the change callback context.

```typescript
// Object mutation
todoRef.change((todo) => {
  todo.done = true;
});

// Primitive replacement
counterRef.change((n) => n + 1);
stringRef.change((str) => str.toUpperCase());

// Text mutation with splice helper
contentRef.change((text) => {
  splice(text, 0, 5, "Hello");
});

// Text mutation with updateText helper
contentRef.change((text) => {
  updateText(text, "New full text");
});

// Range mutation (receives string, returns new string)
selectionRef.change((rangeText) => {
  return "REPLACED"; // Internally converted to splice operations
});
```

### Events

```typescript
ref.on("change", ({ doc, patches, patchInfo }) => { ... })
```

Fires when the document changes **and** the ref's target is affected by the change.

**Parameters:**

- `doc` - The new document state
- `patches` - Automerge patches for this change
- `patchInfo` - Additional patch metadata

**Behavior:** The event only fires when at least one patch affects the path this ref points to (or its descendants). This is determined by comparing patch paths to the ref's resolved path.

### Equality

```typescript
ref.equals(other: Ref): boolean
ref.url === other.url // String comparison
ref == other // Value object equality (valueOf() returns url string)
```

## URI Format

```
automerge:<docId>/<path>?<modifiers>#<heads>
```

### Examples

```
automerge:abc123/todos/$id456/title                    # Stable (ObjectId)
automerge:abc123/todos/0/title                         # Dynamic (positional index)
automerge:abc123/notes/$id789/content/[$c1,$c2]        # Stable range (cursors)
automerge:abc123/notes/0/content/[10,20]               # Dynamic range (numeric)
automerge:abc123/todos/$id456#hash1,hash2              # Time-travel (stable + heads)
```

**Path segments:**

- `/property` - Property access
- `/$objectId` - Stable ObjectId (the actual Automerge ObjectId with `$` prefix)
- `/0` - Dynamic numeric index (positional)
- `/[$cursor1,$cursor2]` - Stable range (Automerge cursors with `$` prefix)
- `/[10,20]` - Dynamic range (numeric indices)

**Fragment:**

- `#<heads>` - Version pinning (time-travel)

## Resolution Behavior

- **Path traversal:** Returns `undefined` if any segment fails
- **ObjectId lookup:** The ObjectId is encoded directly in the URI with `$` prefix (e.g., `/$objectId456`), searches array for object with that ID
- **Range resolution:**
  - Stable: Uses Automerge cursors (with `$` prefix) to resolve positions (survives edits)
  - Dynamic: Uses numeric indices directly
- **Where clause:** Searches array for first item matching all key-value pairs exactly
  - Stable (default): Resolves to ObjectId and stores `{ $id: "..." }` in path
  - Dynamic (via `at()`): Re-queries on each access

## Stability Guarantees

| Segment Type         | Stability   | Survives              |
| -------------------- | ----------- | --------------------- |
| `0` (numeric)        | **Stable**  | Reordering, moves     |
| `at(0)`              | **Dynamic** | Nothing (positional)  |
| `{ title: "x" }`     | **Stable**  | Reordering, moves     |
| `at({ title: "x" })` | **Dynamic** | Nothing (re-queries)  |
| Object ref           | **Stable**  | Reordering, moves     |
| `[10, 20]` (range)   | **Stable**  | Insertions, deletions |
| `at([10, 20])`       | **Dynamic** | Nothing (positional)  |

## Open Questions

1. **TypeScript inference:** How deep can we infer `Ref<T>` types from doc schema?
2. **Where clause limitations:** Should we support anything beyond exact field matches?
3. **at() type signature:** How to type `at()` to accept numbers, objects, or tuples while maintaining type safety?
4. **Patch filtering:** How to efficiently determine if a patch affects a ref's target (especially for ranges and where clauses)?

## Class Internals

### Public API

```typescript
class Ref<T> {
  // Public properties
  docHandle: DocHandle;
  path: PathSegment[];
  options: { heads?: Automerge.Heads };
  url: string; // Getter that computes canonical URI

  // Public methods
  value(): T | undefined;
  doc(): Doc;
  change(fn: (val: T) => void | T): void;
  on(event: "change", callback: ChangeCallback): void;
  equals(other: Ref): boolean;
  valueOf(): string; // Returns url
  toString(): string; // Returns url
}
```

### Private Methods

```typescript
class Ref<T> {
  // Resolution
  #resolve(doc: Doc): T | undefined;
  #resolvePath(doc: Doc, path: PathSegment[]): any;
  #resolveSegment(container: any, segment: PathSegment): any;

  // Segment resolution helpers
  #resolveObjectId(container: any[], objectId: string): any;
  #resolveWhereClause(container: any[], clause: Record<string, any>): any;
  #resolveRange(
    text: string,
    range: [Cursor, Cursor] | [number, number]
  ): string;

  // Path building (for ref() factory)
  #buildPath(doc: Doc, segments: PathBuilder[]): PathSegment[];
  #stabilizeSegment(
    doc: Doc,
    currentPath: PathSegment[],
    segment: any
  ): PathSegment;

  // Mutation helpers
  #applyChange(fn: (val: T) => void | T): void;
  #setAtPath(doc: Doc, path: PathSegment[], value: any): void;

  // Event handling
  #patchAffectsRef(patches: Patch[]): boolean;
  #pathMatchesPatch(refPath: PathSegment[], patchPath: Prop[]): boolean;

  // Serialization
  #serializeSegment(segment: PathSegment): string;
  #deserializeSegment(str: string): PathSegment;
}
```

### Private Properties

```typescript
class Ref<T> {
  #changeCallback?: ChangeCallback;
  #unsubscribe?: () => void; // Cleanup function for docHandle listener
}
```

### Key Internal Flows

**Path Resolution:**

1. `#resolve()` → calls `#resolvePath()` with `this.path`
2. `#resolvePath()` → iterates segments, calling `#resolveSegment()` for each
3. `#resolveSegment()` → dispatches to specific resolver based on segment type
   - ObjectId: `#resolveObjectId()`
   - Where clause: `#resolveWhereClause()`
   - Range: `#resolveRange()`
   - Number/string: direct property access

**Path Building (in `ref()` factory):**

1. Iterate through input segments
2. For each segment, call `#stabilizeSegment()`
3. `#stabilizeSegment()` checks if segment is wrapped in `at()` (dynamic marker)
   - If dynamic: store as-is (number, where clause, or range)
   - If stable: resolve and extract ObjectId/cursors
4. Return built path array

**Change Application:**

1. `change()` → calls `docHandle.change()`
2. Inside docHandle.change callback:
   - Resolve current value via `#resolve()`
   - Call user's callback with value
   - If callback returns non-undefined: `#setAtPath()` to replace value
   - If callback returns void: assume in-place mutation occurred

**Patch Filtering:**

1. `on("change")` → subscribes to `docHandle.on("change")`
2. On each doc change, call `#patchAffectsRef()`
3. `#patchAffectsRef()` → checks if any patch path overlaps with ref path
4. If affected, fire user's callback
