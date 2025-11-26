import type { AutomergeUrl, Doc, DocHandle } from "@automerge/automerge-repo";
import type { Tenfold } from "./index.tsx";
import type { PatchworkViewElement } from "@patchwork/elements";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import { CodeMirror } from "@grjte/codemirror-base/component";
import createTenfold, { type CreateTenfoldOptions } from "./tenfold/tenfold.ts";
import { createStore, produce } from "solid-js/store";
import {
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
  Suspense,
} from "solid-js";
import font from "./font.txt?raw";
import { javascript } from "@codemirror/lang-javascript";
import { noirTheme } from "./codemirror/theme.ts";
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
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
import { vim } from "@replit/codemirror-vim";
import { indentOnInput } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { search, searchKeymap } from "@codemirror/search";
import { addLoopBudgetInstrumentation } from "./instrumenter.ts";
import type { FolderDoc } from "@patchwork/filesystem";
import { makePersisted } from "@solid-primitives/storage";

const innerWorker = new Worker(
  new URL("./codemirror/worker.ts", import.meta.url),
  { type: "module" }
);
const worker = Comlink.wrap<WorkerShape>(innerWorker);
await worker.initialize();

function createCode(code: string) {
  const instrumented = addLoopBudgetInstrumentation(code);
  const fn = new Function(
    "ctx",
    "params",
    `with (Math) {with (ctx) {${instrumented}
}}`
  ) as unknown as CreateTenfoldOptions["letters"][number];
  return fn;
}

function makeName(idx: number) {
  return (idx + "").padStart(2, "0") + ".js";
}

type TextFile = { content: string };

const folders = ["0i", "1n", "2k", "3s", "4w", "5i", "6t", "7c", "8h"];

