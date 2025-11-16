# Changelog - Satisfaction General-Purpose Actions

## New Features - General-Purpose Actions

### Overview
Added a suite of general-purpose actions that work with any document type (`supportedDataTypes: ["*"]`). These actions provide common document manipulation capabilities that can be used across all datatypes in the Patchwork system.

### New Actions

#### 1. Create Document (`create-document`)
- **Icon:** FilePlus
- **Purpose:** Creates a new document of any available datatype
- **Arguments:**
  - `dataType` (string): The type of document to create
  - `title` (string, optional): Optional title for the new document
- **Features:**
  - Automatically initializes the document using the datatype's init function
  - Sets document metadata (`@patchwork` field)
  - Adds a reference to the created document in the parent's `createdDocuments` array
  - Tracks creation timestamp

#### 2. Set Property (`set-property`)
- **Icon:** Edit
- **Purpose:** Sets a property value in a document with support for nested paths
- **Arguments:**
  - `path` (string): Dot-notation path to the property (e.g., "user.name")
  - `value` (string): The value to set
  - `valueType` (enum): Type of value - "string", "number", "boolean", or "json"
- **Features:**
  - Creates nested objects automatically if they don't exist
  - Supports multiple value types with proper parsing
  - Validates values based on type

#### 3. Delete Property (`delete-property`)
- **Icon:** Trash
- **Purpose:** Removes a property from a document
- **Arguments:**
  - `path` (string): Dot-notation path to the property to delete
- **Features:**
  - Validates that the property exists before deletion
  - Supports nested property deletion
  - Provides clear error messages

#### 4. Add to Array (`add-to-array`)
- **Icon:** Plus
- **Purpose:** Adds an item to an array property
- **Arguments:**
  - `path` (string): Dot-notation path to the array property
  - `value` (string): The value to add
  - `valueType` (enum): Type of value - "string", "number", "boolean", or "json"
  - `position` (enum): Where to add - "start" or "end" (default: "end")
- **Features:**
  - Creates an empty array if the property doesn't exist
  - Supports adding items at the start or end of the array
  - Validates that the target property is an array
  - Supports multiple value types

#### 5. Remove from Array (`remove-from-array`)
- **Icon:** Minus
- **Purpose:** Removes an item from an array by index
- **Arguments:**
  - `path` (string): Dot-notation path to the array property
  - `index` (number): Zero-based index of the item to remove
- **Features:**
  - Validates array existence and bounds
  - Provides clear error messages for out-of-bounds access
  - Removes items by index using splice

### File Structure

```
satisfaction/
├── src/
│   ├── createDocument.ts    # Create document action
│   ├── setProperty.ts        # Set property action
│   ├── deleteProperty.ts     # Delete property action
│   ├── arrayActions.ts       # Add/remove array actions
│   ├── index.ts             # Updated to export all actions
│   ├── tool.tsx             # UI for executing actions
│   └── aiPrompt.ts          # AI integration (existing)
├── README.md                 # Comprehensive documentation
├── EXAMPLES.md              # Detailed usage examples
└── CHANGELOG.md             # This file
```

### Integration Points

All actions are:
- Registered in `src/index.ts` as plugins
- Compatible with the Satisfaction UI tool
- Available to the AI prompt system
- Type-safe using Zod schemas
- Work with any document type (supportedDataTypes: ["*"])

### Usage Examples

#### Via UI
Open any document with the Satisfaction tool to see all applicable actions with expandable forms for entering arguments.

#### Via AI
```
User: "Create a new counter called 'Tasks' and set its count to 5"

AI: 
<edit>
[
  {
    "actionId": "create-document",
    "args": {
      "dataType": "counter",
      "title": "Tasks"
    }
  },
  {
    "actionId": "set-property",
    "args": {
      "path": "count",
      "value": "5",
      "valueType": "number"
    }
  }
]
</edit>
```

#### Programmatically
```typescript
import { getLoadedPlugin } from "@patchwork/sdk";

const plugin = await getLoadedPlugin("patchwork:action", "set-property");
plugin.module.default(handle, repo, {
  path: "title",
  value: "My New Title",
  valueType: "string"
});
```

### Testing

- ✅ All actions build successfully with no TypeScript errors
- ✅ No linting errors
- ✅ Compatible with existing counter examples
- ✅ Zod schemas validate arguments correctly
- ✅ Error handling provides clear messages

### Benefits

1. **Reusability:** These actions work with any document type
2. **Consistency:** Provides a uniform way to manipulate documents
3. **Type Safety:** Uses Zod schemas for validation
4. **AI Integration:** Works seamlessly with AI editing
5. **User Friendly:** Clear UI with expandable forms
6. **Extensible:** Easy to add new general-purpose actions

### Future Enhancements

Potential additions:
- Bulk operations (set multiple properties at once)
- Query/filter operations
- Copy/move operations between documents
- Batch array operations (add/remove multiple items)
- Property transformation actions (e.g., increment, append)
- Search and replace in strings
- Date/time manipulation actions

### Breaking Changes

None - this is a new feature addition that doesn't modify existing functionality.

### Documentation

- **README.md**: Complete API reference for all actions
- **EXAMPLES.md**: Practical examples showing action usage
- Both files include:
  - Argument descriptions
  - JSON examples
  - Error handling examples
  - Best practices
  - AI integration examples

