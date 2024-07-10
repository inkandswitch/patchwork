# Patchwork

Patchwork is a malleable, local-first collaboration environment. It lets you edit many types of automerge documents using various UI tools.

## Concepts

- Datatype: a "file format" or "schema" for automerge documents. eg: markdown, drawing
- Tool: a UI for viewing and editing documents. eg: markdown editor, tldraw canvas, raw json editor.
- Package: a unit for wrapping up datatypes and tools and sharing them.

## Development

Run it:

```
pnpm install
pnpm dev
```

### Folder structure

This monorepo (managed with pnpm workspaces) includes both the core OS APIs as well as various datatypes and tools.

`./os`: contains the core OS functionality: general API definitions, UI chrome like the doc list sidebar, and versioning utilities. (Over time we'll likely split these out into separate packages.)

`./packages/*` contains *packages* which can define datatypes and tools. These packages are not statically included in the deployed OS. Instead, they can be pushed to automerge documents and loaded dynamically. This is currently experimental functionality.

`./os/src/packages/*`: we bundle some mature core packages like our essay editor datatype and tool directly into the OS and deploy them statically as part of the OS deploy. Over the long term we plan to pull these out of this directory and deploy them dynamically.

(Maybe in the future we can make a new package that depends on os and packages, to break the cyclic dependency and enable some better TS workspaces stuff.)

### Dependency hygeine

- Datatypes and tools can depend on the core OS APIs. Over time we plan to formalize a clear SDK that the OS exports.
- Datatypes can depend on the OS but should not depend on tools.
- Tools can depend on functionality in both the OS or various datatypes that they support.

### Adding a new package

If you want a fast development loop and easy deploy as part of the core OS deploy:

- Run `pnpm dev` to run the OS in dev mode
- copy one of the existing directories in `os/src/packages` and modify to your liking
- Update the listing in `os/src/packages/index.ts`

If you want to dynamically deploy a new package to an automerge document and are ok with a more experimental developer experience:

- copy `packages/raw-editor` as a sample
- In package.json: change the package name, and the automerge doc ID that it will deploy to
- edit the code
- run `pnpm push` to deploy to automerge. (You'll need [trailhead](https://github.com/inkandswitch/trailhead) installed.)

### AI

LLM features in Patchwork include bot edits and change history summarization. Currently these are backed by the OpenAI API. To enable them in local dev you'll need to set up an API key locally. Create a file at `os/.env.local`:

```
VITE_OPENAI_API_KEY=<OpenAI key>
```

You can get the lab OpenAI key from Geoffrey.