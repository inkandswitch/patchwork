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

`./os`: contains the core OS functionality: general API definitions, UI chrome like the doc list sidebar, and versioning utilities. (Over time we'll likely split these out into separate packages.)

`./packages/*` contains *packages* which can define datatypes and tools. Some of these packages are referenced from `./os` and bundled as built-ins; some are deployed to Automerge as dynamic packages.

`./os/src/packages/*`: we bundle some mature core packages like our essay editor datatype and tool directly into the OS and deploy them statically as part of the OS deploy. Over the long term we plan to pull these out of this directory and deploy them dynamically.

(Maybe in the future we can make a new package that depends on os and packages, to break the cyclic dependency and enable some better TS workspaces stuff.)

### Dependency hygeine

- Datatypes and tools can depend on the core OS APIs. Over time we plan to formalize a clear SDK that the OS exports.
- Datatypes can depend on the OS but should not depend on tools.
- Tools can depend on functionality in both the OS or various datatypes that they support.

### Adding a new package

If you want a fast development loop and easy deploy as part of the core OS deploy:

- Run `pnpm dev` to run the OS in dev mode
- copy one of the existing directories in `os/src/packages`. `counter` is a nice minimal one you can start with.
- You'll need to update a few places to get your new package registered. (Sorry this list is long, it should be shorter.)
  - update the package name in `<yourpackage>/package.json`
  - update `os/package.json` to include an entry pointing to your new package, then run `pnpm i` to install the dependency
  - update `os/src/packages/index.ts` to include an entry pointing to your new package
  - Update `os/src/packages/datatypesSafe.ts` to include an entry for your new datatype (assuming your package exports a datatype). This will be removed once we support dynamic datatypes.

If you want to dynamically deploy a new package to an automerge document and are ok with a more experimental developer experience: ask Paul or Geoffrey for help, that's a more experimental thing currently.

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