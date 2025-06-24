import { EditorProps } from "@patchwork/sdk";
import { EditorPropsWithTool } from "@patchwork/sdk/versionControl";

/* Wrapper component that dispatches to the tool for the doc type */
export const DocEditor = <T, V>({
  tool,
  docPath,
  docUrl,
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

  return (
    <Component
      docPath={docPath}
      docUrl={docUrl}
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
