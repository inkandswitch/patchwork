import * as Automerge from "@automerge/automerge";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { EditorProps } from "@/tools";
import { FileDoc, LinkedFileContent } from "../datatype";

export type PDFFileDoc = FileDoc & {
  content: Uint8Array;
  type: "pdf";
};

export const isPDFFile = (file: FileDoc): file is PDFFileDoc => {
  return (
    (file.content.type === "binary" || file.content.type === "link") &&
    file.type === "pdf"
  );
};

export const PDFFileViewer = ({
  docUrl,
  docHeads,
}: EditorProps<PDFFileDoc, never>) => {
  const [_doc] = useDocument<PDFFileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;
  const binaryData = doc && useBinaryDataOfDocFile(doc);

  if (!doc || !binaryData) {
    return;
  }

  return <PDFViewer data={binaryData} />;
};

const useBinaryDataOfDocFile = (doc: FileDoc) => {
  const urlRef = useRef<string>();
  urlRef.current = doc.content.type === "link" ? doc.content.url : undefined;

  const [binaryData, setBinaryData] = useState<Uint8Array>();

  useEffect(() => {
    if (doc.content.type === "binary") {
      setBinaryData(doc.content.value);
      return;
    }

    if (doc.content.type === "link" && urlRef.current) {
      setBinaryData(null);
      fetch(urlRef.current)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          if ((doc.content as LinkedFileContent).url === urlRef.current) {
            setBinaryData(new Uint8Array(buffer));
          }
        })
        .catch((error) => {
          console.error("Error fetching binary data:", error);
        });
    }
  }, [doc.content]);

  return binaryData;
};

// TODO: loading worker from global CDN because Vite import wasn't working,
// fix this.

// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   "pdfjs-dist/build/pdf.worker.min.js",
//   import.meta.url
// ).toString();

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const options = {
  cMapUrl: "/cmaps/",
  standardFontDataUrl: "/standard_fonts/",
};

const resizeObserverOptions = {};

const maxWidth = 800;

export const PDFViewer = ({ data }: { data: Uint8Array }) => {
  const [numPages, setNumPages] = useState<number>();
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const inputToViewer = useMemo(() => ({ data: data.slice(0) }), [data]);

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, resizeObserverOptions, onResize);

  // todo: get TS to understand the expected type for this callback
  function onDocumentLoadSuccess(pdfDocumentProxy: any): void {
    setNumPages(pdfDocumentProxy.numPages);
  }

  return (
    <div className="w-full max-w-[calc(100%-2em)] my-4" ref={setContainerRef}>
      <Document
        file={inputToViewer}
        onLoadSuccess={onDocumentLoadSuccess}
        options={options}
        className="flex flex-col items-center"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={
              containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth
            }
            className="border border-gray-200"
          />
        ))}
      </Document>
    </div>
  );
};
