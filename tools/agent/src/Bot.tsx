import React from "react";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { toolify } from "@patchwork/react";
import { BotIcon, FileIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { AgentDocument } from "./Agent";

const Bot = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [agentDoc] = useDocument<AgentDocument>(docUrl, {
    suspense: true,
  });
  const repo = useRepo();
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});

  // Fetch titles for active documents
  useEffect(() => {
    if (!agentDoc?.activeDocUrls) return;

    const fetchTitles = async () => {
      const titles: Record<string, string> = {};

      for (const docUrl of agentDoc.activeDocUrls) {
        try {
          const handle = await repo.find(docUrl as any);
          const doc = handle.doc();
          if (doc) {
            const title = doc["@patchwork"]?.title || docUrl;
            titles[docUrl] = title;
          }
        } catch (err) {
          console.error(`Failed to fetch title for ${docUrl}:`, err);
          titles[docUrl] = docUrl;
        }
      }

      setDocTitles(titles);
    };

    fetchTitles();
  }, [agentDoc?.activeDocUrls, repo]);

  if (!agentDoc) {
    return (
      <div className="flex justify-center items-center h-full p-4">
        <div className="alert">
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <BotIcon size={16} />
        <span className="font-semibold">Agent Bot</span>
      </div>

      {/* Attached Files Section */}
      <div className="px-4 py-3 border-b bg-base-200">
        <div className="text-sm font-medium mb-2">Attached Files:</div>
        {agentDoc.activeDocUrls && agentDoc.activeDocUrls.length > 0 ? (
          <div className="flex flex-col gap-1">
            {agentDoc.activeDocUrls.map((docUrl) => (
              <div
                key={docUrl}
                className="flex items-center gap-2 text-sm bg-base-100 px-2 py-1 rounded"
              >
                <FileIcon size={14} />
                <span className="truncate" title={docUrl}>
                  {docTitles[docUrl] || docUrl}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-base-content opacity-60">
            No files attached
          </div>
        )}
      </div>

      {/* Chat View */}
      <div className="flex-1 overflow-hidden min-h-0">
        {agentDoc.chatDocUrl ? (
          // @ts-ignore - custom element
          <patchwork-embed doc-url={agentDoc.chatDocUrl} />
        ) : (
          <div className="flex justify-center items-center h-full p-4">
            <div className="text-base-content opacity-60">
              No chat attached to this agent
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const renderBot = toolify(Bot);
