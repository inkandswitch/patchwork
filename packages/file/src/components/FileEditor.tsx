import { EditorProps } from "@/tools";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { FileDoc } from "../datatype";
import { useMemo } from "react";

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

  if (typeof doc.content === "string") {
    return <pre className="overflow-auto h-full p-4">{doc.content}</pre>;
  }

  if (
    doc.type === "svg" ||
    doc.type === "png" ||
    doc.type === "jpg" ||
    doc.type === "jpeg" ||
    doc.type === "gif" ||
    doc.type === "webp" ||
    doc.type === "bmp"
  ) {
    return (
      <div className="overflow-auto h-full p-4">
        <img src={binaryUrl} className="w-full h-full object-contain" />
      </div>
    );
  }

  return <div className="p-4">Unsupported binary file</div>;
};
