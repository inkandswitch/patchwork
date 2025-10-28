import type { AutomergeUrl } from "@automerge/automerge-repo";
import { $selectedDocHandles } from "@patchwork/context/selection";
import { createSignal } from "solid-js";

export const [filter, setFilter] = createSignal("");
const [selectedDocUrls, setSelectedDocUrls] = createSignal<AutomergeUrl[]>([]);

$selectedDocHandles.on("change", (refs) => {
  setSelectedDocUrls(refs.map((ref) => ref.url));
});

export { selectedDocUrls };
