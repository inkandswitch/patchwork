import {
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  encodeHeads,
} from "@automerge/automerge-repo";
import { EditorProps } from "@patchwork/sdk";
import { EditorPropsWithTool } from "@patchwork/sdk/versionControl";

/* Wrapper component that dispatches to the tool for the doc type */
export const DocEditor = <T, V>({
  tool,
  docPath,
  docUrl,
  docHeads,
  annotations,
  annotationGroups,
  hideInlineComments,
  setSelectedAnchors,
  setHoveredAnchor,
  setSelectedAnnotationGroupId,
  setHoveredAnnotationGroupId,
  setCommentState,
  mainDocUrl,
  activeBranchUrl,
  collapseContentWithoutChanges,
}: EditorPropsWithTool<T, V>) => {
  if (!tool) {
    return;
  }

  const Component = tool.module.EditorComponent as React.FC<EditorProps<T, V>>;

  const docUrlWithHeads = stringifyAutomergeUrl({
    ...parseAutomergeUrl(docUrl),
    heads: docHeads ? encodeHeads(docHeads) : undefined,
  });

  return (
    <Component
      docPath={docPath}
      docUrl={docUrlWithHeads}
      docHeads={docHeads}
      annotations={annotations}
      annotationGroups={annotationGroups}
      hideInlineComments={hideInlineComments}
      collapseContentWithoutChanges={collapseContentWithoutChanges}
      setSelectedAnchors={setSelectedAnchors}
      setHoveredAnchor={setHoveredAnchor}
      setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
      setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
      setCommentState={setCommentState}
      mainDocUrl={mainDocUrl}
      activeBranchUrl={activeBranchUrl}
    />
  );
};
