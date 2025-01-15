import * as Automerge from "@automerge/automerge";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { EditorProps } from "@patchwork/sdk";
import { FileDoc, isBinaryFileDoc } from "../datatype";
import { useToolUIState } from "@patchwork/sdk/router";
import { DocPath } from "@patchwork/folder";
import { clsx } from "clsx";
import { eventListenerEffect } from "@patchwork/sdk/utils";

// react-pdf doesn't make this easy
type OnPageRenderSuccess = NonNullable<
  React.ComponentProps<typeof Page>["onRenderSuccess"]
>;
type OnDocumentLoadSuccess = NonNullable<
  React.ComponentProps<typeof Document>["onLoadSuccess"]
>;

export type PDFFileDoc = FileDoc & {
  content: Uint8Array;
  type: "pdf";
};

export const isPDFFile = (file: FileDoc): file is PDFFileDoc => {
  return file?.mimeType === "application/pdf";
};

export const PDFFileViewer = ({
  docUrl,
  docHeads,
  docPath,
}: EditorProps<PDFFileDoc, never>) => {
  const [_doc] = useDocument<PDFFileDoc>(docUrl);

  const doc = useMemo(
    () => (_doc && docHeads ? Automerge.view(_doc, docHeads) : _doc),
    [docHeads, _doc]
  );

  if (!doc || !isBinaryFileDoc(doc)) {
    return;
  }

  return (
    <div className="overflow-auto h-full">
      <PDFViewer data={doc.contents} docPath={docPath} />
    </div>
  );
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

export const PDFViewer = ({
  data,
  docPath,
}: {
  data: Uint8Array;
  docPath: DocPath;
}) => {
  // TODO: why slice?
  const file = useMemo(() => ({ data: data.slice(0) }), [data]);

  /*******************************
   * Loading states, page counts *
   *******************************/

  const [numPages, setNumPages] = useState<number | undefined>();
  const [numPagesRendered, setNumPagesRendered] = useState<number>(0);

  const isLoaded = numPages !== undefined;
  const isRendered = isLoaded && numPages <= numPagesRendered;

  const onDocumentLoadSuccess: OnDocumentLoadSuccess = useCallback((pdfDoc) => {
    setNumPages(pdfDoc.numPages);
  }, []);

  const onPageRenderSuccess: OnPageRenderSuccess = useCallback(() => {
    setNumPagesRendered((old) => old + 1);
  }, []);

  /*******************
   * Container width *
   *******************/

  const [containerElem, setContainerElem] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const onContainerResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);
  useResizeObserver(containerElem, resizeObserverOptions, onContainerResize);

  /*******************
   * Scroll position *
   *******************/

  const [viewportElem, setViewportElem] = useState<HTMLElement | null>(null);

  const [toolUIState, changeToolUIState] = useToolUIState<{
    scrollTop: number;
  }>(docPath, "file", () => ({ scrollTop: 0 }));

  const [didInitialScroll, setDidInitialScroll] = useState(false);

  // Read scroll position from tool UI state (once)
  useEffect(() => {
    if (isRendered && !didInitialScroll && toolUIState && viewportElem) {
      viewportElem.scrollTo(0, toolUIState.scrollTop);
      setDidInitialScroll(true);
    }
  }, [didInitialScroll, isRendered, toolUIState, viewportElem]);

  // Write scroll position to tool UI state
  const writeScrollTimeoutRef = useRef<number | undefined>();
  useEffect(() => {
    if (isRendered && viewportElem) {
      return eventListenerEffect(viewportElem, "scroll", () => {
        if (writeScrollTimeoutRef.current !== undefined) {
          window.clearTimeout(writeScrollTimeoutRef.current);
        }
        writeScrollTimeoutRef.current = window.setTimeout(() => {
          changeToolUIState((d) => {
            d.scrollTop = viewportElem.scrollTop || 0;
          });
        }, 1000);
      });
    }
  }, [changeToolUIState, isRendered, viewportElem]);

  /******
   * UI *
   ******/

  return (
    <div
      data-debug="VIEWPORT"
      className="overflow-auto h-full"
      ref={setViewportElem}
    >
      <div
        data-debug="CONTAINER"
        className="w-full max-w-[calc(100%-2em)] m-4"
        ref={setContainerElem}
      >
        {!isLoaded ? (
          <div>Loading PDF...</div>
        ) : !isRendered ? (
          <div>
            Rendering PDF... ({numPagesRendered} / {numPages})
          </div>
        ) : null}
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
          className={clsx("flex flex-col items-center gap-2", {
            hidden: !isRendered,
          })}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={
                containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth
              }
              className="border border-gray-200"
              onRenderSuccess={onPageRenderSuccess}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};
