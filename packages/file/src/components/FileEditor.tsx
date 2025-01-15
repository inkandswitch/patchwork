import { useCurrentAccount, EditorProps } from "@patchwork/sdk";
import {
  fetchFlatMap,
  fetchMap,
  useAsyncComputed,
  fetchAwaitMissing,
} from "@patchwork/sdk/async-signals";
import { useDocUIState } from "@patchwork/sdk/router";
import { TextAnchor } from "@patchwork/sdk/textAnchors";
import { fetchResolveUrlOnFixedBranch } from "@patchwork/sdk/versionControl";

import * as Automerge from "@automerge/automerge";
import { useDocument, useRepo } from "@automerge/automerge-repo-react-hooks";

import { useCallback } from "react";
import { fetchJacquardProjectInfoWithActiveBranch } from "@patchwork/jacquard/hooks";
import {
  getBuildRunsWithDocAsPrimaryInput,
  fetchProjectStateFromProjectInfo,
} from "@patchwork/jacquard/signals";
import { FileDoc, isRawStringFileDoc } from "../datatype";
import { isImageFile } from "../utils";
import { HTMLFileDoc, HTMLFileViewer, isHTMLFile } from "./HTMLFileViewer";
import { ImageFileDoc, ImageFileViewer } from "./ImageFileViewer";
import { PDFFileDoc, PDFFileViewer, isPDFFile } from "./PDFFileViewer";
import { TextFileEditor, isTextFile } from "./TextFileEditor";
import { LongTextFileViewer } from "./LongTextFileViewer";

// TODO: this should be split out into separate tools that
// for that we need to extend the suppportsDatatype mechanism and turn it into a function
// that gets passed in the content of the document so you can determine based on the content
// if this tool supports the data type

export const FileEditor = (props: EditorProps<any, any>) => {
  const { docPath, docUrl, mainDocUrl, docHeads, activeBranchUrl } = props;

  const [docUIState] = useDocUIState(docPath);

  const [_doc] = useDocument<FileDoc>(docUrl);

  const doc = _doc && docHeads ? Automerge.view(_doc, docHeads) : _doc;

  const repo = useRepo();
  const account = useCurrentAccount();

  const outputFiles = useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(account);
      const jacquardProjectInfo = fetchJacquardProjectInfoWithActiveBranch(
        docPath,
        account,
        repo
      );
      if (!jacquardProjectInfo) {
        return;
      }
      const projectState = fetchProjectStateFromProjectInfo(
        jacquardProjectInfo,
        repo
      );
      const buildRuns = getBuildRunsWithDocAsPrimaryInput(
        projectState,
        mainDocUrl
      );
      return fetchFlatMap(buildRuns, (buildRun) =>
        fetchMap(buildRun.outputs, (output) =>
          activeBranchUrl
            ? {
                ...output,
                docUrl: fetchResolveUrlOnFixedBranch(
                  output.docUrl,
                  activeBranchUrl,
                  repo
                ).url,
                mainDocUrl: output.docUrl,
              }
            : { ...output, mainDocUrl: output.docUrl }
        )
      );
    }, [account, docPath, repo, mainDocUrl, activeBranchUrl])
  ).ifPending(undefined).value;

  if (!doc) {
    return null;
  }

  return (
    <div className="h-full flex">
      <div className="overflow-auto h-full flex-1">
        {" "}
        {isTextFile(doc) ? (
          <TextFileEditor {...(props as EditorProps<TextAnchor, string>)} />
        ) : isRawStringFileDoc(doc) ? (
          <LongTextFileViewer {...(props as EditorProps<FileDoc, never>)} />
        ) : (
          <>
            {isImageFile(doc) ? (
              <ImageFileViewer
                {...(props as EditorProps<ImageFileDoc, never>)}
              />
            ) : isPDFFile(doc) ? (
              <PDFFileViewer {...(props as EditorProps<PDFFileDoc, never>)} />
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
