import "./styles.css";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { ViewHeads, ViewHeadsAnnotation } from "@patchwork/context-diff";
import {
  useDocRef,
  useReactive,
  useSubcontext,
} from "@patchwork/context-react";
import { getType, HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import { useEffect, useState } from "react";
import { relativeTime } from "@patchwork/util/src/relative-time";
import { toolify } from "@inkandswitch/patchwork-react";
import { $selectedDocUrls } from "@patchwork/context-selection";
import { useDatatype } from "@inkandswitch/patchwork-react";

const HistoryView = () => {
  const selectedDocUrls = useReactive($selectedDocUrls);

  return (
    <div className="flex flex-col h-full">
      {selectedDocUrls.map((url) => (
        <DocHistoryView docUrl={url} key={url} />
      ))}
    </div>
  );
};

const DocHistoryView = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const repo = useRepo();
  const [history, setHistory] = useState<Automerge.State<unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewHeads, setViewHeads] = useState<ViewHeads | null>(null);
  const [doc] = useDocument<HasPatchworkMetadata>(docUrl, {
    suspense: true,
  });
  const title = useDatatype(getType(doc))?.module.getTitle(doc);

  const docRef = useDocRef(docUrl);

  const headsSelectionContext = useSubcontext("HISTORY_HEADS_SELECTION");
  useEffect(() => {
    if (!docRef || !viewHeads) {
      headsSelectionContext.replace([]);
      return;
    }

    headsSelectionContext.replace(docRef.with(ViewHeadsAnnotation(viewHeads)));
  }, [viewHeads, headsSelectionContext, docRef]);

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

  const onSelectHashAt = (index: number) => {
    const beforeHeads =
      index === history.length - 1 ? [] : [history[index + 1].change.hash];
    const afterHeads = [history[index].change.hash];

    setViewHeads({
      beforeHeads,
      afterHeads,
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-2 flex justify-between items-center">
        <div className="font-medium">{title}</div>

        <button
          className={`btn btn-sm btn-ghost ${viewHeads ? "" : "invisible"}`}
          onClick={() => setViewHeads(null)}
        >
          Reset to now
        </button>
      </div>
      <div className="space-y-1 flex-1 overflow-auto p-2 min-h-0">
        {history.map(({ change }, index) => {
          const isSelected = change.hash === viewHeads?.afterHeads[0];
          return (
            <div
              key={index}
              role="button"
              tabIndex={0}
              aria-selected={isSelected}
              onClick={() => onSelectHashAt(index)}
              className={
                "text-xs p-2 rounded border flex justify-between cursor-pointer " +
                (isSelected
                  ? "bg-primary border-primary-content"
                  : "bg-base-50 border-base-200 hover:bg-base-100")
              }
            >
              <div>{change.hash.slice(0, 6)}</div>
              {change.time && (
                <div className="text-base-content">
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

export const renderHistoryView = toolify(HistoryView);
