import { EditorProps } from "@/tools";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import { FileDoc } from "../datatype";
import { useEffect, useMemo, useState } from "react";
import * as Automerge from "@automerge/automerge";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import { JacquardBuildMetadata } from "../../../jacquard/src/datatype";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = ({ docUrl }: EditorProps<FileDoc, never>) => {
  const [doc] = useDocument<FileDoc>(docUrl);

  const binaryUrl = useMemo(() => {
    if (doc && typeof doc.content !== "string") {
      return URL.createObjectURL(new Blob([doc.content]));
    }
    return null;
  }, [doc]);

  if (!doc) {
    return null;
  }

  // todo: make more error resistant. and optimize further?
  const buildMetadataFromChange = useMemo(() => {
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
    return null;
  }, [doc]);

  const repo = useRepo();

  // janky initial logic to check staleness, can be improved further
  const [buildMetadata, setBuildMetadata] = useState<
    JacquardBuildMetadata["buildRuns"][number] | null
  >(null);
  useEffect(() => {
    (async () => {
      if (!buildMetadataFromChange) {
        setBuildMetadata(null);
        return;
      }

      const buildMetadataHandle = repo.find<JacquardBuildMetadata>(
        buildMetadataFromChange.buildDocUrl
      );
      const allBuildMetadata = await buildMetadataHandle.doc();
      const buildMetadata = allBuildMetadata.buildRuns.find(
        (build) => build.id === buildMetadataFromChange.buildId
      );

      if (!buildMetadata) {
        setBuildMetadata(null);
        return;
      }

      setBuildMetadata(buildMetadata);
    })();
  }, [buildMetadataFromChange, doc]);

  console.log({ buildMetadata });

  return (
    <>
      {buildMetadata ? (
        <div className="p-2">
          Built by {buildMetadata.command} at{" "}
          {new Date(buildMetadata.timestamp).toLocaleString()}
        </div>
      ) : null}
      {typeof doc.content === "string" ? (
        <pre className="overflow-auto h-full p-4">{doc.content}</pre>
      ) : (
        <>
          {["svg", "png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(
            doc.type
          ) ? (
            <div className="overflow-auto h-full p-4">
              <img src={binaryUrl} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="p-4">Unsupported binary file</div>
          )}
        </>
      )}
    </>
  );
};
