import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { AmbEmbedDoc } from "./datatype";
import React from "react";

export const AmbEmbed: React.FC<EditorProps<AmbEmbedDoc, string>> = ({
  docUrl,
}) => {
  const [doc, changeDoc] = useDocument<AmbEmbedDoc>(docUrl);

  if (!doc) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      AmbEmbed
      {JSON.stringify(doc)}
    </div>
  );
};

export const tool = makeTool({
  type: "patchwork:tool",
  id: "ambEmbed",
  name: "Amb Embed",
  supportedDataTypes: ["ambEmbed"],
  EditorComponent: AmbEmbed,
});
