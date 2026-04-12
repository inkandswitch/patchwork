# Dev Swap

A patchwork tool for swapping production tools with dev versions on deployed TPW.

## Setup

1. Build and push the dev-swap tool:

```bash
cd tools/tiny-patchwork/dev-swap
pnpm build
pushwork sync
```

2. Install the tool on TPW. Either paste the pushwork URL into the Packages panel, or from the browser console:

```js
$command.installModule("automerge:<dev-swap-pushwork-url>")
```

3. Add it to your context tools via the Frame Configurator, or from the console:

```js
accountDocHandle.change(doc => {
  doc.contextToolIds.push("dev-swap");
});
```

The Dev Swap panel will appear in the right sidebar.

## Usage

### Developing a tool

1. Set up a dev pushwork config for the tool you want to modify:

```bash
cd tools/sidebars/sideboard
pushwork --dev test init
```

2. Make your changes to the tool source. Keep the plugin ID the same: dev-swap handles the renaming automatically.

3. Build and push the dev version:

```bash
pushwork --dev test sync
```

Note the automerge URL printed by pushwork.

4. In TPW, enter the dev URL in the Dev Swap panel input and click Swap (or use the console):

```js
devSwap("automerge:<dev-url>")
```

This will:
- Load the dev module and register plugins with `-dev` suffixed IDs
- For tools referenced in the account doc (sideboard, context sidebar, etc.): swap the account doc field to point to the `-dev` version
- For tools not in the account doc (account picker, etc.): override the production plugin in the registry directly
- Set up a folder doc watcher for hot reload

5. Iterate: edit source, `pushwork --dev test sync`, and the tool hot-reloads automatically.

6. When done, click Unswap in the panel or:

```js
devUnswap("automerge:<dev-url>")
```

This restores the original tool but keeps the dev URL in the panel so you can re-swap later with one click. To remove it from the panel entirely, click the x button and confirm.

### Persistence

Active swaps are stored in localStorage and restored on tool load (before the frame renders). The account doc retains the swapped tool IDs via Automerge, so swaps survive page reloads as long as the dev-swap tool is installed.

Dev modules are not added to moduleSettings: they are loaded exclusively by the dev-swap engine to avoid ID conflicts with production tools.

### Multiple swaps

You can swap multiple tools at once. Each dev URL gets its own entry in the panel. If you swap a second dev URL for the same tool, the previous swap is cleaned up automatically while preserving the original tool ID for unswap.
