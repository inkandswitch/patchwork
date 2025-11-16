# Examples of Using General-Purpose Actions

This file demonstrates how the general-purpose actions in Satisfaction can be used with various document types.

## Basic Property Updates

### Example 1: Setting a String Property

```json
{
  "actionId": "update",
  "args": {
    "path": "title",
    "value": "My Task Counter"
  }
}
```

### Example 2: Setting a Number Property

```json
{
  "actionId": "update",
  "args": {
    "path": "count",
    "value": 100
  }
}
```

### Example 3: Setting a Boolean Property

```json
{
  "actionId": "update",
  "args": {
    "path": "completed",
    "value": true
  }
}
```

## Working with Nested Objects

### Example 4: Setting Nested Properties

```json
{
  "actionId": "update",
  "args": {
    "path": "metadata.author.name",
    "value": "Jane Doe"
  }
}
```

This will create the nested structure if it doesn't exist:
```json
{
  "metadata": {
    "author": {
      "name": "Jane Doe"
    }
  }
}
```

### Example 5: Setting Complex Objects

```json
{
  "actionId": "update",
  "args": {
    "path": "config",
    "value": {
      "theme": "dark",
      "fontSize": 16,
      "autoSave": true
    }
  }
}
```

## Working with Arrays

### Example 6: Adding Items to Array (at end)

```json
{
  "actionId": "insert",
  "args": {
    "path": "tags",
    "value": "important",
    "position": "end"
  }
}
```

### Example 7: Adding Items to Array (at start)

```json
{
  "actionId": "insert",
  "args": {
    "path": "tags",
    "value": "urgent",
    "position": "start"
  }
}
```

### Example 8: Inserting After Specific Index

```json
{
  "actionId": "insert",
  "args": {
    "path": "items",
    "value": {"id": 5, "status": "pending"},
    "position": "after",
    "index": 2
  }
}
```

### Example 9: Updating Array Element

```json
{
  "actionId": "update",
  "args": {
    "path": "items[0].status",
    "value": "completed"
  }
}
```

### Example 10: Removing Array Element

```json
{
  "actionId": "delete",
  "args": {
    "path": "items[2]"
  }
}
```

## Creating Documents

### Example 11: Creating a New Counter

```json
{
  "actionId": "create-document",
  "args": {
    "dataType": "counter",
    "title": "Sprint Velocity Counter"
  }
}
```

This will:
1. Create a new counter document
2. Initialize it with `count: 0`
3. Set the title to "Sprint Velocity Counter"
4. Add a reference to the new document in `createdDocuments` array

## Deleting Properties

### Example 12: Deleting a Simple Property

```json
{
  "actionId": "delete",
  "args": {
    "path": "temporaryData"
  }
}
```

### Example 13: Deleting a Nested Property

```json
{
  "actionId": "delete",
  "args": {
    "path": "metadata.draft"
  }
}
```

## Combining Multiple Actions

### Example 14: Creating and Configuring a Document

```json
[
  {
    "actionId": "create-document",
    "args": {
      "dataType": "counter",
      "title": "Sprint Tasks"
    }
  },
  {
    "actionId": "insert",
    "args": {
      "path": "tags",
      "value": "sprint-1",
      "position": "end"
    }
  },
  {
    "actionId": "insert",
    "args": {
      "path": "tags",
      "value": "Q1-2024",
      "position": "end"
    }
  },
  {
    "actionId": "update",
    "args": {
      "path": "metadata.created",
      "value": "2024-01-15T10:30:00Z"
    }
  }
]
```

### Example 15: Restructuring Data

```json
[
  {
    "actionId": "update",
    "args": {
      "path": "users[0].role",
      "value": "admin"
    }
  },
  {
    "actionId": "delete",
    "args": {
      "path": "users[0].tempPassword"
    }
  },
  {
    "actionId": "insert",
    "args": {
      "path": "users[0].permissions",
      "value": "write",
      "position": "end"
    }
  }
]
```

## AI Usage Examples

When using with the AI integration, you can use natural language:

**User:** "Create a new counter called 'Feature Requests' and add tags 'product' and 'feedback'"

**AI Response:**
```
I'll create a new counter document with the requested name and tags.

<edit>
[
  {
    "actionId": "create-document",
    "args": {
      "dataType": "counter",
      "title": "Feature Requests"
    }
  },
  {
    "actionId": "insert",
    "args": {
      "path": "tags",
      "value": "product"
    }
  },
  {
    "actionId": "insert",
    "args": {
      "path": "tags",
      "value": "feedback"
    }
  }
]
</edit>
```

**User:** "Change the counter title to 'Bug Reports' and set the count to 15"

**AI Response:**
```
I'll update the title and set the count value.

<edit>
[
  {
    "actionId": "update",
    "args": {
      "path": "title",
      "value": "Bug Reports"
    }
  },
  {
    "actionId": "update",
    "args": {
      "path": "count",
      "value": 15
    }
  }
]
</edit>
```

**User:** "Remove the second item from the tags array"

**AI Response:**
```
I'll remove the item at index 1 from the tags array.

<edit>
[
  {
    "actionId": "delete",
    "args": {
      "path": "tags[1]"
    }
  }
]
</edit>
```

## Error Handling

### Invalid Path

```json
{
  "actionId": "update",
  "args": {
    "path": "",
    "value": "test"
  }
}
```
**Error:** "Invalid path: ''"

### Array Index Out of Bounds

```json
{
  "actionId": "update",
  "args": {
    "path": "items[99].status",
    "value": "done"
  }
}
```
**Error:** "Array index 99 out of bounds (length: 3)"

### Delete Non-Existent Property

```json
{
  "actionId": "delete",
  "args": {
    "path": "nonExistent.field"
  }
}
```
**Error:** "Property path 'nonExistent.field' not found"

### Invalid Position for Insert

```json
{
  "actionId": "insert",
  "args": {
    "path": "count",
    "value": "test",
    "position": "end"
  }
}
```
**Error:** "Property 'count' exists but is not an array. Cannot use position parameter."

## Best Practices

1. **Use the right action**:
   - `update` for changing existing values or creating new properties
   - `insert` for adding items to arrays
   - `delete` for removing properties or array elements
   - `create-document` for creating new documents

2. **Path syntax**:
   - Use dot notation for object properties: `"user.name"`
   - Use bracket notation for arrays: `"items[0]"` or `"items[0].status"`
   - Both can be combined: `"data.users[2].email"`

3. **Value types**:
   - Pass values in their native JSON types (no need to specify "valueType")
   - Strings: `"value": "hello"`
   - Numbers: `"value": 42`
   - Booleans: `"value": true`
   - Objects: `"value": {"key": "value"}`
   - Arrays: `"value": [1, 2, 3]`
   - Null: `"value": null`

4. **Array operations**:
   - Use `insert` with position to add items to arrays
   - Use `update` with bracket notation to modify specific elements
   - Use `delete` with bracket notation to remove elements

5. **Action chaining**:
   - When multiple actions are needed, order matters
   - Create parent structures before accessing child properties
   - Be mindful of array indices changing after insertions/deletions

6. **Document references**:
   - `create-document` automatically tracks created documents in `createdDocuments` array
   - These references can be opened in the UI
