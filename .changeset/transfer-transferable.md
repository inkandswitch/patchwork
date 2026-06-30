---
"@inkandswitch/patchwork-providers": minor
---

`accept`'s `respond` callback now takes an optional `Transferable[]` second argument, forwarded to `MessagePort.postMessage` so a provider can transfer objects (e.g. a `MessagePort` or `ArrayBuffer`) to the consumer instead of structured-cloning them.
