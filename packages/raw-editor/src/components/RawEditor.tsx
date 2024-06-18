import React, { useState, useCallback, useEffect } from "react";
import ReactDom from "react-dom/client";
import ReactJson from "@microlink/react-json-view";
// import { isValidAutomergeUrl } from "@automerge/automerge-repo"
import {
  RepoContext,
  useDocument,
  useHandle,
} from "@automerge/automerge-repo-react-hooks";
import "react-error-boundary";
import { html } from "htm/react";
import * as Automerge from "@automerge/automerge";

import {
  FileIcon,
  FilePlusIcon,
  Cross2Icon,
  Share1Icon,
} from "@radix-ui/react-icons";

function isServiceWorkerUrl(url) {
  return url.match(/^(.*)\/automerge-repo\/automerge:\w+\/(.*)/);
}

// faked to avoid dependency
function isValidAutomergeUrl(url) {
  return url.match(/^automerge:(.*)/);
}

function parseServiceWorkerUrl(url) {
  const { docUrl } = url.match(
    /^(.*)\/automerge-repo\/(?<docUrl>automerge:\w+)\/(.*)/
  ).groups;
  return docUrl;
}

export const RawEditor = ({ docUrl: originalDocumentUrl }) => {
  const [documentUrl, changeDocumentUrl] = useState(originalDocumentUrl);
  const [history, setHistory] = useState([]); // TODO: make these actual navigation effects? knapsack's design makes this tricky.

  const [doc, changeDoc] = useDocument(documentUrl);
  const handle = useHandle(documentUrl);

  const onSelectAutomergeUrl = useCallback(
    (url) => {
      setHistory([documentUrl, ...history]);
      changeDocumentUrl(url);
    },
    [history, setHistory, changeDocumentUrl]
  );

  const goBack = useCallback(() => {
    if (history.length === 0) {
      return;
    }
    const [url, ...rest] = history;
    setHistory(rest);
    changeDocumentUrl(url);
  }, [history, setHistory, changeDocumentUrl]);

  const onEdit = useCallback(
    ({ namespace, new_value, name }) => {
      changeDoc(function (doc) {
        let current = doc;
        for (
          let _i = 0, namespace_1 = namespace;
          _i < namespace_1.length;
          _i++
        ) {
          const key = namespace_1[_i];
          current = current[key];
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
    function ({ namespace, name }) {
      changeDoc(function (doc) {
        let current = doc;
        for (
          let _i = 0, namespace_2 = namespace;
          _i < namespace_2.length;
          _i++
        ) {
          const key = namespace_2[_i];
          current = current[key];
        }
        delete current[name];
      });
    },
    [changeDoc]
  );

  const onSelect = useCallback(function (arg) {
    console.log("select", arg);
    const { value } = arg;
    if (!(typeof value === "string")) {
      return;
    }

    if (isValidAutomergeUrl(value)) {
      onSelectAutomergeUrl(value);
    } else if (isServiceWorkerUrl(value)) {
      onSelectAutomergeUrl(parseServiceWorkerUrl(value));
    }
  }, []);

  // lifted from https://gist.github.com/davalapar/d0a5ba7cce4bc599f54800da22926da2
  const onDownloadDoc = useCallback(
    function () {
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
    return html`<div>Loading ${documentUrl}...</div>`;
  }

  return html`
    <h2 style=${{ fontWeight: "bold" }}>doc url: ${documentUrl}</h2>
    <button onClick=${goBack} disabled=${history.length === 0}>Back</button>
    <${ReactJson}
      collapsed="3"
      src=${doc}
      onEdit=${onEdit}
      onAdd=${onAdd}
      onDelete=${onDelete}
      onSelect=${onSelect}
    />
    <button onClick=${onDownloadDoc}>
      Download Automerge binary document.
    </button>
  `;
};
