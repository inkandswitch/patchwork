# Patchwork Frame

Patchwork is a malleable, local-first collaboration environment in the browser. This is a bootstrapping application designed as part of the GAIOS project.

## Plugins

The plugin system is a runtime extensible architecture that allows user-developers to contribute code to various places in the project. These modules can be loaded from anywhere, but are generally either bundled into the distribution (for some core types and tools) or loaded from folders of files at runtime using module-watcher.

### Plugin Types

The system supports several built-in plugin types:

- Tool (`patchwork:tool`): A UI for viewing and editing documents. eg: markdown editor, spreadsheet, raw json editor.
- Data type (`patchwork:dataType`): A "file format" or "schema" for automerge documents. eg: markdown, drawing. In addition to a schema, a data type also defines some useful functionality that's not tied to a particular UI: e.g., how to initialize a new document of that type.
- Import method (`patchwork:importMethod`): a way to import a file into a patchwork document
- Export method (`patchwork:exportMethod`): a way to export a patchwork document to a file

The set of plugin types is also extensible beyond this core few.

### Defining plugins

A plugin has description metadata like this:

```typescript
export interface PluginDescription {
  id: string;
  type: string;
  name: string;
  icon?: IconType;
  importUrl?: string;
}
```

The id defines an internal name used for deduplication, the type is used to discover plugins, the name and icon are used in user-facing contexts and the importUrl is written into new documents so that it can be discovered automatically on shared links.

In addition to metadata, most plugins have some code.
A plugin can define a `load` function which returns a module for the code, eg using an async import. The plugin system will handle loading this code on-demand when it is needed.

```
{
    type: "patchwork:tool",
    id: "essay",
    name: "Editor",
    supportedDataTypes: ["essay"],

    async load() {
      const { tool } = await import("./tool");
      return tool;
    },
  },
```

A plugin can also just directly define code in a `module` key, skipping the deferred loading step—try to only include small amounts of code this way, because this code gets loaded immediately whenever the system inspects the metadata on the plugin:

export const markdownExport: ExportMethod = {
id: "essay-markdown-export",
type: "patchwork:exportMethod",
name: "Markdown",
useAsDefaultMethod: true,
datatypeId: "essay",
fileExtensions: ["md"],
module: {
async exportData(doc: Doc<unknown>, repo: Repo) {
const markdownDoc = doc as Doc<MarkdownDoc>;
const content = markdownDoc.content;

      const prefix = markdownDoc.fileName ?? (await getTitle(markdownDoc));
      const extension = markdownDoc.extension ?? "md";
      const hasExtensionAlready = /\.[a-z0-9]+$/.test(prefix);
      const fileName = hasExtensionAlready ? prefix : `${prefix}.${extension}`;
      const type = markdownDoc.mimeType ?? "text/markdown";

      return new File([content], fileName, { type });
    },

}
};

Plugins should be exported from the entry point for a module:

```
export const plugins = [plugin1, plugin2]
```

### Using plugins

Although the Patchwork system already handles loading and using tools/datatypes etc, sometimes you will need to write code that directly deals with loading plugins - eg if you're loading a datatype to access some functionality, or you're adding a new part of the system which relies on loading plugins.

Plugins can be loaded using either hooks or pure JS functions.

See `usePlugin()` and `usePluginDescriptions()` for example use in React.

For the most common cases in non-react contexts you can use:

- `getPlugin(type, id)` or `getMatchingPlugins()`, to synchronously access plugins which may or may not be loaded
- `getLoadedPlugin(type, id)` or `getMatchingLoadedPlugins()`, to asynchronously access plugins, ensuring they are loaded before returning

## Development

Patchwork isn't a monolithic vite app. Depending on whether you're editing a package or editing the OS/SDK, your dev workflow will look slightly different.

First, here's a quick orientation — this monorepo (managed with pnpm workspaces) includes both the core frame app (./os) and a stripped-down SDK (./sdk).

`./sdk`: contains Patchwork library functionality used by packages, eg:

- defining concepts like tools and datatypes
- helpers for working with Automerge data
- reusable UI components

`./os`: a React application that loads tools. It doesn't do much else.

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
