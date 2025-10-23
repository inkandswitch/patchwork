import type { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocHandle } from "@automerge/react";
import { Tldraw } from "tldraw";
import {
  useAutomergeStore,
  useAutomergePresence,
} from "./lith/useAutomergeStore.ts";
import type { TLDrawDoc } from "./datatype.ts";

export function TldrawTool({ docUrl }: { docUrl: AutomergeUrl }) {
  const handle = useDocHandle<TLDrawDoc>(docUrl, { suspense: true });
  const userId = "chee";

  const store = useAutomergeStore({ handle, userId });

  const userMetadata = {
    userId,
    name: userId,
    color: `hsl(${Math.abs(userId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`,
  };

  // Enable presence functionality
  useAutomergePresence({ handle, store, userMetadata });

  return <Tldraw inferDarkMode autoFocus store={store} />;
}
