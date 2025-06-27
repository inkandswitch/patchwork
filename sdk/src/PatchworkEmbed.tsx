import React, { Suspense, useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  RepoContext,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
import { Tool } from "./tools";
import { useMatchingPluginDescriptions, usePlugin } from "./hooks";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { Icon } from "./ui";
import { HasPatchworkMetadata } from "./modules/types";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-600">
          <div className="font-bold">Something went wrong</div>
          {this.state.error && (
            <div className="text-sm mt-2">{this.state.error.message}</div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Component that loads the document and renders the appropriate tool
const DocumentLoader = ({
  docUrl,
  toolId,
}: {
  docUrl: string;
  toolId?: string;
}) => {
  const docUrlTyped = docUrl as AutomergeUrl;
  const [doc] = useDocument<HasPatchworkMetadata>(docUrlTyped, {
    suspense: true,
  }); // Enable suspense

  const dataTypeId = doc["@patchwork"]?.type;
  const { plugins: tools } = useMatchingPluginDescriptions<Tool>({
    pluginType: "patchwork:tool",
    matchField: "supportedDataTypes",
    matchValue: dataTypeId,
    sortField: "name",
  });

  const resolveToolId = (toolId: string | undefined) => {
    if (toolId && tools.some((t) => t.id === toolId)) {
      return toolId;
    }
    return tools.length > 0 ? tools[0].id : undefined;
  };

  const resolvedToolId = resolveToolId(toolId);
  const { plugin: selectedTool, isLoading } = usePlugin(
    "patchwork:tool",
    resolvedToolId
  );
  // Create a callback for tools that need to request tool changes
  // This will be passed down to tools but won't directly emit events
  const handleToolChange = (newToolId: string) => {
    // Only emit if the selection is different
    if (newToolId !== toolId) {
      console.log("[PatchworkEmbed] Tool requested change:", {
        from: toolId,
        to: newToolId,
      });

      // Dispatch event to parent for handling, but don't manage state here
      const event = new CustomEvent("tool-change", {
        detail: {
          toolId: newToolId,
          source: "PatchworkEmbed",
          elementId: docUrl, // Use the doc URL as a unique identifier
        },
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  if (!dataTypeId) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-lg font-medium">Invalid Document</div>
            <div className="text-gray-500 text-sm mt-1">
              No document type found
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle the case where no tools are available
  if (!tools.length) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl mb-2">🔧</div>
            <div className="text-lg font-medium">No tools available</div>
            <div className="text-gray-500 text-sm mt-1">
              No tools are installed for type: {dataTypeId}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <Icon
              type="Loader"
              size={24}
              className="animate-spin mx-auto mb-2"
            />
            <div className="text-gray-500 text-sm">Loading tool...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedTool) {
    return (
      <div className="p-4 border border-gray-200 rounded">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-lg font-medium">No tool found</div>
            <div className="text-gray-500 text-sm mt-1">
              No tool found for type: {dataTypeId}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* @ts-ignore EditorProps requires docPath and mainDocUrl but they aren't needed in practice */}
      <selectedTool.module.EditorComponent
        docUrl={docUrlTyped}
        onToolChange={handleToolChange}
      />
    </div>
  );
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="p-4 border border-gray-200 rounded">
    <div className="flex items-center justify-center h-32">
      <div className="text-center">
        <Icon type="Loader" size={24} className="animate-spin mx-auto mb-2" />
        <div className="text-gray-500 text-sm">Loading document...</div>
      </div>
    </div>
  </div>
);

export class PatchworkEmbed extends HTMLElement {
  root: ReturnType<typeof createRoot> | null = null;

  static get observedAttributes() {
    return ["doc-url", "tool-id"];
  }

  connectedCallback() {
    if (!this.root) {
      this.root = createRoot(this);
    }
    this.render();
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    if (!this.root) return;

    const docUrl = this.getAttribute("doc-url");
    const toolId = this.getAttribute("tool-id") || undefined;

    if (!docUrl) {
      this.root.render(<div>No document URL provided</div>);
      return;
    }

    const repo = (window as any).repo;
    if (!repo) {
      this.root.render(<div>No repo found</div>);
      return;
    }

    this.root.render(
      <RepoContext.Provider value={repo}>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <DocumentLoader docUrl={docUrl} toolId={toolId} />
          </Suspense>
        </ErrorBoundary>
      </RepoContext.Provider>
    );
  }
}
