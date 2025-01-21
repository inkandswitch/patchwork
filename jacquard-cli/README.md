# jacquard cli

Experimental tool for syncing Automerge repos with local FS and running computations.

Initially based on trailhead:
https://github.com/inkandswitch/trailhead

## Installation

Make sure you have [bun](https://bun.sh/) installed. Then install dependencies and link `jacquard` utility so it's usable across your system:

```
$ pnpm
$ npm link
```

## Commands

### Account Management

#### `jacquard login`
Log in to your account and set up the default parent folder.

```bash
# Log in with an account token
jacquard login --accountUrl account:abc123

# Log in with a direct URL
jacquard login --accountUrl automerge:xyz789
```

Flags:
```
--accountUrl <url>     Account URL or token to log in with
```

#### `jacquard logout`
Log out and clear stored account information.

```bash
jacquard logout
```

#### `jacquard whoami`
Show current login status.

```bash
jacquard whoami
```

### Project Management

#### `jacquard push`
Push local files to a Jacquard folder.

```bash
# Create a new project
jacquard push --dir myproject

# Update an existing project
jacquard push --dir myproject --projectFolderUrl automerge:abc123

# Create a new project and add it to a specific parent folder
jacquard push --dir myproject --parentFolderUrl automerge:xyz789
```

Flags:
```
--dir <path>              Directory to sync (default: ".")
--projectFolderUrl <url>  URL of existing folder to update
--parentFolderUrl <url>   Parent folder to add new projects to (overrides stored value)
--test                    Don't actually sync, just output the doc
--syncServerUrl <url>     Sync server URL (default: wss://sync.automerge.org)
--syncServerStorageId <id> Sync server storage ID
```

#### `jacquard pull`
Pull files from a Jacquard folder to local filesystem.

```bash
# Pull a project into current directory
jacquard pull --projectFolderUrl automerge:abc123

# Pull into a specific directory
jacquard pull --dir myproject --projectFolderUrl automerge:abc123
```

Flags:
```
--dir <path>              Directory to sync to
--projectFolderUrl <url>  URL of folder to pull (required)
```

### Branch Management

#### `jacquard branch`
List available branches.

```bash
jacquard branch --projectFolderUrl automerge:abc123
```

Flags:
```
--projectFolderUrl <url>  URL of folder to list branches for
```

#### `jacquard activate`
Activate a specific branch.

```bash
jacquard activate --branchUrl automerge:xyz789
```

Flags:
```
--branchUrl <url>         URL of branch to activate
```

### Build System

#### `jacquard run`
Run a command with dependency tracking.

```bash
# Simple command
jacquard run --command "python script.py"

# With input/output tracking
jacquard run --inputs data.csv --outputs result.json --command "python process.py"

# With LaTeX dependency tracking
jacquard run --latexDeps --command "pdflatex paper.tex"
```

Flags:
```
--dir <path>              Working directory
--inputs <paths>          Input files (multiple allowed)
--outputs <paths>         Output files (multiple allowed)
--command <cmd>           Command to run
--runPrefix <prefix>      Prefix for run names
--latexDeps              Track LaTeX dependencies
--stdoutDeclaredDeps     Look for dependencies declared in stdout
```

#### `jacquard refresh`
Refresh outdated builds.

```bash
jacquard refresh
```

#### `jacquard watch`
Watch for file changes and rebuild.

```bash
jacquard watch
```

#### `jacquard watch-requests`
Watch for refresh requests.

```bash
jacquard watch-requests
```

### Module Management

#### `jacquard install`
Install a module.

```bash
jacquard install --moduleUrl automerge:abc123
```

Flags:
```
--moduleUrl <url>         URL of module to install
```

## Configuration

You can configure defaults in two places:
- `.jacquard/config.json` in your home directory: Stores account and global settings
- `jacquard.json` in your project directory: Stores project-specific settings

## Known problems / todos

- use typescript? (ts-node had issues)
