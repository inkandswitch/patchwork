# Satisfaction

A general-purpose action system for Patchwork that provides reusable actions for any document type.

## Overview

Satisfaction provides a framework for defining and executing actions on documents. It includes both a UI for executing actions and a collection of general-purpose actions that work with any document type.

## General-Purpose Actions

### Create Document

**Action ID:** `create-document`

Creates a new document of a specified datatype.

**Arguments:**
- `dataType` (string): The type of document to create (e.g., 'counter', 'essay', 'map')
- `title` (string, optional): Optional title for the new document

**Example:**
```json
{
  "dataType": "counter",
  "title": "My Counter"
}
```

**Behavior:**
- Creates a new document with the specified datatype
- Initializes the document using the datatype's `init` function
- Sets the document title if provided
- Adds a reference to the new document in the current document's `createdDocuments` array

---

### Update

**Action ID:** `update`

Updates any value in a document at the specified path.

**Arguments:**
- `path` (string): The path to update (use dot notation for nested properties like 'user.name', or bracket notation for arrays like 'items[0].status')
- `value` (any): The new value (can be any JSON-compatible type: string, number, boolean, object, array, or null)

**Examples:**
```json
{
  "path": "title",
  "value": "My New Title"
}
```

```json
{
  "path": "user.age",
  "value": 25
}
```

```json
{
  "path": "items[0].status",
  "value": "completed"
}
```

```json
{
  "path": "config",
  "value": {"theme": "dark", "fontSize": 14}
}
```

**Behavior:**
- Creates nested objects or arrays if they don't exist
- Overwrites existing values
- Supports both property access (dot notation) and array indexing (bracket notation)

---

### Delete

**Action ID:** `delete`

Removes a property or array element from a document.

**Arguments:**
- `path` (string): The path to delete (use dot notation for properties like 'user.email', or bracket notation for array elements like 'items[2]')

**Examples:**
```json
{
  "path": "user.email"
}
```

```json
{
  "path": "items[2]"
}
```

**Behavior:**
- For properties: deletes the property from the parent object
- For array elements: removes the element at the specified index (using splice)
- Throws an error if the path doesn't exist

---

### Insert

**Action ID:** `insert`

Inserts a value into an array or creates a new property.

**Arguments:**
- `path` (string): The path where to insert (for arrays, use the array path like 'items'; for objects, use the full property path like 'user.email')
- `value` (any): The value to insert (can be any JSON-compatible type)
- `position` (enum, optional): For arrays - where to insert: `"start"`, `"end"`, `"before"`, or `"after"` (default: "end")
- `index` (number, optional): For 'before'/'after' positions - the reference index

**Examples:**
```json
{
  "path": "tags",
  "value": "important",
  "position": "end"
}
```

```json
{
  "path": "items",
  "value": {"id": 5, "status": "new"},
  "position": "start"
}
```

```json
{
  "path": "items",
  "value": {"id": 3, "status": "pending"},
  "position": "after",
  "index": 2
}
```

**Behavior:**
- For arrays: inserts at the specified position
- For non-existent properties: creates the property with the value
- For existing non-array properties: overwrites the value (if no position specified)
- Creates arrays automatically when position parameter is used

---

## Action Tool

The Satisfaction tool provides a UI for executing actions:

1. Lists all applicable actions for a document
2. Shows expandable forms for actions that require arguments
3. Validates arguments using Zod schemas
4. Displays error messages if validation fails
5. Shows the document preview below the actions

### Using Actions in Code

Actions can also be invoked programmatically:

```typescript
import { getLoadedPlugin } from "@patchwork/sdk";

const plugin = await getLoadedPlugin("patchwork:action", "create-document");
plugin.module.default(handle, repo, {
  dataType: "counter",
  title: "My Counter"
});
```

## AI Integration

Satisfaction includes AI prompt integration that allows AI assistants to understand and invoke actions. The AI can:

1. See available actions for a document
2. Understand the arguments each action requires
3. Execute actions by returning JSON in `<edit>` tags

Example AI response:
```
I'll create a new counter document for you.

<edit>
[
  {
    "actionId": "create-document",
    "args": {
      "dataType": "counter",
      "title": "Task Counter"
    }
  }
]
</edit>
```

## Creating Custom Actions

To create a custom action, export a plugin with `type: "patchwork:action"`:

```typescript
export const myAction: Plugin<any> = {
  type: "patchwork:action",
  id: "my-action",
  name: "My Action",
  icon: "Zap",
  supportedDataTypes: ["*"], // or specific types like ["counter", "essay"]
  module: {
    // Optional: define arguments schema
    argsSchema: (doc) => {
      return z.object({
        myArg: z.string().describe("Description of the argument"),
      });
    },
    
    // Optional: conditionally show/hide action
    isApplicable: (doc) => {
      return doc.someProperty === true;
    },
    
    // Required: the action implementation
    default: (handle, repo, args) => {
      handle.change((doc) => {
        // Modify the document here
      });
    },
  },
};
```

## Examples

See EXAMPLES.md for detailed usage examples.

See the `counter` package for simple examples of datatype-specific actions:
- `counter-increment`: Increments a counter with a configurable step
- `counter-decrement`: Decrements a counter with a configurable step
- `counter-clear`: Resets the counter to 0
- `counter-halve`: Halves the counter value (only shown when count > 10)

