# Patchwork

Patchwork is a malleable, local-first collaboration environment. It lets you edit many types of automerge documents using various UI tools.


## Concepts

- Datatype: a "file format" or "schema" for automerge documents. eg: markdown, drawing
- Tool: a UI for viewing and editing documents. eg: markdown editor, tldraw canvas, raw json editor.
- Package: a unit for wrapping up datatypes and tools and sharing them.

The Patchwork OS has 2 kinds of packages: built-ins and dynamic. Built-in packages are bundled into the OS and deployed together with it. Dynamic packages are deployed to Automerge documents and loaded out of Automerge at runtime. Currently most of our packages are built-ins, but we plan to gradually migrate everything to dynamic over time, so that we're only deploying the OS and all the datatypes + tools are loaded out of Automerge.


## Development

For typical development you can run these commands for a fast development loop based on `vite dev`:

```
pnpm install
pnpm dev
```

However, with the above commands dynamic packages won't work. To include dynamic packages loaded out of Automerge:

Switch to the `os` directory:

```
cd os
```

Run a build watcher:

```
pnpm build:dev
```

Run a vite preview server:

```
pnpm preview
```

And you'll need to manually refresh the browser to see changes. This is a slower dev loop which will re-bundle the app every time a change is made.

### Folder structure

This monorepo (managed with pnpm workspaces) includes both the core OS APIs as well as various datatypes and tools.

`./sdk`: contains Patchwork library functionality used by packages, eg:

- defining concepts like tools and datatypes
- account management
- version control utilities
- helpers for working with Automerge data
- reusable UI components

Proper SDK documentation is a todo.

`./packages/*` contains *packages* which can define datatypes and tools, eg. the essay editor or a spreadsheet. Counter is a good sample one to look at for the minimal structure.

`./os`: a React application that renders the Patchwork OS. Currently we also add a bunch of packages to the built OS so they can be deployed and loaded directly with the OS; we're moving towards loading all out of automerge.

### Dependency hygeine

- Everything can depend on SDK. (We want to minimize and organize SDK over time.)
- It's OK for packages to depend on each other, but only through the public interface.
- Nothing should depend on OS, that's just a web app.

### Adding a new package

If you want to add a package and bundle it into OS (recommended for now), here are the steps:

- Run `pnpm dev` to run the OS in dev mode
- copy one of the existing directories in `os/src/packages`. `counter` is a nice minimal one you can start with.
- You'll need to update a few places to get your new package registered. (Sorry this list is long, it should be shorter.)
  - update the package name in `<yourpackage>/package.json`
  - update `os/package.json`:
    - include an entry pointing to your new package in the dependencies
    - add a `build:<package>` line copying the structure of the existing ones. (This copies the built bundle for your package into the dist of the OS so it can be deployed together.)
  - run `pnpm install`
  - update `os/src/packages/index.ts` to include an entry pointing to your new package
  - Update `os/src/packages/datatypesSafe.ts` to include an entry for your new datatype (assuming your package exports a datatype)

Now it's time to try out your new package! To see your new datatype/tool in Patchwork, you'll need to make sure it's enabled, since we hide experimental datatypes by default. Log in / create an account, open the account picker, and check the box for your new datatype.

You should see a new "new" button in the list at the top of the sidebar, letting you create a doc of your new datatype. Click that and you should see your new tool running!

If you want to dynamically deploy a new package to an automerge document: ask the team for help, that's more experimental for now.

### AI

LLM features in Patchwork include bot edits and change history summarization. Currently these are backed by the OpenAI API. To enable them in local dev you'll need to set up an API key locally. Create a file at `os/.env.local`:

```
VITE_OPENAI_API_KEY=<OpenAI key>
```

You can get the lab OpenAI key from Geoffrey.

```
VITE_OPENAI_API_KEY=<OpenAI key>
```

You can get the lab OpenAI key from Geoffrey.