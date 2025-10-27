import {
  parseAutomergeUrl,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { FolderDoc } from "@patchwork/filesystem";
import { Suspense } from "solid-js";
import { createOpenEventHandler } from "./events.ts";
import { selectedId } from "./state.ts";
import { DocumentList } from "./document-list.tsx";

export default function Folder(props: {
  url: AutomergeUrl;
  repo: Repo;
  depth?: number;
}) {
  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  const depth = () => props.depth ?? 1;
  const depthStyle = () => ({ "--depth": depth() });
  const documentId = () =>
    handle() && handle()!.url && parseAutomergeUrl(handle()!.url).documentId;

  return (
    <Suspense fallback="Loading...">
      <div
        class="sideboard-folder"
        role="group"
        data-depth={depth()}
        style={depthStyle()}
      >
        <a
          href={props.url}
          class="sideboard-folder__link sideboard-folder__link--folder"
          role="treeitem"
          aria-pressed={selectedId() == documentId()}
          data-patchwork-open={props.url}
          onClick={createOpenEventHandler(props.url)}
          data-url={props.url}
        >
          {folder()?.title}
        </a>
        <div
          class="sideboard-folder__contents"
          data-depth={depth()}
          style={depthStyle()}
        >
          <DocumentList
            docs={folder()?.docs}
            repo={props.repo}
            depth={depth()}
          />
        </div>
      </div>
    </Suspense>
  );
}
