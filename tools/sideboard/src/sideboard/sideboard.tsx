import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";

import type { TinyPatchworkAccountDoc } from "tiny-patchwork/src/lib/account-doc.ts";
import type { PatchworkToolProps } from "../types.ts";
import { filter, setFilter, setSelectedId } from "./state.ts";
import CreateNew from "./create-new.tsx";
import { parseHash, useWindowEvent } from "./util.ts";
import type { FolderDoc } from "@patchwork/filesystem";
import { createOpenEventHandler } from "./events.ts";
import { SearchIcon } from "./icons.tsx";
import { DocumentList } from "./document-list.tsx";

export function Sideboard(props: PatchworkToolProps<TinyPatchworkAccountDoc>) {
  useWindowEvent("hashchange", () => setSelectedId(parseHash().docUrl));

  const doc = makeDocumentProjection(props.handle);
  const [folder, folderHandle] = useDocument<FolderDoc>(
    () => doc.rootFolderUrl,
    props
  );

  const moduleSettingsUrl = () => doc.moduleSettingsUrl;

  return (
    <aside class="sideboard">
      <header class="sideboard-header">
        <CreateNew
          changeFolder={(fn) => folderHandle()?.change(fn)}
          repo={props.repo}
        />
      </header>
      <div class="sideboard__filter-container sideboard-widget">
        <SearchIcon />
        <input
          name="filter"
          class="sideboard__filter"
          placeholder="Filter by title"
          value={filter()}
          onInput={(event) => setFilter(event.target.value.toLowerCase())}
        />
      </div>
      <nav class="sideboard__doclist sideboard-widget" role="tree">
        <DocumentList depth={0} repo={props.repo} docs={folder()?.docs} />
      </nav>
      <footer class="sideboard-footer">
        <button
          onClick={createOpenEventHandler(
            moduleSettingsUrl(),
            "chee/module-settings"
          )}
          class="sideboard-footer__button"
        >
          My tools
        </button>
      </footer>
    </aside>
  );
}