export default function TenfoldExperience(props: {
  handle: DocHandle<Tenfold>;
  element: PatchworkViewElement;
}) {
  const tenfold = makeDocumentProjection(props.handle) as Doc<Tenfold>;

  createEffect(() => {
    if (!tenfold.tenfolder) {
      props.handle.change((doc) => {
        doc.tenfolder =
          "automerge:2c4E6m5u6rPWkeDxA6i1YWrAjTzD" as AutomergeUrl;
      });
    }
  });

  const [tenfolder] = useDocument<FolderDoc>(
    () => tenfold.tenfolder,
    props.element
  );

  const [lettersFolder] = useDocument<FolderDoc>(
    () => tenfolder()?.docs.find((doc) => doc.name == "letters")?.url,
    props.element
  );

  const i0url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "0i")?.url;
  const n1url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "1n")?.url;
  const k2url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "2k")?.url;
  const s3url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "3s")?.url;
  const w4url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "4w")?.url;
  const i5url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "5i")?.url;
  const t6url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "6t")?.url;
  const c7url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "7c")?.url;
  const h8url = () =>
    lettersFolder()?.docs.find((doc) => doc.name == "8h")?.url;

  const [i0, i0Handle] = useDocument<FolderDoc>(i0url, props.element);
  const [n1, n1Handle] = useDocument<FolderDoc>(n1url, props.element);
  const [k2, k2Handle] = useDocument<FolderDoc>(k2url, props.element);
  const [s3, s3Handle] = useDocument<FolderDoc>(s3url, props.element);
  const [w4, w4Handle] = useDocument<FolderDoc>(w4url, props.element);
  const [i5, i5Handle] = useDocument<FolderDoc>(i5url, props.element);
  const [t6, t6Handle] = useDocument<FolderDoc>(t6url, props.element);
  const [c7, c7Handle] = useDocument<FolderDoc>(c7url, props.element);
  const [h8, h8Handle] = useDocument<FolderDoc>(h8url, props.element);

  const letterCounts = {
    get 0() {
      return i0()?.docs.length ?? 0;
    },
    get 1() {
      return n1()?.docs.length ?? 0;
    },
    get 2() {
      return k2()?.docs.length ?? 0;
    },
    get 3() {
      return s3()?.docs.length ?? 0;
    },
    get 4() {
      return w4()?.docs.length ?? 0;
    },
    get 5() {
      return i5()?.docs.length ?? 0;
    },
    get 6() {
      return t6()?.docs.length ?? 0;
    },
    get 7() {
      return c7()?.docs.length ?? 0;
    },
    get 8() {
      return h8()?.docs.length ?? 0;
    },
    get length() {
      return 9;
    },
  };

  const i0CodeUrl = () =>
    i0()?.docs.find((doc) => doc.name == makeName(tenfold.states[0].i))?.url;
  const n1CodeUrl = () =>
    n1()?.docs.find((doc) => doc.name == makeName(tenfold.states[1].i))?.url;
  const k2CodeUrl = () =>
    k2()?.docs.find((doc) => doc.name == makeName(tenfold.states[2].i))?.url;
  const s3CodeUrl = () =>
    s3()?.docs.find((doc) => doc.name == makeName(tenfold.states[3].i))?.url;
  const w4CodeUrl = () =>
    w4()?.docs.find((doc) => doc.name == makeName(tenfold.states[4].i))?.url;
  const i5CodeUrl = () =>
    i5()?.docs.find((doc) => doc.name == makeName(tenfold.states[5].i))?.url;
  const t6CodeUrl = () =>
    t6()?.docs.find((doc) => doc.name == makeName(tenfold.states[6].i))?.url;
  const c7CodeUrl = () =>
    c7()?.docs.find((doc) => doc.name == makeName(tenfold.states[7].i))?.url;
  const h8CodeUrl = () =>
    h8()?.docs.find((doc) => doc.name == makeName(tenfold.states[8].i))?.url;

  const [i0CodeDoc, i0CodeDocHandle] = useDocument<TextFile>(
    i0CodeUrl,
    props.element
  );
  const [n1CodeDoc, n1CodeDocHandle] = useDocument<TextFile>(
    n1CodeUrl,
    props.element
  );
  const [k2CodeDoc, k2CodeDocHandle] = useDocument<TextFile>(
    k2CodeUrl,
    props.element
  );
  const [s3CodeDoc, s3CodeDocHandle] = useDocument<TextFile>(
    s3CodeUrl,
    props.element
  );
  const [w4CodeDoc, w4CodeDocHandle] = useDocument<TextFile>(
    w4CodeUrl,
    props.element
  );
  const [i5CodeDoc, i5CodeDocHandle] = useDocument<TextFile>(
    i5CodeUrl,
    props.element
  );
  const [t6CodeDoc, t6CodeDocHandle] = useDocument<TextFile>(
    t6CodeUrl,
    props.element
  );
  const [c7CodeDoc, c7CodeDocHandle] = useDocument<TextFile>(
    c7CodeUrl,
    props.element
  );
  const [h8CodeDoc, h8CodeDocHandle] = useDocument<TextFile>(
    h8CodeUrl,
    props.element
  );

  const [editing, setEditing] = makePersisted(createSignal<number>(0), {
    name: `${props.handle.url}#editing`,
  });
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();

  const [letterFns, updateLetterFns] = createStore<
    CreateTenfoldOptions["letters"]
  >(Array.from(Array(9)));

  const codes = [
    [i0CodeDoc, i0CodeDocHandle, i0Handle],
    [n1CodeDoc, n1CodeDocHandle, n1Handle],
    [k2CodeDoc, k2CodeDocHandle, k2Handle],
    [s3CodeDoc, s3CodeDocHandle, s3Handle],
    [w4CodeDoc, w4CodeDocHandle, w4Handle],
    [i5CodeDoc, i5CodeDocHandle, i5Handle],
    [t6CodeDoc, t6CodeDocHandle, t6Handle],
    [c7CodeDoc, c7CodeDocHandle, c7Handle],
    [h8CodeDoc, h8CodeDocHandle, h8Handle],
  ] as const;

  for (const [idx, [code]] of Object.entries(codes)) {
    createEffect((prev: string | undefined) => {
      const content = code()?.content;
      if (content == undefined) return;
      if (!prev || prev != content) {
        try {
          const c = createCode(content);
          updateLetterFns(produce((letters) => (letters[+idx] = c)));
        } catch (error) {
          console.error(
            `error in ${folders[+idx].slice(1)?.toUpperCase()}${(tenfold.states[+idx].i + "").padStart(2, "0")}`,
            error
          );
        }
      }
      return content;
    });
  }

  const tenfoldOptions = {
    letters: letterFns,
    get letterCounts() {
      return Array.from(letterCounts);
    },
    get currentlyEditingIndex() {
      return editing();
    },
    font,
    get states() {
      return tenfold.states ?? [];
    },
    get container() {
      return canvas()!;
    },
    edit: setEditing,
    set(i, field, value) {
      props.handle.change((doc) => (doc.states[i][field] = value));
    },
  } satisfies CreateTenfoldOptions;

  onMount(() => {
    onCleanup(createTenfold(tenfoldOptions));
    canvas()!.addEventListener("tenfold:edit", (event) => {
      setEditing((event as CustomEvent<number>).detail || 0);
    });
  });

  const editingHandle = () => codes[editing()][1]();

  const typescriptPath = () =>
    `/letters/${folders[editing()]}/${tenfold.states[editing()].i}.js`;

  async function fork() {
    const idx = editing();
    const hdl = codes[idx][2];
    const len = Array.from(letterCounts)[idx];
    const name = (len + "").padStart(2, "0") + ".js";

    const newDoc = await props.element.repo.create2({
      "@patchwork": { type: "file" },
      mimeType: "application/javascript",
      extension: "js",
      metadata: { permissions: 420 },
      content: codes[idx][0]()?.content ?? "",
      name,
    });

    hdl()?.change((folder) => {
      folder.docs.push({
        type: "file",
        url: newDoc.url,
        name,
      });
    });

    props.handle.change((doc) => (doc.states[idx].i = len));
  }

  const [withVim, setWithVim] = createSignal(false);

  const historyCompartment = new Compartment();

  const tsFacetCompartment = new Compartment();

  createEffect(() => {
    tsFacetCompartment.reconfigure(
      tsFacet.of({
        worker,
        path: typescriptPath(),
      })
    );
  });

  createEffect(() => {
    if (isNaN(tenfold.states[editing()].i)) {
      props.handle.change((t) => {
        t.states[editing()].i = 0;
      });
    }
  });

  return (
    <Suspense>
      <article class="tenfold" ref={setCanvas}>
        <canvas />
        <aside>
          <div>
            <button onClick={() => fork()}>F</button>
            <CodeMirror
              handle={editingHandle()}
              path={["content"]}
              withView={(view: EditorView) => {
                createEffect(
                  on(typescriptPath, () => {
                    view.dispatch({
                      effects: historyCompartment.reconfigure([]),
                    });
                    setTimeout(() => {
                      view.dispatch({
                        effects: historyCompartment.reconfigure(history()),
                      });
                    }, 1000);
                  })
                );
              }}
              extensions={[
                withVim() ? vim({ status: true }) : [],
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
                  {
                    preventDefault: true,
                    key: "m-c-v",
                    run() {
                      setWithVim((prev) => !prev);
                      return true;
                    },
                  },
                  ...defaultKeymap,
                  ...historyKeymap,
                  ...completionKeymap,
                  ...searchKeymap,
                ]),
                historyCompartment.of([history()]),
                javascript(),
                noirTheme,
                tsFacetCompartment.of(
                  tsFacet.of({ worker, path: typescriptPath() })
                ),
                autocompletion({
                  override: [tsAutocomplete()],
                  closeOnBlur: false,
                }),
                tsSync(),
                tsGoto(),
                tsHover(),
                tsTwoslash(),
                tsLinterWorker(),
                indentOnInput(),
                search({ caseSensitive: false, regexp: true }),
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
          </div>
        </aside>
      </article>
    </Suspense>
  );
}
