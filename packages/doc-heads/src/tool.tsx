import { type EditorProps, type Tool, hashToColor } from "@patchwork/sdk";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import * as Automerge from "@automerge/automerge";
import { useCallback } from "react";
import styles from "./doc-heads.module.css";

export const DocHeadsViewer = ({ docUrl }: EditorProps<unknown, never>) => {
  const [doc] = useDocument<unknown>(docUrl);
  const heads = Automerge.getHeads(doc);
  const color = hashToColor(heads[0]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(heads.join(", "));
  }, [heads]);

  return (
    <div
      className={`${styles.docHeadsViewer} cursor-pointer`}
      onClick={copyToClipboard}
    >
      <div className="flex items-center">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: color }}
        ></div>
        <span className="ml-2 font-mono">{heads[0]?.slice(0, 6)}</span>
      </div>
    </div>
  );
};

export const docHeadsTool: Tool = {
  type: "patchwork:tool",
  id: "docHeads",
  name: "Doc Heads",
  editorComponent: DocHeadsViewer,
  statusBarComponent: DocHeadsViewer,
  supportedDataTypes: "*",
};
