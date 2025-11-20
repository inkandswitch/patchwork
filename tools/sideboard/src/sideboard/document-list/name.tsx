import { createSelector, createSignal, Match, Switch } from "solid-js";
import { renaming, setRenaming } from "../state.ts";

export function ItemName(props: {
  name: string | undefined;
  id: string;
  rename: (name: string) => void;
}) {
  const isBeingRenamed = createSelector(renaming);

  // i'm only doing the rename on blur
  //  to avoid introducing codemirror
  // to the sidebar just for this
  // though codemirror will 101% already
  // be loaded in the system
  // so maybe chill?
  const [next, setNext] = createSignal(props.name);
  function blur() {
    props.rename(next() ?? "");
    if (isBeingRenamed(props.id)) setRenaming("");
  }

  return (
    <Switch>
      <Match when={isBeingRenamed(props.id)}>
        <form
          style="display: contents"
          onsubmit={(event) => {
            event.preventDefault();
            blur();
          }}
        >
          <input
            ref={(el) => {
              setNext(props.name);
              setTimeout(() => {
                // todo lol be less hacky
                el.focus();
                el.select();
              }, 80);
            }}
            autofocus
            onblur={blur}
            onkeydown={(event) => {
              if (
                event.key == "Escape" ||
                (event.key == "g" && event.ctrlKey)
              ) {
                blur();
              }
            }}
            class="document-list-item__name"
            value={next()}
            onInput={(event) => setNext(event.target.value)}
          />
        </form>
      </Match>
      <Match when={!isBeingRenamed(props.id)}>
        <span class="document-list-item__name">{props.name}</span>
      </Match>
    </Switch>
  );
}
