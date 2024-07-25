import React, { useCallback } from "react";
import { EditorProps } from "@/tools";
import * as Automerge from "@automerge/automerge";
import {
  parseAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
  useRepo,
} from "@automerge/automerge-repo-react-hooks";
import { useMemo, useState } from "react";
import { JacquardBuildMetadata } from "../../../jacquard/src/datatype";
import { FileDoc } from "../datatype";
import { ImageFileDoc, ImageFileViewer, isImageFile } from "./ImageFileViewer";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextAnchor } from "@/lib/textAnchors";
import { ifLoaded } from "@/doc-reactive";
import { getLastBuildRun } from "../../../jacquard/src/signals";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<unknown, unknown>) => {
  const { docUrl, docHeads, getFakeDocPathForDocUrl, mainDocUrl } = props;
  const [_doc] = useDocument<FileDoc>(docUrl);
  const [showSourceFiles, setShowDependencies] = useState(false);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const repo = useRepo();
  const buildMetadata = ifLoaded(getLastBuildRun(docUrl, repo, docHeads))


  if (!doc) {
    return null;
  }

  const fileView = (
    <div>
      {isTextFile(doc) ? (
        React.createElement(
          TextFileEditor,
          props as EditorProps<TextAnchor, string>
        )
      ) : (
        <>
          {isImageFile(doc) ? (
            <div className="overflow-auto h-full p-4">
              {React.createElement(
                ImageFileViewer,
                props as EditorProps<ImageFileDoc, never>
              )}
            </div>
          ) : isPDFFile(doc) ? (
            <div className="overflow-auto h-full">
              {React.createElement(
                PDFFileViewer,
                props as EditorProps<PDFFileDoc, never>
              )}
            </div>
          ) : (
            <div className="p-4">No preview for binary file</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* <div className="flex flex-col">
        <div>docUrl: {docUrl}</div>
        <div>mainDocUrl: {mainDocUrl}</div>
      </div> */}
      {buildMetadata && (
        <div className="bg-gray-100 pl-4 pt-3 pb-3 flex gap-2 items-center border-b border-gray-200 justify-between">
          <div>
            Built by{" "}
            <span className="font-mono text-gray-500">
              {buildMetadata.command}
            </span>{" "}
            at {new Date(buildMetadata.timestamp).toLocaleString()}{" "}
            {/*isStale && !docHeads && (
              <span className="rounded px-1 bg-orange-300">stale</span>
            )*/}
          </div>

          <div className="flex items-center mr-1">
            <Checkbox
              id="diff-overlay-checkbox"
              className="mr-1"
              checked={showSourceFiles}
              onCheckedChange={() => setShowDependencies((flag) => !flag)}
            />
            <label htmlFor="diff-overlay-checkbox">show source files</label>
          </div>
        </div>
      )}

      <div className="overflow-auto h-full">
        {showSourceFiles &&
          buildMetadata &&
          buildMetadata.inputs.map((input) => (
            <div>
              <div className="flex border-t border-gray-200 p-2">
                <div className="rounded-md px-1  text-gray-500  border border-gray-500">
                  {input.path}
                </div>
              </div>
              <div className="max-h-[200px] overflow-auto">
                <FileEditor
                  docUrl={input.docUrl}
                  docHeads={input.heads}
                  getFakeDocPathForDocUrl={getFakeDocPathForDocUrl}
                  mainDocUrl={mainDocUrl}
                />
              </div>
            </div>
          ))}

        {showSourceFiles ? (
          <div>
            <div className="flex border-t border-gray-200 p-2">
              <div className="rounded-md px-1  text-gray-500  border border-gray-500">
                {doc.name}
              </div>
            </div>
            {fileView}
          </div>
        ) : (
          fileView
        )}
      </div>
    </div>
  );
};


interface DocUrlAtHeads {
  docUrl: AutomergeUrl;
  heads: Automerge.Heads;
}

/* pass in a list of doc urls at some heads to monitor if the docs are still at these heads
 * returns true if the most recent versions of all documents is at the specified heads, otherwise false
 */
const useIsStale = (docUrlsAtHeads: DocUrlAtHeads[]) => {
  const urls = useMemo(
    () => docUrlsAtHeads.map(({ docUrl }) => docUrl),
    [docUrlsAtHeads]
  );

  const docsById = useDocuments(urls);

  return useMemo(() => {
    if (docUrlsAtHeads.length === 0) {
      return false;
    }

    return docUrlsAtHeads.some(({ docUrl, heads }) => {
      const { documentId } = parseAutomergeUrl(docUrl);
      const doc = docsById[documentId];

      return doc && !Automerge.equals(Automerge.getHeads(doc), heads);
    });
  }, [docsById, docUrlsAtHeads]);
};
