---
"@inkandswitch/patchwork-e2e": minor
---

Publish the e2e suite as a package with a `patchwork-e2e` bin, so any Patchwork site repo can run it against its own build. Run it from the repo root after a build; it starts the site's preview server (`pnpm preview`, overridable with `--preview-command` and `--site-dir`) and points the suite at it, writing reports and traces into the directory you ran from.

The cross-profile sync test against a deployed site now takes its origin from `--live-site=<url>` (or `PATCHWORK_E2E_LIVE_SITE`) instead of a hardcoded patchwork.inkandswitch.com, and skips when neither is set. Also new: `--base-url` to test an already-running server, and `--port`.
