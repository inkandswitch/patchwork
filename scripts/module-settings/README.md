# Deploying Patchwork tools into a module-settings doc

Patchwork loads tools from a **module-settings doc** — an Automerge document
whose `modules` array holds Automerge URLs of individual tool modules. When a
Patchwork site boots with `MODULE_SETTINGS_DOC_URL=<url>`, it fetches that doc
and loads every module listed inside. The `ModuleSettingsDoc` type lives in
[`@inkandswitch/patchwork-filesystem`](../../core/filesystem/src/module-watcher.ts).

This folder contains `pw-modules`, a small CLI that manages those docs over
Subduction sync. Combined with
[`pushwork`](https://github.com/inkandswitch/pushwork), it gives you a two-step
workflow:

1. **Publish** each tool: `pushwork sync` pushes the built tool into Automerge
   and gives you its `automerge:…` URL.
2. **Register** each tool: `pw-modules add` appends that URL to your
   module-settings doc.

---

## One-time setup

### 1. Install `pushwork`

See the [`pushwork`](https://github.com/inkandswitch/pushwork) README. Short
version:

```bash
cd /path/to/pushwork
pnpm install && pnpm run build && pnpm link --global
```

### 2. Install the `pw-modules` CLI

From the **`patchwork-next` repo root** (not from this subfolder):

```bash
pnpm run link-cli
```

That installs this folder's deps and runs `pnpm link --global`, exposing two
aliases for the same binary:

- `pw-modules`
- `patchwork-modules`

If the command isn't found after linking, add pnpm's global bin dir to your
`PATH`:

```bash
export PATH="$(pnpm bin -g):$PATH"
```

If you had an older version linked (e.g. the previous `pw-register-module`
binary from `patchwork-tools/scripts/add-module-to-settings`), run
`pnpm unlink --global` there first.

### Environment variables

| Variable                  | Default                                  | Purpose                              |
| ------------------------- | ---------------------------------------- | ------------------------------------ |
| `SUBDUCTION_SERVER`       | `wss://subduction.sync.inkandswitch.com` | Sync server for the settings doc     |
| `AUTOMERGE_DATA_DIR`      | `<this-folder>/automerge-repo-data`      | Local storage for the CLI's repo     |
| `MODULE_SETTINGS_DOC_URL` | —                                        | Used by per-tool `pnpm run register` |

---

## Create a new module-settings doc

```bash
pw-modules init
```

A human message is written to stderr; the bare URL is written to stdout, so you
can capture it directly:

```bash
export MODULE_SETTINGS_DOC_URL=$(pw-modules init)
echo "$MODULE_SETTINGS_DOC_URL"
# automerge:XXXXXXXXXXXXXXXXXXXXXXXXXX
```

Persist it wherever you run Patchwork (shell profile, `.env`, site config,
etc.). A Patchwork site booted with that URL will load whatever modules you
register next.

---

## Deploy a single tool

Every tool package in `patchwork-tools` ships with two scripts that look like:

```jsonc
{
  "scripts": {
    "push":     "vite build && pushwork sync",
    "register": "pw-modules add \"$MODULE_SETTINGS_DOC_URL\" \"$(pushwork url)\""
  }
}
```

So from any tool directory (e.g. `patchwork-tools/latex/`):

```bash
# First time only — initialize pushwork sync for this folder:
pushwork init .

# Build + publish the tool's Automerge doc:
pnpm run push

# Register it against your settings doc:
pnpm run register
```

`pushwork url` prints the tool's Automerge URL; `pw-modules add` appends it to
`$MODULE_SETTINGS_DOC_URL`'s `modules` array (idempotent — a repeat
registration is a no-op).

To remove a tool:

```bash
pw-modules remove "$MODULE_SETTINGS_DOC_URL" "$(pushwork url)"
```

---

## Deploy every tool under a path

To publish and register every tool in a directory (e.g. all of
`patchwork-tools/`), loop over every package that has a `register` script:

```bash
export MODULE_SETTINGS_DOC_URL=automerge:XXXXXXXXXXXXXXXXXXXXXXXXXX
ROOT=/path/to/patchwork-tools

find "$ROOT" -name package.json -not -path '*/node_modules/*' \
  | while read -r pkg; do
      dir=$(dirname "$pkg")
      if jq -e '.scripts.register' "$pkg" >/dev/null 2>&1; then
        echo "==> $dir"
        ( cd "$dir" \
          && { [ -d .pushwork ] || pushwork init . ; } \
          && pnpm install \
          && pnpm run push \
          && pnpm run register \
        ) || echo "FAILED: $dir"
      fi
    done
```

Notes:

- `pushwork init .` is only needed the first time a directory is published;
  the guard `[ -d .pushwork ]` skips it on subsequent runs.
- `pnpm run register` relies on `MODULE_SETTINGS_DOC_URL` being exported in
  the shell that invokes the loop.
- Registration is idempotent, so it is safe to re-run the loop after adding
  new tools.

### Selective / dry-run deploys

Restrict the loop by pointing `find` at a subpath, e.g. just a few editors:

```bash
find "$ROOT/latex" "$ROOT/notes" "$ROOT/todo" -name package.json -not -path '*/node_modules/*'
```

Or do a build-only pass first (no registration) to catch failures early:

```bash
find "$ROOT" -name package.json -not -path '*/node_modules/*' \
  | while read -r pkg; do
      dir=$(dirname "$pkg")
      jq -e '.scripts.push' "$pkg" >/dev/null 2>&1 \
        && ( cd "$dir" && pnpm install && pnpm run push ) || true
    done
```

---

## CLI reference

```
pw-modules add    <automerge:settings-url> <automerge:module-url>
pw-modules remove <automerge:settings-url> <automerge:module-url>
pw-modules init
pw-modules <automerge:settings-url> <automerge:module-url>   # legacy → add
```

`patchwork-modules` is an alias for the same binary.

---

## Troubleshooting

- **`Invalid module URL: ""`** — usually `$(pushwork url)` returned nothing.
  Run `pushwork status` in the tool's directory; the folder may not be
  initialised for sync (`pushwork init .`).
- **`pw-modules: command not found`** — re-run `pnpm run link-cli` from the
  patchwork-next repo root and make sure `$(pnpm bin -g)` is on your `PATH`.
- **Changes don't appear in Patchwork** — confirm the Patchwork site was
  booted with the same `MODULE_SETTINGS_DOC_URL` and `SUBDUCTION_SERVER`, and
  give sync a few seconds to propagate. The CLI waits briefly after
  `repo.flush()` so the server has time to receive the update before the
  process exits.
