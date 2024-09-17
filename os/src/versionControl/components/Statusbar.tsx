import { EditorProps, Tool } from "@/tools";
import { type DataType } from "@/sdk";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useToolsForDataType } from "@/allTheTools";

type StatusBarProps = EditorProps<unknown, unknown> & {
  dataType: DataType<unknown, unknown, unknown> | undefined;
  addNewDocument: (doc: { type: string; change?: (doc: any) => void }) => void;
};

export const StatusBar = (props: StatusBarProps) => {
  const { dataType } = props;
  const tools = useToolsForDataType(dataType);
  const toolsWithStatusBarComponent = useMemo(
    () => tools.filter((tool) => tool.StatusBarComponent),

    [tools]
  );

  return (
    <div className="h-8 bg-gray-100 px-2 flex items-center border-t border-gray-200">
      {toolsWithStatusBarComponent.map((tool) => (
        <StatusBarItem tool={tool} editorProps={props} />
      ))}
    </div>
  );
};

type StatusBarItemProps = {
  tool: Tool;
  editorProps: EditorProps<unknown, unknown>;
};

const StatusBarItem = ({ editorProps, tool }: StatusBarItemProps) => {
  return (
    <div
      className={`border-r border-gray-200 px-4 relative text-sm cursor-default ${
        tool.sourceDocUrl ? "border-dashed" : ""
      }`}
    >
      <ErrorBoundary
        key={tool.StatusBarComponent.toString()}
        FallbackComponent={() => null}
        onError={(error) => {
          console.error("Statusbar item crashed with the error above ^");
        }}
      >
        <tool.StatusBarComponent {...editorProps} />
      </ErrorBoundary>
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
  );
};
