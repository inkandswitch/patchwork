import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import ReactJson, { InteractionProps } from "@microlink/react-json-view";
import { useCallback, useState } from "react";
import styles from "../rawEditor.module.css";

export const RawEditor = ({
  docUrl: originalDocumentUrl,
}: {
  docUrl: AutomergeUrl;
}) => {
  const [documentUrl, changeDocumentUrl] = useState(originalDocumentUrl);
  const [history, setHistory] = useState<AutomergeUrl[]>([]); // TODO: make these actual navigation effects? knapsack's design makes this tricky.

  const [doc, changeDoc] = useDocument(documentUrl);
  const handle = useHandle(documentUrl);

  const onSelectAutomergeUrl = useCallback(
    (url: AutomergeUrl) => {
      setHistory([documentUrl, ...history]);
      changeDocumentUrl(url);
    },
    [history, setHistory, changeDocumentUrl]
  );

  const onEdit = useCallback(
    ({ namespace, new_value, name }: InteractionProps) => {
      changeDoc(function (doc) {
        let current: any = doc;

        for (const key of namespace) {
          if (key === null) {
            console.error("faild to update property");
            return;
          }
          current = current[key];
        }

        if (!name) {
          console.error("failed to update property");
          return;
        }

        current[name] = new_value;
      });
    },
    [changeDoc]
  );

  const onAdd = useCallback(function () {
    return true;
  }, []);

  const onDelete = useCallback(
    function ({ namespace, name }: InteractionProps) {
      changeDoc(function (doc) {
        let current: any = doc;

        for (const key of namespace) {
          if (key === null) {
            console.error("faild to delete property");
            return;
          }
          current = current[key];
        }

        if (!name) {
          console.error("failed to delete property");
          return;
        }

        delete current[name];
      });
    },
    [changeDoc]
  );

  const onSelect = useCallback(function (arg: unknown) {
    console.log("select", arg);
    /*const { value } = arg;
    if (!(typeof value === "string")) {
      return;
    }

    if (isValidAutomergeUrl(value)) {
      onSelectAutomergeUrl(value);
    } else if (isServiceWorkerUrl(value)) {
      onSelectAutomergeUrl(parseServiceWorkerUrl(value));
    }*/
  }, []);

  // lifted from https://gist.github.com/davalapar/d0a5ba7cce4bc599f54800da22926da2
  const onDownloadDoc = useCallback(
    function () {
      if (!doc || !handle) {
        throw new Error("No document or handle found");
      }
      const data = Automerge.save(doc);
      const filename = `${handle.documentId}.automerge`;
      const blobURL = URL.createObjectURL(
        new Blob([data], { type: "application/octet-stream" })
      );

      const tempLink = document.createElement("a");
      tempLink.style.display = "none";
      tempLink.href = blobURL;
      tempLink.setAttribute("download", filename);

      if (typeof tempLink.download === "undefined") {
        tempLink.setAttribute("target", "_blank");
      }

      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => {
        window.URL.revokeObjectURL(blobURL);
      }, 100);
    },
    [doc]
  );

  if (!doc) {
    return <div>Loading {documentUrl}...</div>;
  }

  return (
    <div className={`${styles.rawEditor} p-2 h-full overflow-auto`}>
      <ReactJson
        collapsed={3}
        src={doc}
        onEdit={onEdit}
        onAdd={onAdd}
        onDelete={onDelete}
        onSelect={onSelect}
      />
    </div>
  );
};
