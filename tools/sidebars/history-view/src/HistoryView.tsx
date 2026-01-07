import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocHandle,
  useDocument,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import "./styles.css";

import { annotations as ANNOTATIONS } from "@inkandswitch/annotations-context";
import {
  getType,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { toolify } from "@inkandswitch/patchwork-react";
import { relativeTime } from "@patchwork/util/src/relative-time";
import { useEffect, useMemo, useState } from "react";

import { AnnotationSet } from "@inkandswitch/annotations";
import { ViewHeads } from "@inkandswitch/annotations-diff";
import { $selectedDocUrls } from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import { useDatatype } from "@inkandswitch/patchwork-react";
import { ref } from "@inkandswitch/patchwork-refs";

const HistoryView = () => {
  const selectedDocUrls = useSubscribe($selectedDocUrls);

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

  const docHandle = useDocHandle(docUrl, { suspense: true });
  const docRef = useMemo(() => ref(docHandle), [docHandle]);

  // add selected view heads to global context

  console.log("viewHeads", viewHeads);

  const annotations = useMemo(() => new AnnotationSet(), []);
  useEffect(() => {
    if (!viewHeads) {
      return;
    }

    ANNOTATIONS.add(annotations);

    annotations.change(() => {
      annotations.clear();
      annotations.add(docRef, ViewHeads(viewHeads));
    });
    return () => {
      ANNOTATIONS.remove(annotations);
    };
  }, [annotations, docRef, viewHeads]);

  // load history

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
