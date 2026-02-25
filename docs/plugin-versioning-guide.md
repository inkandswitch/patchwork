# Plugin Versioning: Developer's Guide

This guide covers the multi-version plugin system added in the `tool-urls` branch. It explains the architecture, how to use the CLI, and the day-to-day workflow for developing and deploying versioned tools.

## Overview

Tools in Patchwork are loaded at runtime from Automerge documents. Previously, a "module settings document" contained a flat array of Automerge URLs, and each tool was always loaded at its latest version. Now, the module settings document supports **named tags** (like "default" and "dev") that pin to specific Automerge document versions (heads). This means:

- Multiple versions of the same tool can be loaded simultaneously
- Users can switch between tags in the UI
- Documents can be pinned to a specific tool version or follow a tag

## Key Concepts

### Module Settings Document

This is an Automerge document that tells the app which tool packages to load and at which versions. Its shape:

```typescript
type ModuleSettingsDoc = {
  modules: Record<AutomergeUrl, ModuleEntry>;
  "@patchwork": { type: "patchwork:module-settings" };
};

type ModuleEntry = {
  tags: Record<string, TagPointer>;
};

type TagPointer = {
  heads: string[];  // Automerge document heads
};
```

Example conceptual structure:
```
modules: {
  "automerge:QAVNAGc1iV..." (codemirror-base): {
    tags: {
      "default": { heads: ["abc123..."] },
      "dev":     { heads: ["def456..."] }
    }
  },
  "automerge:27TSNbMdh1..." (tool-picker): {
    tags: {
      "default": { heads: ["789xyz..."] }
    }
  }
}
```

### Versioned URLs

Automerge URLs can include heads: `automerge:docid#head1,head2`. When the `ModuleWatcher` loads a tag, it constructs a versioned URL by combining the package's document ID with the tag's heads. The service worker then serves files from that specific version of the document.

### Tags vs Pinned Versions

- **Named tags** (e.g. "default", "dev", "pvh-dev") are mutable pointers. You update them to point to new heads when you want to release a new version.
- **Pinned versions** are immutable -- a document created against a specific heads-bearing URL will always use that exact version.

When a new document is created via a tag, the document's `@patchwork` metadata records a `toolSource`:
```typescript
type ToolSource = {
  packageUrl: AutomergeUrl;  // plain URL of the tool package
  tag?: string;              // if present, follow this tag
};
```

If `tag` is present, tool resolution will look up that tag in the registry. If absent (or the URL already has heads baked in), the document is pinned.

## Architecture

### Data Flow

```
ModuleSettingsDoc (Automerge)
  │
  ▼
ModuleWatcher (core/filesystem/src/module-watcher.ts)
  │  - reads modules + tags
  │  - constructs versioned URLs (docId + heads)
  │  - dynamically imports each via service worker
  │  - passes ModuleLoadedMeta { tag, sourceDocUrl, version }
  │
  ▼
registerPlugins (core/plugins/src/registry/index.ts)
  │  - stamps tag/sourceDocUrl/version onto each PluginDescription
  │  - registers in PluginRegistry under the tag key
  │
  ▼
PluginRegistry (core/plugins/src/registry/registry.ts)
  │  - two-level map: pluginId → tagName → PluginDescription
  │  - get(id) returns "default" tag
  │  - getTag(id, tag) returns specific tag
  │  - getVersions(id) returns all tags
  │
  ▼
Tool Resolution (core/elements/src/tool-resolution.ts)
  │  - checks document's toolSource metadata
  │  - resolves to the correct tag version
  │
  ▼
patchwork-view renders the tool
```

### Key Files

| File | Role |
|------|------|
| `core/filesystem/src/module-watcher.ts` | Watches module settings docs, loads tools from versioned URLs |
| `core/filesystem/src/metadata.ts` | `ToolSource` type, `getToolSource()` helper |
| `core/plugins/src/registry/registry.ts` | Multi-version `PluginRegistry` |
| `core/plugins/src/registry/index.ts` | `registerPlugins()` with tag metadata |
| `core/plugins/src/registry/types.ts` | `PluginDescription` with `tag`, `sourceDocUrl`, `version` fields |
| `core/plugins/src/datatypes.ts` | `createDocOfDatatype2()` writes `toolSource` metadata |
| `core/elements/src/tool-resolution.ts` | Resolves tool by checking document's `toolSource.tag` |
| `core/elements/src/patchwork-tool-picker.ts` | Built-in tool picker element with tag dropdown |
| `tools/toolbar/tool-picker/` | React titlebar tool picker (dispatches `ToolSelectedEvent`) |
| `tools/tiny-patchwork/patchwork-frame/` | Listens for `ToolSelectedEvent`, sets `tool-url` on main view |
| `packages/modules-cli/` | CLI for managing module settings documents |
| `sites/tiny-patchwork/src/main.ts` | Entry point, wires up `ModuleWatcher` |

