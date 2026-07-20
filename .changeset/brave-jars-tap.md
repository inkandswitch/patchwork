---
"@inkandswitch/patchwork-bootloader": patch
---

Switch the service worker's active cache name before copying the default cache into it, so fetches landing mid-copy aren't deleted with the old cache. Guard the message handler against payload-less messages, and drop the `window.killsw` debug hook.
