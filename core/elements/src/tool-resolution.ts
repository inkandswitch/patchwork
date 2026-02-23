import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getType,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getSupportedTools,
  type ToolDescription,
  getRegistry,
  isLoadablePlugin,
  type LoadedTool,
} from "@inkandswitch/patchwork-plugins";

export interface ToolOption {
  id: string;
  name: string;
  toolUrl: string;
  mount: (handle: any, element: any) => () => void;
  icon?: string;
}

export interface ToolResolution {
  selectedTool: ToolOption | null;
  availableTools: ToolOption[];
}

function toolToOption(tool: LoadedTool): ToolOption | null {
  if (!tool.importUrl || !tool.module) return null;
  return {
    id: tool.id,
    name: tool.name,
    toolUrl: tool.importUrl,
    mount: tool.module as any,
    icon: tool.icon,
  };
}

function resolve(
  doc: HasPatchworkMetadata | undefined,
  preferredToolId: string | null
): ToolResolution {
  if (!doc) {
    return { selectedTool: null, availableTools: [] };
  }

  const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");
  const supported = getSupportedTools(doc);
  const availableTools = supported
    .map(toolToOption)
    .filter((t): t is ToolOption => t != null);

  let selectedTool: ToolOption | null = null;

  if (preferredToolId) {
    // First check type-compatible tools, then fall back to a direct registry
    // lookup. This handles cases like frame tools that may not match the
    // document's type but are explicitly requested.
    selectedTool =
      availableTools.find((t) => t.id === preferredToolId) ?? null;

    if (!selectedTool) {
      const tool = toolRegistry.get(preferredToolId) as LoadedTool | undefined;
      if (tool) {
        selectedTool = toolToOption(tool);
      }
    }
  }

  if (!selectedTool) {
    const fallback = getFallbackTool(doc);
    if (fallback) {
      selectedTool = toolToOption(fallback);
    }
  }

  return { selectedTool, availableTools };
}

/**
 * Reactively resolves which tools are available for a document and auto-selects
 * the best match. Subscribes to registry and document changes so the resolution
 * stays up to date as tools are registered/loaded or the document type changes.
 *
 * Returns a cleanup function that unsubscribes from all listeners.
 */
export function watchToolForDocument(
  repo: Repo,
  docUrl: AutomergeUrl,
  options: { toolId?: string | null },
  callback: (resolution: ToolResolution) => void
): () => void {
  let destroyed = false;
  let lastJson = "";
  const preferredToolId = options.toolId ?? null;
  const teardowns: Array<() => void> = [];

  function emit(resolution: ToolResolution) {
    const json = JSON.stringify(resolution);
    if (json === lastJson) return;
    lastJson = json;
    callback(resolution);
  }

  function reResolve(handle: DocHandle<HasPatchworkMetadata>) {
    if (destroyed) return;
    const doc = handle.doc();
    emit(resolve(doc, preferredToolId));
  }

  const toolRegistry = getRegistry<ToolDescription>("patchwork:tool");

  console.log(`[tool-resolution] watchToolForDocument started`, { docUrl, preferredToolId });

  // Subscribe to events BEFORE the async work so we don't miss registrations
  const offRegistered = toolRegistry.on("registered", (addedTool) => {
    console.log(`[tool-resolution] "registered" event`, { id: addedTool.id, isLoadable: isLoadablePlugin(addedTool), preferredToolId, destroyed });
    if (destroyed) return;
    if (!isLoadablePlugin(addedTool)) return;

    if (preferredToolId && addedTool.id === preferredToolId) {
      console.log(`[tool-resolution] loading preferred tool`, addedTool.id);
      toolRegistry.load(addedTool.id);
      return;
    }

    if (!handle) return;
    const doc = handle.doc();
    const type = doc ? getType(doc) : undefined;
    if (!type) return;
    const supports =
      addedTool.supportedDatatypes === "*" ||
      addedTool.supportedDatatypes?.includes(type);
    if (supports) {
      console.log(`[tool-resolution] loading type-compatible tool`, addedTool.id);
      toolRegistry.load(addedTool.id);
    }
  });
  teardowns.push(offRegistered);

  const offLoaded = toolRegistry.on("loaded", (loadedTool) => {
    console.log(`[tool-resolution] "loaded" event`, { id: loadedTool?.id, destroyed });
    if (destroyed || !handle) return;
    reResolve(handle);
  });
  teardowns.push(offLoaded);

  let handle: DocHandle<HasPatchworkMetadata> | null = null;

  (async () => {
    handle = await repo.find<HasPatchworkMetadata>(docUrl);
    console.log(`[tool-resolution] doc found, running initial resolve`);
    if (destroyed) return;

    // Initial resolution
    reResolve(handle);

    // When the document changes, re-resolve if the type changed
    const h = handle;
    let lastType = getType(h.doc());
    const onChange = (payload: {
      patchInfo: { before: any; after: any };
    }) => {
      const newType = getType(payload.patchInfo.after);
      if (newType !== lastType) {
        lastType = newType;
        reResolve(h);
      }
    };
    h.on("change", onChange);
    teardowns.push(() => h.off("change", onChange));
  })();

  return () => {
    destroyed = true;
    for (const fn of teardowns) {
      fn();
    }
  };
}
