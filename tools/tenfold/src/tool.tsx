import type { DocHandle } from "@automerge/automerge-repo";
import type { Tenfold, TenfoldLettersDoc } from "./index.tsx";
import type { PatchworkViewElement } from "../../../core/element/dist/patchwork-view";
import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";
import { CodeMirror } from "@grjte/codemirror-base/component";
import createTenfold, { type CreateTenfoldOptions } from "./tenfold/tenfold.ts";
import { createStore, produce } from "solid-js/store";
import { createEffect, createSignal, onMount, Show, Suspense } from "solid-js";
import font from "./font.txt";

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
  const [api, setAPI] = createSignal<ReturnType<typeof createTenfold>>();

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
              "q",
              "r",
              "t",
              "x",
              "y",
              `with (ctx) {${letterer}}`
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
    get canvas() {
      return canvas()!;
    },
  };

  onMount(() => {
    setAPI(createTenfold(tenfoldOptions));
    canvas()!.addEventListener("tenfold:edit", (event) => {
      setEditing((event as CustomEvent<number>).detail);
    });
  });

  const path = () =>
    editing() == null ? [] : ["letters", editing(), doc.states[editing()!].i];

  return (
    <Suspense>
      <article class="tenfold">
        <canvas ref={setCanvas}></canvas>
        <aside>
          <div>
            <Show
              when={lettersDocHandle() && editing() != null && path().length}
            >
              <CodeMirror handle={lettersDocHandle()} path={path()} />
            </Show>
          </div>
        </aside>
      </article>
    </Suspense>
  );
}
