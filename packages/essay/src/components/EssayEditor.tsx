import * as Automerge from "@automerge/automerge";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { MarkdownDocEditor, TextSelection } from "./MarkdownDocEditor";

import { useEffect, useState } from "react";
import { MarkdownDoc } from "../datatype";

import { EditorView } from "@codemirror/view";

// TODO: audit the CSS being imported here;
// it should be all 1) specific to TEE, 2) not dependent on viewport / media queries
import { EditorProps } from "@patchwork/sdk";
import { uniq } from "lodash";
import "../index.css";

import {
  TextAnchor,
  useResolvedAnnotationAtPath,
} from "@patchwork/sdk/textAnchors";
import { useAnnotationGroupsWithPosition } from "../utils";
import { CommentsSidebar } from "./CommentsSidebar";
import { useThrottle } from "@uidotdev/usehooks";

const path = ["content"];

// This is a custom hook that conditionally applies throttling to a value.
// It's used to prevent the comment resolution from being a performance bottleneck.
// We only want to throttle when the doc has a throttleCommentResolution property --
// otherwise just return the unthrottled value.
function useMaybeThrottled<T>(value: T, time?: number): T {
  const throttledValue = useThrottle(value, time ?? 0);
  return time !== undefined ? throttledValue : value;
}

export const EssayEditor = (props: EditorProps<TextAnchor, string>) => {
  const {
    docUrl,
    docHeads,
    annotations = [],
    annotationGroups = [],
    setSelectedAnchors = () => {},
    hideInlineComments = false,
    setSelectedAnnotationGroupId,
    setHoveredAnnotationGroupId,
    setCommentState,
    collapseContentWithoutChanges: collapseContentWithoutAnnotations,
  } = props;

  const [hasEditorFocus, setHasEditorFocus] = useState(false);
  const [selection, setSelection] = useState<TextSelection>();
  const [_doc] = useDocument<MarkdownDoc>(docUrl); // used to trigger re-rendering when the doc loads
  const handle = useDocHandle<MarkdownDoc>(docUrl);
  const [editorView, setEditorView] = useState<EditorView>();
  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(
    null
  );
  const readOnly = !!docHeads;

  const doc = docHeads && _doc ? Automerge.view(_doc, docHeads) : _doc;

  // HACK: comment resolution is a perf bottleneck for large documents with lots of comments.
  // To workaround, you can set a throttle time on the doc: only resolve comments once every X ms.
  // Setting this to 500 or 1000 makes keystroke latency feel much better.
  // The tradeoff is that comments lag behind the text and some interactions w/ comments will feel laggy.
  // @ts-ignore
  const throttleTime = doc?.throttleCommentResolution as number | undefined;
  const docToUse = useMaybeThrottled(doc, throttleTime);
  const annotationsToUse = useMaybeThrottled(annotations, throttleTime);
  const annotationGroupsToUse = useMaybeThrottled(
    annotationGroups,
    throttleTime
  );

  const resolvedAnnotations = useResolvedAnnotationAtPath({
    doc: docToUse,
    path,
    annotations: annotationsToUse,
  });

  const annotationGroupsWithPosition = useAnnotationGroupsWithPosition({
    doc: docToUse,
    editorView,
    editorContainer,
    annotationGroups: annotationGroupsToUse,
  });

  if (!doc || !handle) {
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
            data-testid="essay-editor"
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
