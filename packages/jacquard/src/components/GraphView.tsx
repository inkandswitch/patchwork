import { FolderDoc } from "@/packages/folder";
import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { BuildRun, Reference } from "../datatype";

type GraphViewProps = {
  buildRuns: BuildRun[];
  projectFolderDoc: FolderDoc;
};

export const GraphView = ({ projectFolderDoc, buildRuns }: GraphViewProps) => {
  const projectState = useProjectState({
    folderDoc: projectFolderDoc,
    buildRuns,
  });

  return <pre>{JSON.stringify(projectState, null, 2)}</pre>;
};

type ProjectState = {
  references: Reference[];
  buildRuns: BuildRun[];
};

const useProjectState = ({
  folderDoc,
  buildRuns,
}: {
  folderDoc: FolderDoc;
  buildRuns: BuildRun[];
}): ProjectState => {
  const fileUrls = useMemo(
    () => (!folderDoc ? [] : folderDoc.docs.map(({ url }) => url)),
    [folderDoc?.docs]
  );
  const files = useDocuments(fileUrls);

  console.log(files);

  const references = useMemo<Reference[]>(
    () =>
      Object.entries(files).map(([id, doc]) => ({
        docUrl: `automerge:${id}` as AutomergeUrl,
        heads: Automerge.getHeads(doc),
        path: "",
      })),
    [files]
  );

  return useMemo(
    () => ({
      references,
      buildRuns,
    }),
    [buildRuns, references]
  );
};
