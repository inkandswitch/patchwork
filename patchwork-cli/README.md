# patchwork cli

Experimental tool for syncing Automerge repos with local FS and running computations.

Initially based on trailhead:
https://github.com/inkandswitch/trailhead

## Installation

Make sure you have [bun](https://bun.sh/) installed. Then install dependencies and link `patchwork` utility so it's usable across your system:

```
$ pnpm
$ npm link
```

## Commands

### Account Management

#### `patchwork login`

Log in to your account and set up the default parent folder.

```bash
# Log in with an account token
patchwork login --accountUrl account:abc123

# Log in with a direct URL
patchwork login --accountUrl automerge:xyz789
```

Flags:

```
--accountUrl <url>     Account URL or token to log in with
```

#### `patchwork logout`

Log out and clear stored account information.

```bash
patchwork logout
```

#### `patchwork whoami`

Show current login status.

```bash
patchwork whoami
```

### Project Management

#### `patchwork push`

Push local files to a patchwork folder.

```bash
# Create a new project
patchwork push --dir myproject

# Update an existing project
patchwork push --dir myproject --projectFolderUrl automerge:abc123

# Create a new project and add it to a specific parent folder
patchwork push --dir myproject --parentFolderUrl automerge:xyz789
```

Flags:

```
--dir <path>              Directory to sync (default: ".")
--projectFolderUrl <url>  URL of existing folder to update
--parentFolderUrl <url>   Parent folder to add new projects to (overrides stored value)
--test                    Don't actually sync, just output the doc
--syncServerUrl <url>     Sync server URL (default: wss://sync3.automerge.org)
--syncServerStorageId <id> Sync server storage ID
```

#### `patchwork pull`

Pull files from a patchwork folder to local filesystem.

```bash
# Pull a project into current directory
patchwork pull --projectFolderUrl automerge:abc123

# Pull into a specific directory
patchwork pull --dir myproject --projectFolderUrl automerge:abc123
```

Flags:

```
--dir <path>              Directory to sync to
--projectFolderUrl <url>  URL of folder to pull (required)
```

### Branch Management

#### `patchwork branch`

List available branches.

```bash
patchwork branch --projectFolderUrl automerge:abc123
```

Flags:

```
--projectFolderUrl <url>  URL of folder to list branches for
```

#### `patchwork activate`

Activate a specific branch.

```bash
patchwork activate --branchUrl automerge:xyz789
```

Flags:

```
--branchUrl <url>         URL of branch to activate
```

### Module Management

#### `patchwork install`

Install a module.

```bash
patchwork install --moduleUrl automerge:abc123
```

Flags:

```
--moduleUrl <url>         URL of module to install
```

## Configuration

You can configure defaults in two places:

- `.patchwork/config.json` in your home directory: Stores account and global settings
- `patchwork.json` in your project directory: Stores project-specific settings

## Known problems / todos

- use typescript? (ts-node had issues)
