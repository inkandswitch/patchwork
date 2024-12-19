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
  actorIdToAuthor,
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

  const Component = tool.EditorComponent as React.FC<EditorProps<T, V>>;

  return (
    <Component
      docPath={docPath}
      docUrl={docUrl}
      docHeads={docHeads}
      annotations={annotations}
      annotationGroups={annotationGroups}
      actorIdToAuthor={actorIdToAuthor}
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
