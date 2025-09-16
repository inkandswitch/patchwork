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

```typescript
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

```typescript
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
  },
};
```

Plugins should be exported from the entry point for a module:

```typescript
export const plugins = [plugin1, plugin2];
```

### Using plugins

Although the Patchwork system already handles loading and using tools/datatypes etc, sometimes you will need to write code that directly deals with loading plugins - eg if you're loading a datatype to access some functionality, or you're adding a new part of the system which relies on loading plugins.

- `getPlugin(type, id)` or `getMatchingPlugins()`, to synchronously access plugins which may or may not be loaded
- `getLoadedPlugin(type, id)` or `getMatchingLoadedPlugins()`, to asynchronously access plugins, ensuring they are loaded before returning

## Development

Patchwork isn't a monolithic vite app. Depending on whether you're editing a package or editing the OS/SDK, your dev workflow will look slightly different.

First, here's a quick orientation — this monorepo (managed with pnpm workspaces) includes both the core frame app (./os) and a stripped-down SDK (./sdk).

`./sdk`: contains Patchwork library functionality used by packages, eg:

- defining concepts like tools and datatypes
- helpers for working with Automerge data
- reusable UI components

`./os`: an application that loads tools. It doesn't do anything else.
