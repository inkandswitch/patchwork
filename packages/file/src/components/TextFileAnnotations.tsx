import { truncate } from "lodash";
import { AnnotationsViewProps } from "@/tools";
import { FileDoc } from "../datatype";
import { TextAnchor } from "@/lib/textAnchors";

export const TextFileAnnotations = ({
  annotations,
}: AnnotationsViewProps<FileDoc, TextAnchor, string>) => {
  return (
    <div className="px-2 bg-white rounded-sm cursor-default">
      {annotations.map((annotation, index) => {
        switch (annotation.type) {
          case "added":
            return (
              <div
                className="text-sm whitespace-nowrap overflow-ellipsis overflow-hidden"
                key={index}
              >
                <span className="font-mono bg-green-50 border-b border-green-400">
                  {annotation.added.replace(/ /g, "\u00A0")}
                </span>
              </div>
            );

          case "deleted":
            return (
              <div
                className="text-sm whitespace-nowrap overflow-ellipsis overflow-hidden"
                key={index}
              >
                {annotation.deleted.trim() !== "" ? (
                  <span className="font-mono bg-red-50 border-b border-red-400">
                    {annotation.deleted}
                  </span>
                ) : (
                  <span className="font-sans bg-red-50 text-xs italic text-gray-500">
                    deleted spaces
                  </span>
                )}
              </div>
            );

          case "changed":
            return (
              <div className="text-sm" key={index}>
                <span className="font-mono bg-red-50 border-b border-red-400">
                  {truncate(annotation.before.replace(/ /g, "\u00A0"), {
                    length: 45,
                  })}
                </span>{" "}
                →{" "}
                <span className="font-mono bg-green-50 border-b border-green-400">
                  {truncate(annotation.after.replace(/ /g, "\u00A0"), {
                    length: 45,
                  })}
                </span>
              </div>
            );

          case "highlighted":
            // don't show render highlight annotation if matches exactly with added annotation
            // this is a bit hacky patchwork should handle this for us
            if (
              annotations.some(
                (a) =>
                  (a.type === "added" && a.added === annotation.value) ||
                  (a.type === "changed" && a.after === annotation.value)
              )
            ) {
              return null;
            }

            return (
              <div
                className="text-sm whitespace-nowrap overflow-ellipsis overflow-hidden"
                key={index}
              >
                <span className="font-mono bg-yellow-50 border-b border-yellow-400">
                  {annotation.value}
                </span>
              </div>
            );
        }
      })}
    </div>
  );
};