## The Modules CLI

Located at `packages/modules-cli/`. Build it first:

```bash
cd packages/modules-cli
pnpm install
pnpm build
```

Then run via:
```bash
node dist/cli.js <command>
```

Or link it globally:
```bash
pnpm link --global
patchwork-modules <command>
```

The CLI stores its Automerge repo data in `~/.patchwork-modules/`.

### Commands

#### `create` -- Create a new module settings document
```bash
patchwork-modules create
# → Created module settings document: automerge:xxxxx
```

#### `list <modules-doc-url>` -- List all tools and tags
```bash
patchwork-modules list automerge:2AprWUew8LpPGrVTGsX29ANsXEU7
```

#### `add <modules-doc-url> <package-url>` -- Add a tool
Adds a tool package with a "default" tag pointing at its current heads.
```bash
patchwork-modules add automerge:2Apr... automerge:QAVN...
```

#### `remove <modules-doc-url> <package-url>` -- Remove a tool
```bash
patchwork-modules remove automerge:2Apr... automerge:QAVN...
```

#### `tag <modules-doc-url> <package-url> <tag-name>` -- Create/update a tag
```bash
# Create a "dev" tag at the package's current heads
patchwork-modules tag automerge:2Apr... automerge:QAVN... dev

# Or specify explicit heads
patchwork-modules tag automerge:2Apr... automerge:QAVN... dev --heads abc123,def456
```

#### `release <modules-doc-url> <package-url>` -- Update the default tag
```bash
# Move default to the package's current heads
patchwork-modules release automerge:2Apr... automerge:QAVN...

# Or promote another tag to default
patchwork-modules release automerge:2Apr... automerge:QAVN... --from dev
```

#### `status <modules-doc-url>` -- Check if tags are up to date
```bash
patchwork-modules status automerge:2Apr...
```
Shows each tool's latest heads vs what each tag points to.

## Day-to-Day Workflow

### Making changes to a tool

1. **Edit the tool source** (e.g. `tools/codemirror/codemirror-base/src/tool.tsx`)

2. **Build it:**
   ```bash
   cd tools/codemirror/codemirror-base
   pnpm build
   ```

3. **Push to its Automerge document** (using pushwork):
   ```bash
   pushwork push .
   ```

4. **Update the tag pointer in the modules document.** This is the crucial step -- pushing new content to the tool's Automerge document does NOT automatically update any tag pointers. You must explicitly tell the modules document about the new heads.

   ```bash
   # Update the "dev" tag to the tool's current heads:
   patchwork-modules tag automerge:2AprWUew8LpPGrVTGsX29ANsXEU7 \
     automerge:QAVNAGc1iVQB1rR3eEEnB7VbjfF dev

   # Or update "default" when you want to release:
   patchwork-modules release automerge:2AprWUew8LpPGrVTGsX29ANsXEU7 \
     automerge:QAVNAGc1iVQB1rR3eEEnB7VbjfF
   ```

5. **Refresh the browser.** The app loads versioned URLs on startup; live-reloading of tag pointer changes is not yet reliable (see Known Issues).

### Testing a dev tag

1. Make your changes and push them (steps 1-3 above)
2. Create/update a tag:
   ```bash
   patchwork-modules tag <modules-doc> <tool-url> dev
   ```
3. Refresh the app
4. In the tool picker (titlebar), select the tool, then pick "dev" from the tag dropdown
5. You should see your changes

### Promoting dev to default

When you're satisfied with the dev tag:
```bash
patchwork-modules release <modules-doc> <tool-url> --from dev
```

This copies the dev tag's heads to the default tag.

## Current Test Environment

The current test modules document is:
```
automerge:2AprWUew8LpPGrVTGsX29ANsXEU7
```

This is configured in `sites/tiny-patchwork/src/main.ts` as `defaultToolsUrl`.

### Test markers currently in place

These are intentional visual markers for verifying version switching works:

- **codemirror-base "dev" tag**: has a `hotpink` background on the editor
- **codemirror-base "default" tag**: has `"Text Editor ★"` as its name (star in name only)
- **doc-title "default"**: shows a purple `★` before the document title

To verify versioning works: open a text document, look at the tool picker in the titlebar, switch between "default" and "dev" for the Text Editor -- you should see the background go hot pink on "dev".

## How Tool Resolution Works

