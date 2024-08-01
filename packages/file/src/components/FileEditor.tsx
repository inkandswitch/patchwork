import { getDR, ifLoaded, useDocReactive, waitForDR } from "@/doc-reactive";
import { TextAnchor } from "@/lib/textAnchors";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { EditorProps } from "@/tools";
import * as Automerge from "@automerge/automerge";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import React, { useCallback, useState } from "react";
import {
  BuildRefreshButton,
  DisabledBuildRefreshButton,
} from "../../../jacquard/src/components/BuildRefreshButton";
import {
  getLastBuildRun,
  getProjectStateFromProjectInfo,
} from "../../../jacquard/src/signals";
import { FileDoc } from "../datatype";
import { ImageFileDoc, ImageFileViewer, isImageFile } from "./ImageFileViewer";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { resolveUrlOnBranch } from "@/versionControl/signals";
import { useJacquardProjectInfoWithActiveBranch } from "../../../jacquard/src/hooks";
import { getStalenessInfo } from "../../../jacquard/src/getStalenessInfo";
import { getRelativeTimeString } from "@/lib/dates";
import { FitsFileDoc, FitsFileViewer, isFitsFile } from "./FitsFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<unknown, unknown>) => {
  const {
    docUrl,
    docHeads,
    getFakeDocPathForDocUrl,
    mainDocUrl,
    activeBranchUrl,
  } = props;

  const [_doc] = useDocument<FileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const repo = useRepo();

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="overflow-auto h-full">
        {" "}
        {isTextFile(doc) ? (
          React.createElement(
            TextFileEditor,
            props as EditorProps<TextAnchor, string>
          )
        ) : (
          <>
            {isImageFile(doc) ? (
              <div className="overflow-auto h-full p-4">
                {React.createElement(
                  ImageFileViewer,
                  props as EditorProps<ImageFileDoc, never>
                )}
              </div>
            ) : isPDFFile(doc) ? (
              <div className="overflow-auto h-full">
                {React.createElement(
                  PDFFileViewer,
                  props as EditorProps<PDFFileDoc, never>
                )}
              </div>
            ) : isFitsFile(doc) ? (
              <div className="overflow-auto h-full p-4">
                {React.createElement(
                  FitsFileViewer,
                  props as EditorProps<FitsFileDoc, never>
                )}
              </div>
            ) : (
              <div className="p-4">No preview for file</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
