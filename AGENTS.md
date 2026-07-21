# AGENTS.md

## Changesets

This is a changesets monorepo. Every published package under `core/` and `packages/` is versioned and released from `.changeset/`.

If you change the source of a published package, add a changeset in the same batch of work. Write it yourself with the Write tool — don't run `pnpm changeset`, it's interactive.

`.changeset/<some-name>.md`:

```markdown
---
"@inkandswitch/patchwork-bootloader": patch
---

Describe what changed and why, in the present tense, for someone reading the changelog. Not "fixed a bug".
```

- One changeset per coherent change, listing every package it touches. Not one per package, not one per commit.
- Pick the filename yourself; any kebab-case name works as long as it's not already taken.
- Bump levels: `patch` for fixes and internal changes, `minor` for new API or a breaking change (everything here is pre-1.0), `major` only when asked.
- If a package's public API changed, say what moved and what to import instead.

Skip the changeset when nothing published changed — `sites/`, `e2e/`, `scripts/`, config, docs, tests.
