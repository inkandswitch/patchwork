import { DocPathUtils } from "@patchwork/folder";
import { useRef, useEffect } from "react";
import { NodeRendererProps } from "react-arborist";
import { NodeData } from "./Node";

export const Edit = ({ node }: NodeRendererProps<NodeData>) => {
  const input = useRef<any>();
  const docPath = node.data.docPath;
  const docLink = DocPathUtils.toLink(docPath);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  return (
    <input
      ref={input}
      defaultValue={docLink.name}
      onBlur={() => node.reset()}
      onKeyDown={(e) => {
        if (e.key === "Escape") node.reset();
        if (e.key === "Enter") node.submit(input.current?.value || "");
      }}
    ></input>
  );
};
