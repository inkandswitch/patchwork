import { EditorProps } from "@patchwork/sdk";
import { FileDoc } from "../datatype";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

export const isLongTextFile = (doc: FileDoc): boolean => {
  return doc.content.type === "longText";
};

export const LongTextFileViewer = ({ docUrl }: EditorProps<FileDoc, never>) => {
  const [doc] = useDocument<FileDoc>(docUrl);

  if (!doc || !isLongTextFile(doc)) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
        This file is too large to edit directly. It is displayed in read-only
        mode.
      </div>
      <pre className="font-mono text-sm whitespace-pre-wrap break-words">
        {doc.content.value.toString()}
      </pre>
    </div>
  );
};
