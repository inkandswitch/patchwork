# Actions Tool

A context sidebar tool that displays available actions for selected documents.

## Overview

The Actions tool reads from the context selection and displays all applicable actions for each selected document. It provides a dynamic UI where users can configure action parameters and execute them.

## Features

- **Context-aware**: Automatically displays actions for all selected documents
- **Document information**: Shows document title and type for each selected document
- **Filtered actions**: Only displays actions that are applicable to each document's type
- **Dynamic forms**: Automatically generates forms based on action schemas (Zod)
- **Collapsible UI**: Actions can be expanded/collapsed to show/hide parameters
- **Error handling**: Displays validation and execution errors clearly

## Usage

### Adding the Actions Sidebar

Use the command palette to add the actions sidebar to your context sidebar:

1. Open the command palette (usually with a keyboard shortcut)
2. Search for "Add Actions Sidebar"
3. Execute the command

Alternatively, you can programmatically add it:

```javascript
window.$command.addActionRunner();
```

### Using Actions

1. Select one or more documents in your workspace
2. The actions sidebar will display sections for each selected document
3. Each section shows:
   - Document title
   - Document type
   - Available actions
4. Click on an action to expand it and configure parameters
5. Click "Execute" to run the action

## Architecture

### Main Components

- **Tool**: Root component that reads selected documents from context
- **DocActionsView**: Displays actions for a single document
- **ActionButton**: Renders a single action with its form and execute button

### Plugin Definition

The tool is registered as a Patchwork tool plugin with:
- ID: `action-runner`
- Name: "Actions"
- Icon: "Zap"
- Supported Data Types: `[]` (context sidebar tool)

### Dependencies

- `@patchwork/context-selection`: For accessing selected documents
- `@patchwork/context-react`: For React integration with context
- `@patchwork/filesystem`: For document metadata
- `@patchwork/plugins`: For plugin system integration
- `zod`: For action parameter validation

## Command

The package includes a command to add the actions sidebar:

- **ID**: `add-action-runner`
- **Label**: "Add Actions Sidebar"
- **Category**: "Tools"
