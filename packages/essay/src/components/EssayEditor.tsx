import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { MarkdownDocEditor, TextSelection } from "./MarkdownDocEditor";

import { useEffect, useState } from "react";
import { MarkdownDoc } from "../datatype";

import { EditorView } from "@codemirror/view";

// TODO: audit the CSS being imported here;
// it should be all 1) specific to TEE, 2) not dependent on viewport / media queries
import { EditorProps } from "@patchwork/sdk";
import { uniq } from "lodash";
import "../index.css";

import { useHandleDef } from "@/hooks/useHandleDef";
import {
  TextAnchor,
  useResolvedAnnotationAtPath,
} from "@patchwork/sdk/textAnchors";
import { useAnnotationGroupsWithPosition } from "../utils";
import { CommentsSidebar } from "./CommentsSidebar";

export const EssayEditor = (props: EditorProps<TextAnchor, string>) => {
  const {
    docUrl,
    docHeads,
    annotations = [],
    annotationGroups = [],
    setSelectedAnchors = () => {},
    actorIdToAuthor,
    hideInlineComments = false,
    setSelectedAnnotationGroupId,
    setHoveredAnnotationGroupId,
    setCommentState,
    collapseContentWithoutChanges: collapseContentWithoutAnnotations,
  } = props;

  const [hasEditorFocus, setHasEditorFocus] = useState(false);
  const [selection, setSelection] = useState<TextSelection>();
  const [_doc] = useDocument<MarkdownDoc>(docUrl); // used to trigger re-rendering when the doc loads
  const handle = useHandleDef<MarkdownDoc>(docUrl);
  const [editorView, setEditorView] = useState<EditorView>();
  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(
    null
  );
  const readOnly = !!docHeads;

  const doc = docHeads && _doc ? Automerge.view(_doc, docHeads) : _doc;

  const [visibleAuthorsForEdits, setVisibleAuthorsForEdits] = useState<
    AutomergeUrl[]
  >([]);

  // If the authors on the doc change, show changes by all authors
  useEffect(() => {
    setVisibleAuthorsForEdits(uniq(Object.values(actorIdToAuthor ?? {})));
  }, [actorIdToAuthor]);

  const resolvedAnnotations = useResolvedAnnotationAtPath({
    doc,
    path: ["content"],
    annotations,
  });

  const annotationGroupsWithPosition = useAnnotationGroupsWithPosition({
    doc,
    editorView,
    editorContainer,
    annotationGroups,
  });

  if (!doc) {
    return null;
  }

  return (
    <div
      className="h-full overflow-auto min-h-0 w-full scroll-smooth"
      ref={setEditorContainer}
    >
      <div className="@container flex bg-gray-100 justify-center">
        {/* This has some subtle behavior for responsiveness.
            - We use container queries to adjust the width of the editor based on the size of our container.
            - We get the right line width by hardcoding a max-width and x-padding
            - We take over the full screen on narrow displays (showing comments on mobile is TODO)
         */}
        <div className="flex @xl:mt-4 @xl:mr-2 @xl:mb-8 @xl:ml-[-100px] @4xl:ml-[-200px] w-full @xl:w-4/5  max-w-[722px]">
          <div
            className={`w-full bg-white box-border @xl:rounded-md py-4 transition-all duration-500 ${
              readOnly
                ? "border-2 border-dashed border-gray-400"
                : "border border-gray-200 "
            }`}
          >
            <MarkdownDocEditor
              handle={handle}
              path={["content"]}
              setSelectedAnchors={setSelectedAnchors}
              setView={setEditorView}
              setSelection={setSelection}
              setHasFocus={setHasEditorFocus}
              annotations={resolvedAnnotations}
              readOnly={readOnly}
              docHeads={docHeads}
              collapseContentWithoutAnnotations={
                collapseContentWithoutAnnotations
              }
            />
          </div>
        </div>

        <CommentsSidebar
          doc={doc}
          hideInlineComments={hideInlineComments}
          handle={handle}
          selection={selection}
          readonly={readOnly}
          hasEditorFocus={hasEditorFocus}
          annotationGroupsWithPosition={annotationGroupsWithPosition}
          setSelectedAnnotationGroupId={setSelectedAnnotationGroupId}
          setHoveredAnnotationGroupId={setHoveredAnnotationGroupId}
          setCommentState={setCommentState}
        />
      </div>
    </div>
  );
};
