import { useDocument } from "@automerge/automerge-repo-react-hooks";
import React, { useMemo } from "react";

import { Textarea } from "@/shadcn/ui/textarea";
import { EditorProps, Tool } from "@/tools";
import { view } from "@automerge/automerge";
import { get, set } from "lodash";
import { PackageDoc } from "./datatype";

export const PackageEditor: React.FC<EditorProps<never, never>> = ({
  docUrl,
  docHeads,
}: EditorProps<never, never>) => {
  const [rawPackageDoc, changeModuleDoc] = useDocument<PackageDoc>(docUrl);

  if (!rawPackageDoc) {
    return null;
  }

  const { packageJSON, fileContents } = docHeads
    ? view(rawPackageDoc, docHeads)
    : rawPackageDoc;
  const mainPath = useMemo(
    () => packageJSON.main.split("/"),
    [packageJSON.main]
  );

  const onChangeSourceCode = (evt) => {
    changeModuleDoc((doc) => {
      set(doc.fileContents, mainPath, {
        contentType: "application/javascript",
        contents: evt.target.value,
      });
    });
  };

  const mainSource = useMemo<string>(() => {
    return get(fileContents, mainPath)?.contents as string;
  }, [mainPath, fileContents]);

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
  editorComponent: PackageEditor,
};
