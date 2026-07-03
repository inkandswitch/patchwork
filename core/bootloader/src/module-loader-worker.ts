// Dedicated module worker for plugin-descriptor discovery.
//
// A module-settings doc lists Automerge folder-doc packages. To register the
// plugins a package provides we only need their *descriptions* (id, type,
// name, icon…), not their implementations. This worker imports a package's
// entry point off the main thread purely to read its exported `plugins` array,
// strips the non-cloneable `load()` / `import` machinery, and posts the plain
// descriptors back. The main thread re-imports the package (at the same heads)
// only when a plugin is actually loaded — see `importPluginFromFolderDocUrl`.
//
// Created with type:"module"; its dynamic `import()` of `/<automergeUrl>/…`
// entry points is served by the service worker that controls this worker.

import { importModuleFromFolderDocUrl } from "@inkandswitch/patchwork-filesystem";
import type { AutomergeUrl } from "@automerge/automerge-repo/slim";

type DiscoverRequest = {
  type: "discover";
  id: number;
  url: AutomergeUrl;
};

// Keep only the structured-cloneable description fields. `load` is a closure
// and `module` is the (possibly already-loaded) implementation — neither can
// cross the worker boundary. `import` is droppable too: the main thread
// rebuilds loading by re-importing the package and calling the live plugin.
function toDescriptor(plugin: any): Record<string, unknown> {
  if (!plugin || typeof plugin !== "object") return {};
  const { load, import: _import, module, ...description } = plugin;
  return description;
}

function isDiscoverRequest(data: unknown): data is DiscoverRequest {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as any).type === "discover" &&
    typeof (data as any).id === "number" &&
    typeof (data as any).url === "string"
  );
}

self.addEventListener("message", (event: MessageEvent) => {
  const data = event.data;
  if (!isDiscoverRequest(data)) return;
  const { id, url } = data;

  importModuleFromFolderDocUrl(url)
    .then((mod) => {
      const plugins: any[] = Array.isArray(mod?.plugins) ? mod.plugins : [];
      const descriptors = plugins.map(toDescriptor);
      (self as unknown as Worker).postMessage({
        type: "descriptors",
        id,
        descriptors,
      });
    })
    .catch((error) => {
      (self as unknown as Worker).postMessage({
        type: "error",
        id,
        error:
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error),
      });
    });
});
