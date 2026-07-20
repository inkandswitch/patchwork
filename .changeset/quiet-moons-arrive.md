---
"@inkandswitch/patchwork-providers": patch
"@inkandswitch/patchwork-elements": patch
---

Give `<patchwork-view>` a proper exports map and test suite, and tear down its overlay repo on unmount.

Add `registerPatchworkViewTag` so views registered under a custom tag name are still treated as subscription boundaries, and `OverlayRepo.dispose()`/`OverlayHandle.dispose()` so unmounting a view detaches the event forwarders it installed on backing handles.
