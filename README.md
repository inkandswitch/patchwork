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

- copy one of the existing directories in `os/src/packages`. `counter` is a nice minimal one you can start with.
- update the package name in `<yourpackage>/package.json`
- delete `jacquard.json` -- that's a config file which tells the system which automerge doc to push to. you don't want to overwrite the original counter.
- `pnpm install`
- Edit the metadata in `index.ts` to have appropriate names etc.
- Push the package to an automerge document:

`cd packages/<yourpackage>`
`pnpm push`

This output should say something like: `pushing to folder: automerge:<docid>`

Now, to install your module in Patchwork, go to "My Tools" and register a new module at this URL:

`automerge/<docid>/dist/index.js`

Now in Patchwork when you click "create new" you should see a new option letting you create a doc of your new datatype.
Click that and you should see your new tool running!

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