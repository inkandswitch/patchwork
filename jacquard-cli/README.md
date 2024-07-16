# jacquard cli

Experimental tool for syncing Automerge repos with local FS and running computations.

Initially based on trailhead:
https://github.com/inkandswitch/trailhead

## Installation

IMPORTANT: we use yarn for dependencies here even though it's in a pnpm monorepo...

Make sure you have [bun](https://bun.sh/) installed. Then install dependencies and link `jacquard` utility so it's usable across your system:

```
$ yarn
$ npm link
```

## Usage

Create a new doc:

`jacquard push --dir <folder to sync>`

Update an existing doc:

`jacquard push --dir <dir to sync> --projectFolderUrl <existing doc url>`

Other options:

```
--test            don't actually sync, just output the doc
--syncServerUrl   specify a sync server URL, defaults to wss://sync.automerge.org
--syncServerStorageId specify the sync server storage Id, defaults to the storageId of wss://sync.automerge.org
```

## Known problems / todos

- use typescript? (ts-node had issues)
