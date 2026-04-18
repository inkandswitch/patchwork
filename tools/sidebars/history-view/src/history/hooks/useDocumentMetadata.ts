import { createMemo, Accessor } from "solid-js";
import type { DocHandle } from "@automerge/automerge-repo";
import {
  getType,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { useDatatypes } from "../lib/solid-plugins";
import { isLoadedPlugin } from "@inkandswitch/patchwork-plugins/dist/registry/guards";

/**
 * Hook to compute document metadata (title and ref)
 */
export function useDocumentMetadata(
  doc: Accessor<HasPatchworkMetadata | undefined>,
  handle: Accessor<DocHandle<HasPatchworkMetadata> | undefined>
) {
  const datatypes = useDatatypes();

  const title = createMemo(() => {
    const currentDoc = doc();
    if (!currentDoc) return "";
    const type = getType(currentDoc);
    const datatype = datatypes.find((dt) => dt.id === type);
    if (datatype && isLoadedPlugin(datatype)) {
      return datatype.module.getTitle(currentDoc);
    }
    return "";
  });

  const docRef = createMemo(() => {
    const h = handle();
    return h ? h.ref() : undefined;
  });

  return {
    title,
    docRef,
  };
}
