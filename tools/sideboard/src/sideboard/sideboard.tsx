import {
  makeDocumentProjection,
  useDocument,
} from "@automerge/automerge-repo-solid-primitives";

type TinyPatchworkAccountDoc = {
  rootFolderUrl: AutomergeUrl;
  moduleSettingsUrl: AutomergeUrl;
};

import type { PatchworkToolProps } from "../types.ts";
import { filter, setFilter } from "./state.ts";
import CreateNew from "./create-new.tsx";
import type { FolderDoc } from "@patchwork/filesystem";
import { createOpenEventHandler } from "./events.ts";
import { SearchIcon } from "./icons.tsx";
import { DocumentList } from "./document-list.tsx";
import type { AutomergeUrl } from "@automerge/automerge-repo";

export function Sideboard(props: PatchworkToolProps<TinyPatchworkAccountDoc>) {
  const doc = makeDocumentProjection(props.handle);
  const [folder, folderHandle] = useDocument<FolderDoc>(
    () => doc.rootFolderUrl,
    props
  );

  const moduleSettingsUrl = () => doc.moduleSettingsUrl;
  const accountDocUrl = () => props.handle.url;

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
          Modules
        </button>

        <button
          onClick={createOpenEventHandler(
            accountDocUrl(),
            "frame-configurator"
          )}
          class="sideboard-footer__button"
        >
          Settings
        </button>
      </footer>
    </aside>
  );
}
