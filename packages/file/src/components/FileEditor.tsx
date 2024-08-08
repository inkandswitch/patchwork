import { ifLoaded, useDocReactive, waitForDR } from "@/doc-reactive";
import { TextAnchor } from "@/lib/textAnchors";
import { EditorProps } from "@/tools";
import { resolveUrlOnBranch } from "@/versionControl/signals";
import * as Automerge from "@automerge/automerge";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";
import React, { useCallback } from "react";
import { useJacquardProjectInfoWithActiveBranch } from "../../../jacquard/src/hooks";
import {
  getBuildRunsWithDocAsPrimaryInput,
  getProjectStateFromProjectInfo,
} from "../../../jacquard/src/signals";
import { FileDoc } from "../datatype";
import { FitsFileDoc, FitsFileViewer, isFitsFile } from "./FitsFileViewer";
import { ImageFileDoc, ImageFileViewer, isImageFile } from "./ImageFileViewer";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { useDocUIState } from "@/explorer/uiState";
import { HTMLFileDoc, HTMLFileViewer, isHTMLFile } from "./HTMLFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<any, any>) => {
  const {
    docUrl,
    mainDocUrl,
    docHeads,
    getFakeDocPathForDocUrl,
    activeBranchUrl,
  } = props;

  const [docUIState] = useDocUIState(getFakeDocPathForDocUrl(mainDocUrl));

  const [_doc] = useDocument<FileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const repo = useRepo();

  const jacquardProjectInfo = useJacquardProjectInfoWithActiveBranch(
    getFakeDocPathForDocUrl(mainDocUrl)
  );

  const projectState = ifLoaded(
    useDocReactive(
      useCallback(() => {
        if (!jacquardProjectInfo) {
          return;
        }

        return getProjectStateFromProjectInfo(jacquardProjectInfo, repo);
      }, [jacquardProjectInfo, repo])
    )
  );

  const buildRuns = ifLoaded(
    useDocReactive(
      useCallback(() => {
        if (!projectState) {
          return;
        }
        return getBuildRunsWithDocAsPrimaryInput(projectState, mainDocUrl);
      }, [projectState, mainDocUrl])
    )
  );

  const outputFiles = ifLoaded(
    useDocReactive(
      "buildMetadataInputsOnBranch",
      useCallback(() => {
        if (!buildRuns) {
          return;
        }
        return buildRuns.flatMap((buildRun) =>
          buildRun.outputs.map((output) =>
            activeBranchUrl
              ? {
                  ...output,
                  docUrl: resolveUrlOnBranch(
                    output.docUrl,
                    activeBranchUrl,
                    repo
                  ).url,
                  mainDocUrl: output.docUrl,
                }
              : { ...output, mainDocUrl: output.docUrl }
          )
        );
      }, [activeBranchUrl, repo, buildRuns])
    )
  );

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full flex">
      <div className="overflow-auto h-full flex-1">
        {" "}
        {isTextFile(doc) ? (
          <TextFileEditor {...(props as EditorProps<TextAnchor, string>)} />
        ) : (
          <>
            {isImageFile(doc) ? (
              <ImageFileViewer
                {...(props as EditorProps<ImageFileDoc, never>)}
              />
            ) : isPDFFile(doc) ? (
              <PDFFileViewer {...(props as EditorProps<PDFFileDoc, never>)} />
            ) : isFitsFile(doc) ? (
              <FitsFileViewer {...(props as EditorProps<FitsFileDoc, never>)} />
            ) : isHTMLFile(doc) ? (
              <HTMLFileViewer {...(props as EditorProps<HTMLFileDoc, never>)} />
            ) : (
              <div className="p-4">No preview for file</div>
            )}
          </>
        )}
      </div>
      {docUIState.mainViewMode === "showOutputs" && (
        <div className="flex-1 overflow-auto border-l border-gray-200">
          {outputFiles
            ? outputFiles.map(({ docUrl, mainDocUrl }) => (
                <FileEditor
                  key={docUrl}
                  {...props}
                  docUrl={docUrl}
                  mainDocUrl={mainDocUrl}
                />
              ))
            : "Loading..."}
        </div>
      )}
    </div>
  );
};
