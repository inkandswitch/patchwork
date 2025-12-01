import type { DocHandle } from "@automerge/automerge-repo";
import type { PatchworkViewElement } from "@patchwork/elements";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import { markdownExtensions } from "@grjte/codemirror-markdown/extension";
import { CodeMirror } from "@grjte/codemirror-base/component";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";

import { javascript } from "@codemirror/lang-javascript";
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { type WorkerShape } from "@valtown/codemirror-ts/worker";
import * as Comlink from "comlink";
import {
  tsFacet,
  tsAutocomplete,
  tsGoto,
  tsHover,
  tsLinterWorker,
  tsSync,
  tsTwoslash,
} from "@valtown/codemirror-ts";
import {
  autocompletion,
  completionKeymap,
  completionStatus,
} from "@codemirror/autocomplete";
import { indentOnInput } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { search, searchKeymap } from "@codemirror/search";
import { createEffect, createSignal } from "solid-js";

const innerWorker = new Worker(
  new URL("./codemirror/worker.ts", import.meta.url),
  { type: "module" }
);
const worker = Comlink.wrap<WorkerShape>(innerWorker);
await worker.initialize();

type TextFile = {
  content: string;
  contentType: string;
  extension: string;
};

export default function TenfoldExperience(props: {
  handle: DocHandle<TextFile>;
  element: PatchworkViewElement;
}) {
  const doc = makeDocumentProjection(props.handle);
  const lang = () => {
    const match = doc.extension.match(/^(t|j)s(x)?$/);
    if (match) {
      return [
        javascript({
          jsx: match[2] == "x",
          typescript: match[0] == "t",
        }),
        tsFacet.of({
          worker,
          path: `/${props.handle.url}.${doc.extension}`,
        }),
        autocompletion({
          override: [tsAutocomplete()],
          closeOnBlur: false,
        }),
        tsSync(),
        tsGoto(),
        tsHover(),
        tsTwoslash(),
        tsLinterWorker(),
        lineNumbers(),
      ];
    }
    if (doc.extension == "md") return markdownExtensions();
    return [];
  };

  const langCompartment = new Compartment();
  const themeCompartment = new Compartment();

  const darkmatch = self.matchMedia("(prefers-color-scheme: dark)");

  const [dark, setDark] = createSignal(darkmatch.matches);

  darkmatch.onchange = function () {
    setDark(darkmatch.matches);
  };

  const theme = () => (dark() ? githubDark : githubLight);

  createEffect(() => {
    langCompartment.reconfigure(lang());
  });

  createEffect(() => {
    themeCompartment.reconfigure(theme());
  });

  const historyCompartment = new Compartment();

  return (
    <CodeMirror
      handle={props.handle}
      path={["content"]}
      extensions={[
        keymap.of([
          indentWithTab,
          {
            preventDefault: true,
            mac: "m-s",
            key: "c-s",
            run() {
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          ...searchKeymap,
        ]),
        historyCompartment.of(history()),
        themeCompartment.of(theme()),
        langCompartment.of(lang()),

        indentOnInput(),
        search({
          caseSensitive: false,
          regexp: true,
        }),
        EditorView.lineWrapping,
        EditorState.transactionFilter.of((tr) => {
          const start = completionStatus(tr.startState);
          const after = completionStatus(tr.state);
          if (
            !tr.reconfigured &&
            tr.changes.empty &&
            !tr.effects.length &&
            start == "active" &&
            !after &&
            !tr.scrollIntoView &&
            tr.startState.selection == tr.newSelection &&
            tr.selection == tr.startState.selection
          ) {
            return [];
          }

          return tr;
        }),
      ]}
    />
  );
}
