# Patchwork

This repository holds the Patchwork System, and the famous Tiny Patchwork frame.

## Getting started

```shell
git clone https://github.com/inkandswitch/patchwork-next
cd patchwork-next
pnpm install
pnpm build
SITE=tiny-patchwork pnpm dev
```

## Dev mode for tools

To develop core tools (e.g., the sideboard) and test them locally in Tiny Patchwork without affecting other users:

1. In the tool directories, run `pushwork --dev init` then `pushwork --dev sync` (or `pushwork --dev watch`).
2. In the root directory, run `pnpm tiny-dev-overrides` to automatically find all tools with dev versions and create a local dev override config. This scans for tools that have both a `pushwork.url` in their `package.json` (prod URL) and a `.pushwork/local-dev/snapshot.json` (dev URL).
3. Start TPW with `DEV_TOOLS=1 SITE=tiny-patchwork pnpm dev`.