When a `<patchwork-view>` needs to render a document:

1. It looks at the document's `@patchwork.type` to find compatible tools
2. It checks for a `tool-url` attribute (takes highest priority -- this is a direct import URL)
3. It checks for a `tool-id` attribute (looks up in registry)
4. If neither, it falls back to the first compatible tool

**Tag-aware resolution:** If the document has `@patchwork.toolSource.tag` set (e.g. `"dev"`), the resolver calls `registry.getTag(toolId, "dev")` instead of `registry.get(toolId)`. This means documents "remember" which tag they were created under.

### ToolSelectedEvent

When the tool picker (titlebar) wants to switch the main view to a different tag, it dispatches a `ToolSelectedEvent` with `{ toolUrl, toolId }`. The `PatchworkFrame` component listens for this, and directly sets `tool-url` on the main `<patchwork-view>` element (and removes `tool-id` so it doesn't conflict).

## Known Issues and Caveats

### Tag updates don't take effect without refresh
The `ModuleWatcher` listens for changes to the module settings document, but switching tag pointers at runtime doesn't reliably reload tools in the browser. For now, **refresh the page** after updating tag heads.

### Live sync can override versioning temporarily
If you push new content to a tool's Automerge document, the browser may sync that content in real-time. Until you refresh, the "default" tag might briefly show the latest content even though its heads pointer hasn't changed. After refresh, versioned URLs are respected correctly.

### The CLI waits ~3 seconds for sync
After any mutation, the CLI waits 3 seconds for the change to propagate to the relay server. This is usually enough, but on slow connections you might need to run the command again or increase the wait.

### Legacy format backward compatibility
The `ModuleWatcher` auto-detects whether a module settings document uses the old flat-array format (`modules: AutomergeUrl[]`) or the new tagged format (`modules: Record<AutomergeUrl, ModuleEntry>`). Old documents continue to work without migration.

### Heads are fetched from the relay server
When the CLI runs `add` or `tag` without `--heads`, it fetches the tool package from the sync server to read its current heads. If the tool was just pushed, there may be a brief delay before the latest heads are available on the server. For speed, the helper scripts in `packages/modules-cli/*.mjs` read heads directly from local `.pushwork/automerge` storage -- but the CLI itself goes through the network.

## Troubleshooting

### "Document is unavailable"
The modules document URL might not have synced to the relay. Check:
- Is the URL correct in `sites/tiny-patchwork/src/main.ts`?
- Does `patchwork-modules list <url>` work from the CLI?
- Try running `patchwork-modules status <url>` to verify connectivity

### Tool picker doesn't show tag dropdown
Tags only appear if a tool has more than one tag registered. Check:
```bash
patchwork-modules list <modules-doc-url>
```
If the tool only has "default", create another tag.

### Selecting a tag has no effect
Check the browser console for:
- `[ToolPicker] dispatching tool-selected:` -- confirms the picker is firing
- `[PatchworkFrame] tool-selected event received:` -- confirms the frame hears it
- `[PatchworkFrame] setting tool-url to:` -- confirms it's applying the URL

If the first log appears but not the second, the event isn't bubbling to the frame. If the third appears but nothing changes visually, the `tool-url` might not be resolving correctly.

### Console logging
There is extensive `console.log` output prefixed with `[ModuleWatcher]`, `[ToolPicker]`, `[PatchworkFrame]`, and `[main]`. Filter by these prefixes in DevTools to trace the loading and selection flow.

## Migrating a Tool from the Old Format

If you have an existing tool in another repo (e.g. `patchwork-extra`) and want it to work with the new module loading system, you need to update its plugin exports. The key change is: **replace `load()` functions with `importPath` references**.

### The old format (patchwork-extra style)

Old tools use `@patchwork/sdk` types and lazy `load()` functions that do dynamic imports:

```typescript
// OLD: src/index.ts
import { type LoadablePlugin } from "@patchwork/sdk";

export const plugins: LoadablePlugin<any>[] = [
  {
    type: "patchwork:dataType",    // note: camelCase "dataType"
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    async load() {
      const { dataType } = await import("./datatype");
      return dataType;
    },
  },
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    supportedDataTypes: ["counter"],  // note: camelCase "DataTypes"
    async load() {
      const { Tool } = await import("./tool");
      return { EditorComponent: Tool };
    },
  },
];
```

### The new format (patchwork-next style)

New tools export plain description objects with `importPath` instead of `load()`. The actual implementation lives in a separate "mount" file that exports a default function.

**Step 1: Create a `main.ts` (or `main.tsx`) with plugin descriptions**

```typescript
// NEW: src/main.ts
export const plugins = [
  {
    type: "patchwork:datatype",       // lowercase "datatype"
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    importPath: "./dist/mount-datatype.js",
  },
  {
    type: "patchwork:tool",
    id: "counter",
    name: "Counter",
    icon: "CirclePlus",
    supportedDatatypes: ["counter"],  // lowercase "Datatypes"
    importPath: "./dist/mount.js",
  },
];
```

Key differences:
- **No `load()` function.** Instead, `importPath` is a relative path (from the package root) to the built implementation module.
- **No SDK import needed.** The descriptions are plain objects.
- **`type: "patchwork:datatype"`** not `"patchwork:dataType"` (lowercase t).
- **`supportedDatatypes`** not `supportedDataTypes` (lowercase t).
- **This file is the package entry point.** It gets loaded first; the `importPath` modules are loaded on demand.

**Step 2: Create a mount file for each tool**

The mount file default-exports a function that receives `(handle, element)` and renders the tool into the element. Return a cleanup function.

For **React** tools, use the `toolify` helper:

```typescript
// NEW: src/mount.ts
import { toolify } from "@inkandswitch/patchwork-react";
import { MyTool } from "./tool";
export default toolify(MyTool);
```

`toolify` wraps a React component that accepts `{ docUrl, element }` props (an `EditorProps`-style interface) into a mount function. It handles React rendering and cleanup.

For **Solid** tools:

```typescript
// NEW: src/mount.tsx
/** @jsxImportSource solid-js */
import { render } from "solid-js/web";
import { MyTool } from "./tool";
import type { ToolImplementation } from "@inkandswitch/patchwork-plugins";

const mount: ToolImplementation<MyDoc> = (handle, element) => {
  return render(() => <MyTool handle={handle} repo={element.repo} />, element);
};

export default mount;
```

For **datatype** mounts, export an object with `init` (and optionally import/export methods):

```typescript
// NEW: src/mount-datatype.ts
export default {
  init(doc: any) {
    doc.count = 0;
  },
};
```

**Step 3: Update your build to produce the right outputs**

Your build should emit:
- `dist/main.js` -- the plugin descriptions (entry point)
- `dist/mount.js` -- the tool implementation
- `dist/mount-datatype.js` -- the datatype implementation (if applicable)

The `importPath` values in `main.ts` must match these output paths.

If you're using Vite, a config like this works:

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: "src/main.ts",
        mount: "src/mount.ts",
        "mount-datatype": "src/mount-datatype.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        /^@automerge\//,
        /^@inkandswitch\//,
        /^@patchwork\//,
        "react",
        "react-dom",
      ],
    },
  },
});
```

**Step 4: Update `package.json`**

Make sure the main export points to your built `main.js`:

```json
{
  "main": "./dist/main.js",
  "exports": {
    ".": {
      "import": "./dist/main.js",
      "source": "./src/main.ts"
    },
    "./mount": {
      "import": "./dist/mount.js",
      "source": "./src/mount.ts"
    }
  },
  "scripts": {
    "build": "vite build",
    "push": "pushwork sync"
  }
}
```

**Step 5: Deploy and register**

```bash
cd my-tool
pnpm build
pushwork push .        # pushes built files to the tool's Automerge document
pushwork url .         # prints the tool's Automerge URL

