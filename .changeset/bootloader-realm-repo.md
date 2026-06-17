---
"@inkandswitch/patchwork-bootloader": patch
---

Pass the realm-local `repo` to `<patchwork-view>` registration so booted views
resolve their document handles through it — via the per-view `OverlayRepo` and
the root `<repo-provider>` fallback for `repo:handle-descriptor`.
