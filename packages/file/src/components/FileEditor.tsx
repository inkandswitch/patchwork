import { EditorProps } from "@patchwork/sdk";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

import { isRawStringFileDoc } from "../datatype";
import { FileDoc } from "../types";
import { isImageFile } from "../utils";
import { HTMLFileDoc, HTMLFileViewer, isHTMLFile } from "./HTMLFileViewer";
import { ImageFileDoc, ImageFileViewer } from "./ImageFileViewer";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { LongTextFileViewer } from "./LongTextFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<any, any>) => {
  const [doc] = useDocument<FileDoc>(props.docUrl);

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full flex">
      <div className="overflow-auto h-full flex-1">
        {isTextFile(doc) && !isRawStringFileDoc(doc) ? (
          <TextFileEditor {...(props as EditorProps<TextAnchor, string>)} />
        ) : isTextFile(doc) && isRawStringFileDoc(doc) ? (
          <LongTextFileViewer {...(props as EditorProps<FileDoc, never>)} />
        ) : (
          <>
            {isImageFile(doc) ? (
              <ImageFileViewer
                {...(props as EditorProps<ImageFileDoc, never>)}
              />
            ) : isPDFFile(doc) ? (
              <PDFFileViewer {...(props as EditorProps<PDFFileDoc, never>)} />
            ) : isHTMLFile(doc) ? (
              <HTMLFileViewer {...(props as EditorProps<HTMLFileDoc, never>)} />
            ) : (
              <div className="p-4">No preview for file</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