# Add to a modules document
patchwork-modules add <modules-doc-url> <tool-url>
```

### Migration checklist

| Old format | New format |
|-----------|-----------|
| `type: "patchwork:dataType"` | `type: "patchwork:datatype"` |
| `supportedDataTypes: [...]` | `supportedDatatypes: [...]` |
| `async load() { ... }` | `importPath: "./dist/mount.js"` |
| `{ EditorComponent: Tool }` | `export default toolify(Tool)` or `export default mount` |
| `import { LoadablePlugin } from "@patchwork/sdk"` | No import needed (plain objects) |
| SDK types from `@patchwork/sdk` | Types from `@inkandswitch/patchwork-plugins` (optional) |

### What if my tool uses `@patchwork/sdk` imports at runtime?

The SDK package is being replaced. For the migration:
- **UI components**: `@patchwork/sdk/ui` components (shadcn) are still available but may need to be sourced differently depending on your build setup.
- **Hooks**: `useDocument`, `useRepo` come from `@automerge/automerge-repo-react-hooks`. `useCurrentAccountDoc` and other Patchwork-specific hooks come from `@inkandswitch/patchwork-react`.
- **Types**: `EditorProps` becomes `{ docUrl: AutomergeUrl; element: ToolElement }` passed through `toolify`, or raw `(handle, element)` for the mount function.
