import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { contextComputation } from "@patchwork/context";
import { useReactive } from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { useEffect, useState, useRef } from "react";
import { useDatatype, useTitle } from "../../lib/datatype-hooks";
import { toolify } from "../../lib/toolify";

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  } else if (months < 12) {
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
};

const HistoryView = () => {
  const selectedDocUrls = useReactive($selectedDocUrls);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2">
        <h2 className="text-xl font-bold mb-4">History Viewer</h2>
      </div>

      {selectedDocUrls.map((url) => (
        <DocHistoryView docUrl={url} />
      ))}
    </div>
  );
};

const DocHistoryView = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const repo = useRepo();
  const [history, setHistory] = useState<Automerge.State<unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const datatype = useDatatype(docUrl);
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl, {
    suspense: true,
  });
  const title = useTitle(doc, repo);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const handle = await repo.find(docUrl);
        const doc = handle.doc();
        if (doc) {
          const docHistory = Automerge.getHistory(doc);
          docHistory.reverse();
          setHistory(docHistory);
        }
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [docUrl, repo, doc]);

  if (loading) {
    return <div className="text-gray-500">Loading history...</div>;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-2">
        <div className="font-medium">{title}</div>
      </div>
      <div className="space-y-1 flex-1 overflow-y-auto p-2">
        {history.map(({ change }, index) => (
          <div
            key={index}
            className="text-xs bg-gray-50 p-2 rounded border border-gray-200 flex justify-between"
          >
            <div>{change.hash.slice(0, 6)}</div>
            {change.time && (
              <div className="text-gray-600">
                {formatRelativeTime(change.time * 1000)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const $selectedDocUrls = contextComputation((context) => {
  const selectedRefs = context.refsWith(IsSelected);

  const selectedDocUrls = new Set<AutomergeUrl>();

  for (const ref of selectedRefs) {
    selectedDocUrls.add(ref.docUrl);
  }

  return Array.from(selectedDocUrls);
});

export const renderHistoryView = toolify(HistoryView);
