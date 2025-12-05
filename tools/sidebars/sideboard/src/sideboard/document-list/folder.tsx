import {
  updateText,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { FolderDoc } from "@patchwork/filesystem";
import { createEffect, createSignal, onMount, Suspense } from "solid-js";
import { DocumentList } from "./document-list.tsx";
import {
  filter,
  filterMatches,
  selectedDocUrls,
  setRenaming,
} from "../state.ts";
import CreateNew from "../create-new.tsx";
import Item from "./item.tsx";
import { ItemName } from "./name.tsx";
import type { OpenDocumentEventDetail } from "@patchwork/elements";

export default function Folder(props: {
  url: AutomergeUrl;
  repo: Repo;
  depth?: number;
  removeFromParent(): void;
  open(detail: OpenDocumentEventDetail): void;
  name?: string;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [open, setOpen] = createSignal(false);

  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  const depth = () => props.depth ?? 1;
  const depthStyle = () => ({ "--depth": depth() + 1 });
  const folderDepthStyle = () => ({ "--depth": depth() });

  createEffect((last) => {
    if (!last && filter() && filterMatches(folder()!?.title ?? props.name)) {
      setOpen(true);
    }
    return filter();
  });

  // lol @ this huge hack
  onMount(() => {
    setTimeout(() => {
      const has = !!ref()?.querySelector(
        ".document-list-item[aria-pressed='true']"
      );
      setOpen((open) => open || has);
    }, 500);
  });

  function rename(name: string) {
    handle()?.change((doc) => updateText(doc, ["title"], name));
  }

  return (
    <div
      class="document-list-folder"
      role="group"
      data-depth={depth()}
      style={folderDepthStyle()}
    >
      <Item
        startRenaming={() => {
          setRenaming(props.url);
        }}
        remove={props.removeFromParent}
        id={props.url}
        pressed={selectedDocUrls()?.includes(props.url)}
        type="folder"
        openWith={(toolId) => {
          props.open({
            url: props.url,
            toolId,
            title: folder()?.title ?? props.name,
            type: "folder",
          });
        }}
      >
        <button
          class="document-list-folder__toggle"
          onClick={() => setOpen((yn) => !yn)}
        >
          {open() ? "▼" : "▶︎"}
        </button>
        <ItemName
          name={folder()?.title ?? props.name}
          id={props.url}
          rename={rename}
        />
        <CreateNew
          repo={props.repo}
          changeFolder={(fn) => handle()?.change(fn)}
          open={props.open}
        />
      </Item>

      <div
        ref={(el) => setRef(el)}
        class="document-list-folder__contents"
        classList={{ "document-list-folder__contents--hidden": !open() }}
        data-depth={depth()}
        style={depthStyle()}
      >
        <DocumentList
          docs={folder()?.docs}
          repo={props.repo}
          depth={depth() + 1}
          handle={handle.latest!}
          open={props.open}
        />
      </div>
    </div>
  );
}
