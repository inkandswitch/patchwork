---
"@inkandswitch/patchwork-filesystem": patch
---

Move module reload chatter to a `patchwork:modules` debug logger, and report module load failures with `console.error` instead of `console.log`.
