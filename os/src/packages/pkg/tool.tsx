import { useDocument } from "@automerge/automerge-repo-react-hooks";
import React from "react";

import { Textarea } from "@/shadcn/ui/textarea";
import { EditorProps, Tool } from "@/tools";
import { view } from "@automerge/automerge";
import { get, set } from "lodash";
import { PackageDoc } from "./datatype";

export const PackageEditor: React.FC<EditorProps<unknown, unknown>> = ({
  docUrl,
  docHeads,
}: EditorProps<unknown, unknown>) => {
  const [rawPackageDoc, changeModuleDoc] = useDocument<PackageDoc>(docUrl);

  if (!rawPackageDoc) {
    return null;
  }

  const { packageJSON, fileContents } = docHeads
    ? view(rawPackageDoc, docHeads)
    : rawPackageDoc;

  const mainPath = packageJSON.main.split("/");

  const onChangeSourceCode = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    changeModuleDoc((doc) => {
      set(doc.fileContents, mainPath, {
        contentType: "application/javascript",
        contents: evt.target.value,
      });
    });
  };

  const mainSource = get(fileContents, mainPath)?.contents as string;

  return (
    <div className="p-4 w-full h-full font-mono flex flex-col">
      <div className="mb-2 text-gray-600 uppercase font-mono">Source Code</div>
      <div className="flex-1 min-h-0 overflow-auto">
        <Textarea
          className="h-full cursor-default"
          value={mainSource}
          onChange={onChangeSourceCode}
        />
      </div>
    </div>
  );
};

export const packageEditorTool: Tool = {
  type: "patchwork:tool",
  id: "pkg",
  name: "Package",
  supportedDataTypes: ["pkg"],
  EditorComponent: PackageEditor,
};
