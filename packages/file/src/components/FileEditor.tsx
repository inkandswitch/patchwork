import { EditorProps } from "@/tools";
import * as Automerge from "@automerge/automerge";
import {
  parseAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
} from "@automerge/automerge-repo-react-hooks";
import { useMemo, useState } from "react";
import { JacquardBuildMetadata } from "../../../jacquard/src/datatype";
import { FileDoc } from "../datatype";
import { ImageFileViewer, isImageFile } from "./ImageFileViewer";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { TextFileEditor } from "./TextFileEditor";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = ({
  docUrl,
  docHeads,
}: EditorProps<FileDoc, never>) => {
  const [_doc] = useDocument<FileDoc>(docUrl);
  const [showSourceFiles, setShowDependencies] = useState(false);

  const doc = docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const buildMetadata = useBuildMetadata(doc, docHeads);
  const isStale = useIsStale(buildMetadata?.inputs ?? []);

  if (!doc) {
    return null;
  }

  const fileView = (
    <div className="p-4">
      {typeof doc.content === "string" ? (
        <TextFileEditor docUrl={docUrl} docHeads={docHeads} />
      ) : (
        <>
          {isImageFile(doc) ? (
            <div className="overflow-auto h-full p-4">
              <ImageFileViewer doc={doc} />
            </div>
          ) : (
            <div className="p-4">No preview binary file</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {buildMetadata && (
        <div className="bg-gray-100 pl-4 pt-3 pb-3 flex gap-2 items-center border-b border-gray-200 justify-between">
          <div>
            Built by{" "}
            <span className="font-mono text-gray-500">
              {buildMetadata.command}
            </span>{" "}
            at {new Date(buildMetadata.timestamp).toLocaleString()}{" "}
            {isStale && !docHeads && (
              <span className="text-gray-500">(stale)</span>
            )}
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
                <FileEditor docUrl={input.docUrl} docHeads={input.heads} />
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

const useBuildMetadata = (
  doc: Automerge.Doc<unknown>,
  heads?: Automerge.Heads
) => {
  // todo: make more error resistant. and optimize further?
  const { buildDocUrl, buildId } = useMemo(() => {
    if (!doc) {
      return { buildDocUrl: null, buildId: null };
    }

    const changes = Automerge.getAllChanges(
      heads ? Automerge.view(doc, heads) : doc
    );

    // todo: handle heads with size > 1
    // go back in history until we find a change that matches the current head
    let lastChangeDecoded;
    do {
      const lastChange = changes.pop();
      if (!lastChange) {
        break;
      }
      const decodedChange = Automerge.decodeChange(lastChange);
      if (!heads || heads[0] === decodedChange.hash) {
        lastChangeDecoded = decodedChange;
      }
    } while (heads && !lastChangeDecoded);

    console.log({ lastChangeDecoded, heads });
    const lastChangeMetadata =
      lastChangeDecoded.message && JSON.parse(lastChangeDecoded.message);
    if (lastChangeMetadata && lastChangeMetadata["buildDocUrl"]) {
      return lastChangeMetadata as {
        buildDocUrl: AutomergeUrl;
        buildId: string;
      };
    }
    return { buildDocUrl: null, buildId: null };
  }, [doc, heads]);

  const [buildDoc] = useDocument<JacquardBuildMetadata>(buildDocUrl);

  return useMemo(() => {
    if (!buildId || !buildDoc || !doc) {
      return;
    }

    return buildDoc.buildRuns.find(({ id }) => buildId === id);
  }, [buildId, buildDoc]);
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
