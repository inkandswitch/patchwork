import { jsx as _jsx } from "react/jsx-runtime";
import { parseAutomergeUrl, stringifyAutomergeUrl, encodeHeads, } from "@automerge/automerge-repo";
/* Wrapper component that dispatches to the tool for the doc type */
export const DocEditor = ({ tool, docPath, docUrl, docHeads, annotations, annotationGroups, actorIdToAuthor, hideInlineComments, setSelectedAnchors, setHoveredAnchor, setSelectedAnnotationGroupId, setHoveredAnnotationGroupId, setCommentState, mainDocUrl, activeBranchUrl, collapseContentWithoutChanges, }) => {
    if (!tool) {
        return;
    }
    const Component = tool.EditorComponent;
    const docUrlWithHeads = stringifyAutomergeUrl({
        ...parseAutomergeUrl(docUrl),
        heads: docHeads ? encodeHeads(docHeads) : undefined,
    });
    return (_jsx(Component, { docPath: docPath, docUrl: docUrlWithHeads, docHeads: undefined, annotations: annotations, annotationGroups: annotationGroups, actorIdToAuthor: actorIdToAuthor, hideInlineComments: hideInlineComments, collapseContentWithoutChanges: collapseContentWithoutChanges, setSelectedAnchors: setSelectedAnchors, setHoveredAnchor: setHoveredAnchor, setSelectedAnnotationGroupId: setSelectedAnnotationGroupId, setHoveredAnnotationGroupId: setHoveredAnnotationGroupId, setCommentState: setCommentState, mainDocUrl: mainDocUrl, activeBranchUrl: activeBranchUrl }));
};
