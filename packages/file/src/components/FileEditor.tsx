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
import { useMemo } from "react";
import { JacquardBuildMetadata } from "../../../jacquard/src/datatype";
import { FileDoc } from "../datatype";
import { ImageFileViewer, isImageFile } from "./ImageFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = ({
  docUrl,
  docHeads,
}: EditorProps<FileDoc, never>) => {
  const [_doc] = useDocument<FileDoc>(docUrl);

  const doc = docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const buildMetadata = useBuildMetadata(doc);
  const isStale = useIsStale(buildMetadata?.inputs ?? []);

  if (!doc) {
    return null;
  }

  return (
    <div className="overflow-auto h-full p-4">
      {!docHeads && (
        <>
          {buildMetadata ? (
            <div className="p-2">
              Built by {buildMetadata.command} at{" "}
              {new Date(buildMetadata.timestamp).toLocaleString()}
            </div>
          ) : null}

          {buildMetadata && buildMetadata.inputs.length > 0 && (
            <div>
              depends on:{" "}
              {buildMetadata?.inputs.map(({ path }) => path).join(",")}
              {isStale ? (
                <div className="text-yellow-500">stale</div>
              ) : (
                <div>up to date</div>
              )}
            </div>
          )}
        </>
      )}
      {typeof doc.content === "string" ? (
        <pre>{doc.content}</pre>
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
};

const useBuildMetadata = (doc: Automerge.Doc<unknown>) => {
  // todo: make more error resistant. and optimize further?
  const { buildDocUrl, buildId } = useMemo(() => {
    if (!doc) {
      return { buildDocUrl: null, buildId: null };
    }

    const changes = Automerge.getAllChanges(doc);
    const lastChange = changes[changes.length - 1];
    const lastChangeDecoded = Automerge.decodeChange(lastChange);
    const lastChangeMetadata =
      lastChangeDecoded.message && JSON.parse(lastChangeDecoded.message);
    if (lastChangeMetadata && lastChangeMetadata["buildDocUrl"]) {
      return lastChangeMetadata as {
        buildDocUrl: AutomergeUrl;
        buildId: string;
      };
    }
    return { buildDocUrl: null, buildId: null };
  }, [doc]);

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
