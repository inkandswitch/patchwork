# Patchwork

Patchwork is a malleable, local-first collaboration environment in the browser. It lets you edit many types of automerge documents using various UI tools.

## Key Concepts

- **Datatype**: A "file format" or "schema" for automerge documents. eg: markdown, drawing. In addition to a schema, a datatype also defines some useful functionality that's not tied to a particular UI: e.g., how to initialize a new document of that type.
- **Tool**: a UI for viewing and editing documents. eg: markdown editor, tldraw canvas, raw json editor.

Datatypes and tools are exported from JavaScript modules. At runtime, Patchwork can load arbitrary JS modules stored in an Automerge document (or at any URL). There are also some "built-in" modules which are built into the OS bundle directly. Over time we plan to move all modules to loading dynamically out of Automerge; the built-ins are there for historical legacy / convenience as we bootstrap.

## Development

Patchwork isn't a monolithic vite app. Depending on whether you're editing a package or editing the OS/SDK, your dev workflow will look slightly different.

First, here's a quick orientation — this monorepo (managed with pnpm workspaces) includes both the core OS APIs as well as various datatypes and tools.

`./packages/*` contains various domain-specific modules which can define datatypes and tools, eg. the essay editor or a spreadsheet. `packages/counter` is a good sample one to look at for the minimal structure.

`./sdk`: contains Patchwork library functionality used by packages, eg:

- defining concepts like tools and datatypes
- account management
- version control utilities
- helpers for working with Automerge data
- reusable UI components

(Proper SDK documentation is a todo.)

`./os`: a React application that renders the Patchwork OS. This currently includes the "OS chrome" UI, but over time that will be moved into packages.

### Prereq

A prerequisite is to install the jacquard cli which is used to push to automerge.

