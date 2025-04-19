import { DocPath, DocPathUtils } from "@patchwork/sdk/router";
import {
  Icon,
  IconType,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@patchwork/sdk/ui";
import { AlertCircle } from "lucide-react";
import { createContext, useContext, useMemo } from "react";
import { NodeRendererProps } from "react-arborist";
import { NodeActiveBranchInfo } from "./NodeActiveBranchInfo";
import { Edit } from "./Edit";
import { DataType, getPluginFromRegistry } from "@patchwork/sdk";

export const FlatDocPathsContext = createContext<DocPath[]>([]);

// React Arborist expects a particular format for data: nodes with
// children. We transform our data into that format here.
export type NodeData = {
  docPath: DocPath;
  children: NodeData[];
};

export const Node = (props: NodeRendererProps<NodeData>) => {
  const { node, style, dragHandle } = props;
  const docPath = node.data.docPath;
  const docLink = DocPathUtils.toLink(docPath);
  const dataType = getPluginFromRegistry<DataType>("dataTypes", docLink.type);

  const flatDocPaths = useContext(FlatDocPathsContext);

  // We often end up in a situation where a doc that's deep in some
  // folder structure is also present at the top level, cuz it was
  // loaded that way first. This is a little feature to identify such
  // cases.
  const redundantWithPath = useMemo(() => {
    if (docPath.length > 2) {
      return;
    }

    return flatDocPaths.find((otherDocPath) => {
      if (otherDocPath.length > 2) {
        const otherDocLink = DocPathUtils.toLink(otherDocPath);
        return docLink.url === otherDocLink.url;
      }
    });
  }, [docLink.url, docPath.length, flatDocPaths]);

  let icon;
  if (docLink.type === "folder") {
    if (node.isOpen) {
      icon = "ChevronDown";
    } else {
      icon = "ChevronRight";
    }
  } else {
    icon = dataType?.icon;
  }

  return (
    <div
      style={style}
      ref={dragHandle}
      className={`flex items-center cursor-pointer text-sm py-1 w-full truncate ${
        node.isSelected
          ? " bg-gray-300 hover:bg-gray-300 text-gray-900"
          : "text-gray-600 hover:bg-gray-200"
      }`}
      onDoubleClick={() => node.edit()}
    >
      <div
        className={`${node.isSelected ? "text-gray-800" : "text-gray-500"} ${
          docLink.type === "folder" && "hover:bg-gray-400 text-gray-800"
        } p-1 mr-0.5 rounded-xs transition-all`}
        onClick={(e) => {
          if (docLink.type === "folder") {
            node.toggle();
            e.stopPropagation();
          }
        }}
      >
        <Icon type={icon as IconType} size={14} />
      </div>

      {!node.isEditing && (
        <div className="flex items-center">
          <div className="">
            {dataType ? docLink.name : `Unknown type: ${docLink.type}`}
          </div>
          {docLink.type === "folder" && (
            <div className="ml-2 text-gray-500 text-xs py-0.5 px-1.5 rounded-lg bg-gray-200">
              {node.children?.length || 0}
            </div>
          )}
          <NodeActiveBranchInfo {...props} />
          {redundantWithPath && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger className="ml-1">
                  <div className="ml-1">
                    <AlertCircle size={14} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="text-xs text-gray-500">
                  In {DocPathUtils.toLink(redundantWithPath).name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      {node.isEditing && <Edit {...props} />}
    </div>
  );
};
