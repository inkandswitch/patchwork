---
"@inkandswitch/patchwork-filesystem": patch
"@inkandswitch/patchwork-bootloader": patch
---

Discover a package's plugin descriptors in a dedicated module worker off the
main thread, then re-import the package (pinned to the same heads) on the main
thread to run each plugin's real loader. Adds
`importPluginFromFolderDocUrl(folderDocUrl, pluginType, pluginId)`, which selects
the plugin by both its `type` and `id` — a plugin `id` is only unique within a
plugin type, so a package may export e.g. a `patchwork:datatype` and a
`patchwork:tool` that share the same id.
