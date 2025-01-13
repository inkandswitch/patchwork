import React from "react";
import { DocHandle } from "@automerge/automerge-repo";
import { Icon } from "@patchwork/sdk/ui";
import { MarkdownEditor } from "@patchwork/sdk/markdown";
import { Doc } from "./datatype";

// Loading state component
export const LoadingState = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4">
      <Icon type="Loader" className="w-8 h-8 animate-spin text-gray-400" />
      <span className="text-gray-600">Loading document...</span>
    </div>
  </div>
);

// Error state component
export const ErrorState = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4 max-w-md text-center">
      <Icon type="CircleAlert" className="w-8 h-8 text-red-500" />
      <span className="text-gray-800 font-medium">{error}</span>
    </div>
  </div>
);

export const EditorSection = ({
  title,
  path,
  handle,
  height = "full",
  error,
}: {
  title: string;
  path: string[];
  handle: DocHandle<Doc>;
  height?: string;
  error?: string | undefined;
}) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between mb-2 flex-shrink-0">
      <span className="font-semibold text-gray-800">{title}</span>
      {error && (
        <span className="text-sm text-red-600 flex items-center gap-1">
          <Icon type="CircleAlert" className="w-4 h-4" />
          {error}
        </span>
      )}
    </div>

    <div className="flex-1 min-h-0 rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-full font-mono">
        <MarkdownEditor path={path} handle={handle} />
      </div>
    </div>
  </div>
);

// Results panel component
export const ResultsPanel = ({
  success,
  message,
  details,
}: {
  success?: boolean;
  message: string;
  details?: React.ReactNode;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      {success === undefined ? (
        <Icon type="CircleAlert" className="w-5 h-5 text-gray-400" />
      ) : success ? (
        <Icon type="CircleCheck" className="w-5 h-5 text-green-500" />
      ) : (
        <Icon type="CircleX" className="w-5 h-5 text-red-500" />
      )}
      <span
        className={`font-medium ${success ? "text-green-600" : "text-red-600"}`}
      >
        {message}
      </span>
    </div>
    {details && <div className="mt-2 text-sm text-gray-600">{details}</div>}
  </div>
);

export const PageLayout = ({
  title,
  children,
  error,
}: {
  title: string;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className="flex flex-col h-full gap-4 p-4 bg-white">
    <div className="flex items-center justify-between">
      {error && (
        <span className="text-sm text-red-600 flex items-center gap-1">
          <Icon type="CircleAlert" className="w-4 h-4" />
          {error}
        </span>
      )}
    </div>
    {children}
  </div>
);