First install [bun](https://bun.sh/). Then run:

`cd jacquard-cli`
`pnpm i`
`npm link`

### Editing a module

First, check if the package is bundled into the OS by looking at the list in `os/src/bundledPackages.ts`.

#### Dynamic packages

If the package is "dynamic", i.e. _not_ a built-in:

You can install the tool in the production deploy of Patchwork, in the My Tools menu. You do not need to run the Patchwork OS locally to develop on a dynamic package.

When doing updates: Run `pnpm watch` in the package directory; this will build the package after each code change and push changes to Automerge, and any tools will live-reload. Alternatively, you can manually run `pnpm push` after each code change.

#### Bundled packages

If the package is bundled:

One thing you can do is to push the package into Automerge temporarily:

`cd packages/<yourpackage`
`jacquard push`

and then register the resulting folder as a custom tool.

Another thing you can do for a built-in tool is to run the OS locally:

```
pnpm preview
```

And then after each code change, run `pnpm push` in the package directory, and reload the browser.

### Adding a new module

If you want to add a package, here are the steps:

- run `pnpm make-tool`, which will give you interactive prompts to specify a name and description for your new package. (If you want a non-interactive version, eg if you are an AI agent, you can run it non-interactively as well, like this: `pnpm make-tool --name "Todo List" --id "todos" --description "A simple todo list tool"`)
- `pnpm install`
- Push the package to an automerge document:

`cd packages/<yourpackage>`
`pnpm push`

This output should say something like: `pushing to folder: automerge:<docid>`

Now, to install your module in Patchwork: in the UI you can go to "My Tools" and register a new module at the given automerge url. Or, on the CLI you can run `jacquard install --moduleUrl <your-automerge-url>`.

Now in Patchwork when you click "create new" you should see a new option letting you create a doc of your new datatype.
Click that and you should see your new tool running!

See below for a more detailed guide.

## Editing the OS

If you want to edit the OS web app:

Run the built app locally with `pnpm preview`.
Each time you edit the OS, run `pnpm build` inside the `os` folder and then reload.

If you edit the SDK, you probably want to run `pnpm build` on the entire monorepo.

### AI

LLM features in Patchwork include bot edits and change history summarization.
Currently these are backed by the OpenAI API. To enable them in local dev you'll need to set up an API key locally.

Create a file at `sdk/.env.local`:

```
VITE_OPENAI_API_KEY=<OpenAI key>
```

You can get the lab OpenAI key from Geoffrey.

## Creating a new tool in Patchwork

This is a guide to creating a custom tool in Patchwork.


We'll walk through an example tool: a simple counter with persistence.

First, here's the package.json. Give your package a name (in the @patchwork/ namespace) and a description. This is just a regular JavaScript package. If you need more dependencies, you can add them here. The "push" command bundles the package and pushes it to Automerge, from which you can install it into Patchwork.

counter/package.json:

```
{
  "name": "@patchwork/counter",
  "version": "0.0.1",
  "description": "A simple counter",
  "type": "module",
  "main": "src/index.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "vite build",
    "push": "pnpm build && jacquard push",
    "watch": "nodemon --watch src -e js,tsx,ts,tsx,css,json --exec 'pnpm build && pnpm push'"
  },
  "keywords": [],
  "author": "Ink & Switch",
  "dependencies": {
    "@automerge/automerge-repo-react-hooks": "2.0.0-alpha.22",
    "@patchwork/sdk": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@vitejs/plugin-react": "^4.3.1",
    "nodemon": "^3.1.9",
    "vite": "^5.3.4",
    "vite-plugin-css-injected-by-js": "^3.5.2",
    "vite-plugin-top-level-await": "^1.4.2",
    "vite-plugin-wasm": "^3.3.0"
  }
}

```

(Note: if you need to import functionality from other patchwork packages, you will need to add lines to the package.json to establish those dependencies: `"@patchwork/<other-package>": "workspace:*",`. Make sure to only import from the public exports of other packages, not their internal src directories.)

Next we define a data type, which is a schema for the Automerge document that we can enforce in TypeScript, plus some helper functions that operate on the data. The most important part here is the TypeScript schema.

counter/src/datatype.ts:

```
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";

// SCHEMA

export type Doc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  count: number;
};
// FUNCTIONS

export const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Counter";
};

export const init = (doc: Doc) => {
  initFrom(doc, {
    title: "Untitled Counter",
    count: 0,
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};

```

Then we define a tool. A tool is just a React component that will render in the Patchwork environment. It has access to a variety of props. It can also use various SDK functions.

For now, the only prop we use is docUrl. We can use standard hooks from automerge-repo to read the value of the document and edit it as well.

counter/src/tool.tsx

```
import { useDocument, useDocHandle } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { Button } from "@patchwork/sdk/ui";
import { Doc } from "./datatype";
import React from "react";

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);

  if (!doc) {
    return null;
  }

  const increment = () => {
    changeDoc((d) => {
      d.count += 1;
    });
  };

  const decrement = () => {
    changeDoc((d) => {
      d.count -= 1;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-4xl font-bold mb-4">{doc.title}</h2>
      <div className="text-4xl mb-4">{doc.count}</div>
      <div className="flex space-x-4">
        <Button variant="destructive" onClick={decrement}>
          -
        </Button>
        <Button variant="default" onClick={increment}>
          +
        </Button>
      </div>
    </div>
  );
};

```

We're almost done. Our CSS file is just a small stub to support tailwind:

counter/src/index.ts

```
/* This is a bit of a hack since we don't have proper style scoping yet.
   We rely on the fact that the OS defines the tailwind base (with appropriate config);
   we only generate components and utilities here which may be specific to this package. */
/* @tailwind base; */
@tailwind components;
@tailwind utilities;

```

And finally we pull it all together with an index file. We simply import the tool and data type, wrap them in some metadata, and then re-export them. Note the lazy import, which lets us load this metadata without loading the code itself.

counter/src/index.ts

```
import {
  makeTool,
  type LoadableDataType,
  type ToolDescription,
} from "@patchwork/sdk";
import type { Doc } from "./datatype";

import "./index.css";

export const dataType: LoadableDataType<Doc> = {
  type: "patchwork:dataType",
  id: "counter",
  name: "Counter",
  icon: "CirclePlus",
  async load() {
    const { dataType } = await import("./datatype");
    return dataType;
  },
};

export const tools: ToolDescription[] = [
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    supportedDataTypes: ["counter"],
    async load() {
      const { Tool } = await import("./tool");
      return makeTool({ EditorComponent: Tool });
    },
  },
];

```

You just need a few more files which you can copy over from the sample counter app:

- vite.config.ts
- postcss.config.cjs
- tailwind.config.js

And that's it, you have a package!

### Deploying your package

Run these commands to push your package to automerge:

```
cd packages/your-package
pnpm install
pnpm build
pnpm push
```

This will give you an automerge URL for a Patchwork folder.

You can install the tool into your Patchwork account by copying this automerge URL into the My Tools UI, or you can also install via CLI:

`jacquard install --moduleUrl <your-automerge-url>`

### SDK functions

#### UI

You should use shadcn for standard UI elements whenever possible instead of rolling your own components.

Many of the components from @shadcn/ui are available in the UI SDK. You can import them like this:

```
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  ...
} from "@patchwork/sdk/ui";
```

Here is the list of available shadcn components:

```
sdk/src/ui/alert.tsx
sdk/src/ui/avatar.tsx
sdk/src/ui/button.tsx
sdk/src/ui/card.tsx
sdk/src/ui/checkbox.tsx
sdk/src/ui/command.tsx
sdk/src/ui/context-menu.tsx
sdk/src/ui/dialog.tsx
sdk/src/ui/dropdown-menu.tsx
sdk/src/ui/icons.tsx
sdk/src/ui/index.ts
sdk/src/ui/input.tsx
sdk/src/ui/label.tsx
sdk/src/ui/popover.tsx
sdk/src/ui/progress.tsx
sdk/src/ui/select.tsx
sdk/src/ui/slider.tsx
sdk/src/ui/switch.tsx
sdk/src/ui/tabs.tsx
sdk/src/ui/textarea.tsx
sdk/src/ui/toast.tsx
sdk/src/ui/toaster.tsx
sdk/src/ui/tooltip.tsx
sdk/src/ui/use-toast.ts
sdk/src/ui/utils.ts
```

#### Accounts

You can call `useCurrentAccountDoc` in a tool component:

```
const [accountDoc] = useCurrentAccountDoc();
```

which gives you a doc that represents the user's account, linking to 4 related docs:

```
export interface AccountDoc {
  // a publicly available contact doc
  contactUrl: AutomergeUrl;

  // the folder containing the user's documents
  rootFolderUrl: AutomergeUrl;

  // UI state for this user
  uiStateUrl: AutomergeUrl;

  // custom modules the user has installed
  moduleSettingsUrl: AutomergeUrl;
}
```

You can traverse the links like this:

```
const [accountDoc] = useCurrentAccountDoc();
  const [uiStateDoc, changeUIStateDoc] = useDocument<UIStateDoc>(
    accountDoc?.uiStateUrl
  );
```

The contact doc has a name and avatar if the user is registered:

```
export interface AnonymousContactDoc {
  type: "anonymous";
}

export interface RegisteredContactDoc {
  type: "registered";
  name: string;
  avatarUrl?: AutomergeUrl;
}

export type ContactDoc = AnonymousContactDoc | RegisteredContactDoc;
```

The root folder url links to a folder doc that looks like this, containing the user's documents:

```
export type DocLink = {
  name: string;
  type: string;
  url: AutomergeUrl;
};

export type FolderDoc = {
  title: string;
  docs: DocLink[];
} & HasVersionControlMetadata<unknown, unknown>;

```

The UI state doc has global UI state as well as per-doc UI state:

```
export type UIStateDoc = {
  /**
   * Paths to documents that are toggled open in the sidebar.
   * (Each toggled-open path is a docpath from DocPathUtils.toString)
   */
  docPathsToggledOpenInSidebar: string[];

  /** Documents in the folder hierarchy that have a branch checked out.
   *  Map from branch scope path string (made with DocPathUtils.toString) to branch URL.
   */
  openBranches: { [docPathString: string]: AutomergeUrl };

  /** Document-specific UI states */
  docUIStates: { [docPathString: string]: DocUIState };
};

export type DocUIState = {
  mainViewMode: MainViewMode;
  sidebarMode?: SidebarMode;
  highlightChanges: boolean;
  collapseContentWithoutChanges: boolean;
  toolUIStates: Record<string, unknown>;
};

export type MainViewMode =
  | "showFile"
  | "showInputs"
  | "showOutputs"
  | "compareWithMain";

export type SidebarMode = "review" | "history" | "bot";
```

And finally, the module settings doc is just a list of Automerge URLs for modules the user has installed:

```
export type ModuleSettingsDoc = {
  modules: AutomergeUrl[];
};
```
### Development tips

- Use tailwind for styling.
- If the user doesn't specify any styles, make the tool UI look like a clean design by Todd Matthews of Ink & Switch: simple and monochrome, but with a bit of flair.
- Your tool should display well if rendered in a small 600x300 window - make it take full width/height with overflows if needed. Don't add unnecessary borders or frames around the tool.
- For reading and writing an Automerge doc, use the useDocument hook as shown in examples.
- In a changeDoc block, you are interacting with a proxy representing the Automerge doc. Follow these tips for correctly editing an Automerge doc:
  - When deleting items from a list, use .splice on the array, rather than assigning the result of .filter
  - Try to mutate arrays and objects instead of reasigning them
  - You are not allowed to set fields to undefined set them to null instead
  - Any data that came from an Automerge doc must be passed through structuredClone before getting written back into the doc.
  - .indexOf cannot be called directly on an array in the proxy; you must do [...list].indexOf(item)

## Dynamic System Registration

Patchwork features a flexible architecture that allows for dynamic registration and consumption of system elements. This architecture supports out-of-order module loading, async loading, and custom system types.

### Key Features

- **Unified System Element Interface**: A single `SystemElement` interface for all items within systems
- **On-Demand Loading**: Elements can be loaded only when needed
- **Implicit System Registries**: System type registries are automatically created when first accessed
- **Event-Based Waiting**: Components can wait for elements to be registered using event notifications
- **Custom System Types**: New types of systems can be defined without explicit registration

### System Types

The core system types include:

- **Data Types**: Define document structure and behavior
- **Tools**: UI components for interacting with documents
- **Export Methods**: Ways to export documents to files
- **Import Methods**: Ways to import files into documents

### System Registry API

You can interact with the system registries in two ways:

#### Direct Registry Access

Access a system registry directly for full control:

```typescript
import { getSystemRegistry, SystemElement } from 'patchwork/systems';

// Get a registry for a specific system type (created automatically if needed)
const dataTypeRegistry = getSystemRegistry<DataType>('dataTypes');

// Check if an element exists
if (dataTypeRegistry.hasElement('my-data-type')) {
  // Get an element without loading it
  const element = dataTypeRegistry.getById('my-data-type');
  
  // Load an element asynchronously (with optional waiting)
  const loadedElement = await dataTypeRegistry.loadById(
    'my-data-type',
    true,  // Wait for element to be registered if needed
    5000   // Timeout in milliseconds
  );
}
```

#### Helper Functions

Use the helper functions for simpler access:

```typescript
import { 
  getElementFromSystem, 
  loadElementFromSystem, 
  hasSystemElement 
} from 'patchwork/systems';

// Get an element synchronously (only if already loaded)
const element = getElementFromSystem<DataType>('dataTypes', 'my-data-type');

// Load an element asynchronously (with optional waiting)
const loadedElement = await loadElementFromSystem<DataType>(
  'dataTypes', 
  'my-data-type',
  true,  // Wait for the element to be registered if needed
  5000   // Timeout in milliseconds
);

// Check if an element exists
if (hasSystemElement('dataTypes', 'my-data-type')) {
  // Element exists
}
```

### Creating System Elements

There are two ways to create system elements:

#### Immediate Elements

Elements that are available immediately:

```typescript
import { createElement, SystemElement } from 'patchwork/systems';

// Create a simple validator element
const myValidator: SystemElement & { validate: (doc: any) => boolean } = {
  id: 'my-validator',
  type: 'patchwork:validator',
  name: 'My Validator',
  validate(doc) {
    // Implementation here
    return true;
  }
};
```

#### Lazy-Loaded Elements

Elements that load their implementation on demand:

```typescript
import { SystemElement } from 'patchwork/systems';

// Create a data type with lazy loading
const myDataType: SystemElement & { load: () => Promise<any> } = {
  id: 'my-data-type',
  type: 'patchwork:dataType',
  name: 'My Data Type',
  icon: 'FileText',
  async load() {
    // Return the implementation
    return {
      init(doc) {
        // Initialize the document
      },
      async getTitle(doc) {
        return doc.title || 'Untitled';
      },
      // Other methods...
    };
  }
};
```

### Using Custom System Types

You can define and use custom system types without explicitly registering them:

```typescript
import { registerSystems, getSystemRegistry, SystemElement } from 'patchwork/systems';

// Define a custom system element interface
interface Validator extends SystemElement {
  validate: (doc: any) => { valid: boolean; errors: string[] };
}

// Create a validator element
const myValidator: Validator = {
  id: 'my-validator',
  type: 'patchwork:validator',
  name: 'My Validator',
  validate(doc) {
    // Implementation here
    return { valid: true, errors: [] };
  }
};

// Register your element
await registerSystems({ validators: [myValidator] }, 'my-plugin');

// Later, in another module, you can use this element:
const validatorRegistry = getSystemRegistry<Validator>('validators');
const validator = validatorRegistry.getById('my-validator');

// Or wait for an element to be registered by another module
const validator = await validatorRegistry.loadById(
  'another-validator', 
  true,  // Wait for it to be registered
  5000   // Timeout in milliseconds
);
```

This approach allows for more flexible plugin architecture where system elements can be both consumed and contributed to without requiring strict initialization order or explicit type registration.

> **Note**: For backward compatibility, the original function names (`getFromSystem`, `loadFromSystem`, etc.) are still available as aliases.