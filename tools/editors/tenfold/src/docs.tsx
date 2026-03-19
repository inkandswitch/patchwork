import type { Accessor } from "solid-js"
import { Show } from "solid-js"

export default function TenfoldDocs(props: { hint: Accessor<string> }) {
  return (
    <div class="tenfold-docs">
      <h2>Tenfold</h2>
      <p>Click the circle below any letter to edit its code.</p>
      <Show when={props.hint()}>
        <div class="tenfold-hint">{props.hint()}</div>
      </Show>
    </div>
  )
}
