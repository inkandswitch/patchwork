import "./styles.css";
import {
  useDocHandle,
  useDocument,
} from "@automerge/automerge-repo-react-hooks";
import { getDiff } from "@patchwork/context-diff";
import { useReactive } from "@patchwork/context-react";
import { ReactToolProps, toolify } from "@patchwork/react";
import { classNames } from "@patchwork/util";

export type CounterDoc = {
  title: string;
  value: number;
};

export const CounterEditor = ({ docUrl }: ReactToolProps) => {
  const [doc, changeDoc] = useDocument<CounterDoc>(docUrl);
  const docHandle = useDocHandle<CounterDoc>(docUrl);
  const diff = useReactive(() => {
    if (!docHandle) return null;
    return getDiff(docHandle);
  });

  const setTitle = (title: string) => {
    changeDoc((doc) => {
      doc.title = title;
    });
  };

  const increment = () => {
    changeDoc((doc) => {
      doc.value = (doc.value || 0) + 1;
    });
  };

  const decrement = () => {
    changeDoc((doc) => {
      doc.value = (doc.value || 0) - 1;
    });
  };

  const reset = () => {
    changeDoc((doc) => {
      doc.value = 0;
    });
  };

  // hack: ignore
  if (!docHandle || !docHandle.doc() || !doc) {
    return null;
  }

  return (
    <div className="p-4 h-full">
      <div className="max-w-[400px] mx-auto flex flex-col gap-4 dark:bg-base-300 bg-base-100 rounded-md p-6">
        <div className="text-2xl font-bold">
          <input
            type="text"
            value={doc.title}
            className="w-full"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div
            className={classNames(
              "text-6xl font-bold py-8 px-4 rounded-lg transition-all",
              {
                "bg-green-200": diff?.type === "added",
                "bg-yellow-200": diff?.type === "changed",
              }
            )}
          >
            {doc.value}
          </div>

          <div className="flex gap-3">
            <button
              className="bg-red-500 text-white rounded-md px-6 py-3 text-xl font-bold hover:bg-red-600 transition-colors"
              onClick={decrement}
            >
              -
            </button>
            <button
              className="bg-gray-500 text-white rounded-md px-6 py-3 text-xl font-bold hover:bg-gray-600 transition-colors"
              onClick={reset}
            >
              Reset
            </button>
            <button
              className="bg-green-500 text-white rounded-md px-6 py-3 text-xl font-bold hover:bg-green-600 transition-colors"
              onClick={increment}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const renderCounterEditor = toolify(CounterEditor);

