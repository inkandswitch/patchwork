import { Extension } from "@codemirror/state";

import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { EditorView, keymap } from "@codemirror/view";

import { completionKeymap } from "@codemirror/autocomplete";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { foldKeymap, indentOnInput, indentUnit } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { codeMonospacePlugin } from "./codemirrorPlugins/codeMonospace";
import { lineWrappingPlugin } from "./codemirrorPlugins/lineWrapping";

import { DocHandle, Repo } from "@automerge/automerge-repo";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useMemo } from "react";
import { dragAndDropFilesPlugin } from "./codemirrorPlugins/dragAndDropFiles";
import { dropCursor } from "./codemirrorPlugins/dropCursor";
import { previewImagesPlugin } from "./codemirrorPlugins/previewMarkdownImages";

import { fileHandleToServiceWorkerUrl, createDocFromFile } from "../files/";

type MarkdownPluginsConfig = { docHandle?: DocHandle<unknown> };

export const useMarkdownPlugins = ({
  docHandle,
}: MarkdownPluginsConfig): Extension[] => {
  const repo = useRepo();

  return useMemo(() => {
    return [
      history(),
      dropCursor(),
      indentOnInput(),
      keymap.of([
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      EditorView.lineWrapping,
      markdown({
        codeLanguages: languages,
      }),
      indentUnit.of("    "),
      docHandle
        ? [
            dragAndDropFilesPlugin({
              createFileReference: (file) =>
                createFileReferenceInDoc(repo, file),
            }),
            previewImagesPlugin(docHandle, repo),
          ]
        : [],
      codeMonospacePlugin,
      lineWrappingPlugin,
    ];
  }, [repo, docHandle]);
};

const createFileReferenceInDoc = async (
  repo: Repo,
  file: File
): Promise<string | undefined> => {
  const handle = await createDocFromFile(file, repo);
  return `![](${fileHandleToServiceWorkerUrl(handle)})`;
};
