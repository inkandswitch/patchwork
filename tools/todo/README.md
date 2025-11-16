# Todo List Tool

A todo list tool for tiny-patchwork with built-in actions for task management.

## Overview

The todo tool provides a simple, clean interface for managing todo lists with support for:
- Adding new todo items
- Marking items as complete/incomplete
- Editing todo descriptions
- Deleting items
- Bulk operations (mark all complete/incomplete, clear completed)

## Document Structure

```typescript
type Todo = {
  id: string;
  description: string;
  done: boolean;
};

type TodoDoc = {
  title: string;
  todos: Todo[];
};
```

## Built-in Actions

The todo tool includes 7 actions that work with todo list documents:

### Add Todo

**Action ID:** `todo-add`

Adds a new todo item to the list.

**Arguments:**
- `description` (string): Description of the todo item
- `done` (boolean, optional): Whether the todo is already completed (default: false)

**Example:**
```json
{
  "description": "Buy groceries",
  "done": false
}
```

---

### Toggle Todo

**Action ID:** `todo-toggle`

Toggles the completion status of a todo item.

**Arguments:**
- `todoId` (enum): ID of the todo item to toggle (dropdown of available todos)

**Behavior:**
- Only shown when there are todos in the list
- Changes `done: true` to `done: false` and vice versa

---

### Delete Todo

**Action ID:** `todo-delete`

Deletes a todo item from the list.

**Arguments:**
- `todoId` (enum): ID of the todo item to delete (dropdown of available todos)

**Behavior:**
- Only shown when there are todos in the list
- Permanently removes the todo item

---

### Update Todo Description

**Action ID:** `todo-update-description`

Updates the description text of a todo item.

**Arguments:**
- `todoId` (enum): ID of the todo item to update (dropdown of available todos)
- `description` (string): New description for the todo item

**Behavior:**
- Only shown when there are todos in the list

---

### Clear Completed Todos

**Action ID:** `todo-clear-completed`

Removes all completed todo items from the list.

**Arguments:** None

**Behavior:**
- Only shown when there is at least one completed todo
- Removes all todos where `done: true`

---

### Mark All Complete

**Action ID:** `todo-mark-all-complete`

Marks all todo items as complete.

**Arguments:** None

**Behavior:**
- Only shown when there is at least one incomplete todo
- Sets `done: true` for all todos

---

### Mark All Incomplete

**Action ID:** `todo-mark-all-incomplete`

Marks all todo items as incomplete.

**Arguments:** None

**Behavior:**
- Only shown when there is at least one completed todo
- Sets `done: false` for all todos

---

## Usage with Actions Tool

When you open a todo document with the Actions tool, all of these actions will be available in the action palette. Actions with arguments (like Add Todo, Toggle Todo, etc.) will show expandable forms where you can enter the required information.

Actions that are not applicable to the current state (e.g., "Clear Completed Todos" when there are no completed todos) will be hidden.

## AI Integration

These actions are automatically available to AI assistants when editing todo documents. The AI can:

1. See all available actions and their arguments
2. Execute actions by returning JSON in `<edit>` tags
3. Chain multiple actions together

Example AI interaction:
```
I'll add a new todo and mark an existing one as complete.

<edit>
[
  {
    "actionId": "todo-add",
    "args": {
      "description": "Review pull requests"
    }
  },
  {
    "actionId": "todo-toggle",
    "args": {
      "todoId": "abc-123-def"
    }
  }
]
</edit>
```

## Development

Build the todo tool:
```bash
pnpm build
```

Watch for changes:
```bash
pnpm dev
```

