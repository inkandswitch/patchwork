import { type AutomergeUrl, type Repo } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { FolderDoc } from "@patchwork/filesystem";
import { createEffect, createSignal, onMount, Suspense } from "solid-js";
import { DocumentList } from "./document-list.tsx";
import { createOpenEventHandler } from "./events.ts";
import { filter, filterMatches, selectedDocUrls } from "./state.ts";
import CreateNew from "./create-new.tsx";

export default function Folder(props: {
  url: AutomergeUrl;
  repo: Repo;
  depth?: number;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [open, setOpen] = createSignal(false);

  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  const depth = () => props.depth ?? 1;
  const depthStyle = () => ({ "--depth": depth() + 1 });
  const folderDepthStyle = () => ({ "--depth": depth() });

  createEffect((last) => {
    if (!last && filter() && filterMatches(folder()!?.title)) {
      setOpen(true);
    }
    return filter();
  });

  // lol @ this huge hack
  onMount(() => {
    setTimeout(() => {
      const has = !!ref()?.querySelector(
        ".sideboard-folder__link[aria-pressed='true']"
      );
      setOpen((open) => open || has);
    }, 200);
  });

  return (
    <Suspense fallback="Loading...">
      <div
        class="sideboard-folder"
        role="group"
        data-depth={depth()}
        style={folderDepthStyle()}
      >
        <a
          href={props.url}
          class="sideboard-folder__link sideboard-folder__link--folder"
          role="treeitem"
          aria-pressed={selectedDocUrls().includes(props.url)}
          data-patchwork-open={props.url}
          onClick={createOpenEventHandler(props.url)}
          data-url={props.url}
        >
          <button
            class="sideboard-folder__toggle"
            onClick={() => setOpen((yn) => !yn)}
          >
            {open() ? "▼" : "▶︎"}
          </button>
          {folder()?.title}
          <CreateNew
            repo={props.repo}
            changeFolder={(fn) => handle()?.change(fn)}
          />
        </a>

        <div
          ref={(el) => setRef(el)}
          class="sideboard-folder__contents"
          classList={{ "sideboard-folder__contents--hidden": !open() }}
          data-depth={depth()}
          style={depthStyle()}
        >
          <DocumentList
            docs={folder()?.docs}
            repo={props.repo}
            depth={depth() + 1}
          />
        </div>
      </div>
    </Suspense>
  );
}
