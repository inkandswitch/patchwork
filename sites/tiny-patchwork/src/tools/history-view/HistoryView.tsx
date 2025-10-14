import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { contextComputation } from "@patchwork/context";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context/react";
import { IsSelected } from "@patchwork/context/selection";
import { HasPatchworkMetadata } from "@patchwork/filesystem";
import { useEffect, useState, useRef } from "react";
import { useDatatype, useTitle } from "../../lib/datatype-hooks";
import { toolify } from "../../lib/toolify";
import { relativeTime } from "../../lib/relative-time";
import { ViewHeads } from "@patchwork/context/diff";

const HistoryView = () => {
  const selectedDocUrls = useReactive($selectedDocUrls);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2">
        <h2 className="text-md font-bold">History</h2>
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
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl, {
    suspense: true,
  });
  const title = useTitle(doc, repo);

  const docRef = useDocRef(docUrl);

  const headsSelectionContext = useSubcontext("HEADS_SELECTION");
  useEffect(() => {
    if (!docRef || !selectedHash) {
      headsSelectionContext.replace([]);
      return;
    }

    headsSelectionContext.replace(
      docRef.with(
        ViewHeads({
          fromHeads: [selectedHash],
          toHeads: [selectedHash],
        })
      )
    );
  }, [selectedHash, headsSelectionContext]);

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
        {history.map(({ change }, index) => {
          const isSelected = change.hash === selectedHash;
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              onClick={() => setSelectedHash(change.hash)}
              className={
                "text-xs p-2 rounded border flex justify-between cursor-pointer " +
                (isSelected
                  ? "bg-blue-100 border-blue-300"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100")
              }
            >
              <div>{change.hash.slice(0, 6)}</div>
              {change.time && (
                <div className="text-gray-600">
                  {relativeTime(change.time * 1000)}
                </div>
              )}
            </div>
          );
        })}
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
