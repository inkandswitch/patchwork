import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/react";
import { Tldraw } from "tldraw";
import { useAutomergeStore } from "./lith/useAutomergeStore.ts";
import type { TLDrawDoc } from "./datatype.ts";

export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const userId = "chee";
  const store = useAutomergeStore({ handle, userId });
  return <Tldraw inferDarkMode autoFocus store={store} />;
}
