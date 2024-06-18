import { type DataType } from "@patchwork/sdk";
import { EditorProps, useToolsForDataType } from "@/os/tools";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import React, { useMemo } from "react";
import { PackageDoc, init as initPackage } from "@/packages/pkg/datatype";
import { useDocument } from "@automerge/automerge-repo-react-hooks";

type StatusBarProps = EditorProps<unknown, unknown> & {
  dataType: DataType<unknown, unknown, unknown>;
  addNewDocument: (doc: { type: string; change?: (doc: any) => void }) => void;
};

const getEmptyPackageSource = (dataType: string, doc: any) => {
  return `
import React from "react";
import {useDocument} from "@automerge/automerge-repo-react-hooks";

/*
 An example for doc:

*/

export const tool = {
  type: "patchwork:tool",
  id: "??", // todo: come up with an id
  name: "??", // todo: come up with a short name
  supportedDataTypes: ["${dataType}"],
  statusBarComponent: ({ docUrl }) => {
    const [doc] = useDocument(docUrl);

    // todo: implement

    return null
  },
};


`;
};

export const StatusBar = (props: StatusBarProps) => {
  const { dataType, addNewDocument, docUrl } = props;

  const [doc] = useDocument(docUrl);

  const tools = useToolsForDataType(dataType);
  const toolsWithStatusBarComponent = useMemo(
    () => tools.filter((tool) => tool.statusBarComponent),

    [tools]
  );

  return (
    <div className="h-8 bg-gray-100 px-2 flex items-center border-t border-gray-200">
      {toolsWithStatusBarComponent.map((tool) => (
        <div
          className={`border-r border-gray-200 px-4 relative text-sm cursor-default ${
            tool.sourceDocUrl ? "border-dashed" : ""
          }`}
        >
          {React.createElement(tool.statusBarComponent, props)}
          {tool.sourceDocUrl ? (
            <div
              style={{ transform: " translate(-10px, -60px) rotate(-5deg)" }}
              className="absolute whitespace-nowrap bg-yellow-100 border border-yellow-200 px-1 "
            >
              {(tool.sourceDocUrl as any).name}
            </div>
          ) : (
            ""
          )}
        </div>
      ))}

      {false && (
        <Button
          variant="ghost"
          onClick={() =>
            addNewDocument({
              type: "pkg",
              change: (doc) => {
                initPackage(doc);
              },
            })
          }
        >
          <PlusIcon />
        </Button>
      )}
    </div>
  );
};
