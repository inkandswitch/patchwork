import {
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import {
  getType,
  getToolSource,
  type HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getFallbackTool,
  getSupportedTools,
  type ToolDescription,
  getRegistry,
} from "@inkandswitch/patchwork-plugins";

export interface ToolOption {
  id: string;
  name: string;
  importUrl: string;
  icon?: string;
  branch?: string;
  sourceDocUrl?: string;
}

export interface ToolResolution {
  selectedTool: ToolOption | null;
  availableTools: ToolOption[];
}

function toolToOption(tool: ToolDescription): ToolOption | null {
  if (!tool.importUrl) return null;
  return {
    id: tool.id,
    name: tool.name,
    importUrl: tool.importUrl,
    icon: tool.icon,
    branch: tool.branch,
    sourceDocUrl: tool.sourceDocUrl,
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

  const toolSource = getToolSource(doc);

  if (preferredToolId) {
    if (toolSource?.branch) {
      const branchVersion = toolRegistry.getBranch(
        preferredToolId,
        toolSource.branch
      );
      if (branchVersion) {
        selectedTool = toolToOption(branchVersion);
      }
    }

    if (!selectedTool) {
      selectedTool =
        availableTools.find((t) => t.id === preferredToolId) ?? null;
    }

    if (!selectedTool) {
      const tool = toolRegistry.get(preferredToolId);
      if (tool) {
        selectedTool = toolToOption(tool);
      }
    }
  }

  if (!selectedTool) {
    const fallback = getFallbackTool(doc);
    if (fallback) {
      if (toolSource?.branch) {
        const branchVersion = toolRegistry.getBranch(
          fallback.id,
          toolSource.branch
        );
        if (branchVersion) {
          selectedTool = toolToOption(branchVersion);
        }
      }
      if (!selectedTool) {
        selectedTool = toolToOption(fallback);
      }
    }
  }

  return { selectedTool, availableTools };
}

/**
 * Reactively resolves which tools are available for a document and auto-selects
 * the best match. Subscribes to registry and document changes so the resolution
 * stays up to date as tools are registered or the document type changes.
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

  const offRegistered = toolRegistry.on("registered", () => {
    if (destroyed || !handle) return;
    reResolve(handle);
  });
  teardowns.push(offRegistered);

  let handle: DocHandle<HasPatchworkMetadata> | null = null;

  (async () => {
    handle = await repo.find<HasPatchworkMetadata>(docUrl);
    if (destroyed) return;

    reResolve(handle);

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
