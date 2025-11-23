import type { DocHandle } from "@automerge/automerge-repo";
import type { Tenfold, TenfoldLettersDoc } from "./index.tsx";
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
  onCleanup,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import font from "./font.txt";
import { javascript, javascriptLanguage } from "@codemirror/lang-javascript";
import { noirTheme } from "./codemirror/theme.ts";
import { myCompletions } from "./codemirror/complete.ts";
import { indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";

export default function TenfoldExperience(props: {
  handle: DocHandle<Tenfold>;
  element: PatchworkViewElement;
}) {
  const doc = makeDocumentProjection(props.handle);
  const [lettersDoc, lettersDocHandle] = useDocument<TenfoldLettersDoc>(
    () => doc.letters,
    props.element
  );

  const [editing, setEditing] = createSignal<number>();
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement>();
  const [api, setAPI] = createSignal<ReturnType<typeof createTenfold>[0]>();

  const [letters, updateLetters] = createStore<CreateTenfoldOptions["letters"]>(
    Array.from(Array(9), () => [])
  );

  // todo this is all very silly, i'd be better off using the change payload directly
  createEffect((prev: TenfoldLettersDoc["letters"] | undefined) => {
    api();
    for (const [letterIndex, set] of Object.entries(
      lettersDoc()?.letters ?? []
    )) {
      for (const [lettererIndex, letterer] of Object.entries(set)) {
        const ex = prev?.[+letterIndex]?.[+lettererIndex];
        if (!ex || ex != letterer) {
          try {
            const fn = new Function(
              "ctx",
              "params",
              `with (Math) {with (ctx) {${letterer}}}`
            ) as unknown as CreateTenfoldOptions["letters"][number];

            updateLetters(
              produce((letters) => {
                letters[+letterIndex] ??= [];
                // @ts-ignore
                letters[+letterIndex][+lettererIndex] = fn;
              })
            );
          } catch {}
        }
      }
    }
    return lettersDoc()?.letters.map((l) => [...l]);
  });

  const tenfoldOptions = {
    letters,
    get currentlyEditingIndex() {
      return editing();
    },
    font,
    get states() {
      // todo tenfold doesn't handle an empty states array yet
      return doc.states ?? [];
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
    const [api, cleanup] = createTenfold(tenfoldOptions);
    setAPI(api);
    onCleanup(cleanup);

    canvas()!.addEventListener("tenfold:edit", (event) => {
      setEditing((event as CustomEvent<number>).detail);
    });
  });

  const path = () =>
    editing() == null ? [] : ["letters", editing(), doc.states[editing()!].i];

  function fork() {
    const letter = editing();
    const ldoc = lettersDoc();
    if (letter == null || ldoc == null) return;
    const source = doc.states[letter].i;
    const code = ldoc.letters[letter][source];
    let idx: number;

    lettersDocHandle()?.change((lettersDoc) => {
      idx = lettersDoc.letters[letter].push(code);
    });

    props.handle.change((doc) => {
      doc.states[letter].i = idx - 1;
    });
  }

  return (
    <Suspense>
      <article class="tenfold" ref={setCanvas}>
        <canvas></canvas>
        <aside>
          <div>
            <Show
              when={lettersDocHandle() && editing() != null && path().length}
            >
              <button onClick={() => fork()}>F</button>
              <CodeMirror
                handle={lettersDocHandle()}
                path={path()}
                extensions={[
                  keymap.of([indentWithTab]),
                  javascript(),
                  noirTheme,
                  javascriptLanguage.data.of({
                    autocomplete: myCompletions,
                  }),
                ]}
              />
            </Show>
          </div>
        </aside>
      </article>
    </Suspense>
  );
}
