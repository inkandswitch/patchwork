import {
  updateText,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";
import type { AutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";
import { useDocument } from "@automerge/automerge-repo-solid-primitives";
import type { OpenDocumentEventDetail } from "@inkandswitch/patchwork-elements";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { createEffect, createSelector, createSignal, onMount } from "solid-js";
import CreateNew from "../create-new.tsx";
import { filter, filterMatches, setRenaming } from "../state.ts";
import { DocumentList } from "./document-list.tsx";
import Item from "./item.tsx";
import { ItemName } from "./name.tsx";

export default function Folder(props: {
  url: AutomergeUrl;
  repo: Repo;
  depth?: number;
  removeFromParent(): void;
  open(detail: OpenDocumentEventDetail): void;
  name?: string;
  hive?: AutomergeRepoKeyhive;
  selectedDocUrls: AutomergeUrl[];
  visitedFolders?: Set<AutomergeUrl>;
}) {
  const [ref, setRef] = createSignal<HTMLElement>();
  const [open, setOpen] = createSignal(false);

  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  // Create a new Set with the current folder URL to prevent circular references
  const nextVisitedFolders = new Set(props.visitedFolders ?? []);
  nextVisitedFolders.add(props.url);

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

  const selector = createSelector(() => props.url);

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
        pressed={props.selectedDocUrls.includes(props.url)}
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
          hive={props.hive}
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
          hive={props.hive}
          selectedDocUrls={props.selectedDocUrls}
          visitedFolders={nextVisitedFolders}
        />
      </div>
    </div>
  );
}
