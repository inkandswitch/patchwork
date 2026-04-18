import {
  isValidAutomergeUrl,
  type AutomergeUrl,
  type ChangeFn,
  type Repo,
} from "@automerge/automerge-repo";
import {
  type DatatypeDescription,
  type Plugin,
  createDocOfDatatype2,
  getRegistry,
  isLoadablePlugin,
  isLoadedPlugin,
} from "@inkandswitch/patchwork-plugins";
import { createSignal, For, Show } from "solid-js";
import { PlusIcon } from "./icons.tsx";
import type {
  FolderDoc,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { useFilteredDatatypes } from "./lib/solid-plugins";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import type { OpenDocumentEventDetail } from "@inkandswitch/patchwork-elements";
import type { AutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";

async function createNew(
  repo: Repo,
  datatype: Plugin<DatatypeDescription>,
  hive?: AutomergeRepoKeyhive
) {
  if (isLoadablePlugin(datatype)) {
    const registry = getRegistry("patchwork:datatype");
    await registry.load(datatype.id);
  }
  if (!isLoadedPlugin(datatype)) {
    throw new Error("plugin not loaded after loading");
  }

  const docHandle = await createDocOfDatatype2(datatype, repo);
  if (hive) {
    await hive.addSyncServerPullToDoc(docHandle.url);
  }
  const doc = docHandle.doc();
  const name = datatype.module.getTitle(doc);

  return {
    name,
    type: datatype.id,
    url: docHandle.url,
  };
}

async function addByUrl(repo: Repo, url: AutomergeUrl) {
  const handle = await repo.find<Partial<HasPatchworkMetadata>>(url);
  const doc = handle.doc();
  const type = doc?.["@patchwork"]?.type ?? "";
  let name = "Untitled";

  if (type) {
    const registry = getRegistry("patchwork:datatype");
    const datatype = registry.get(type);
    if (datatype) {
      await registry.load(datatype.id);
      if (isLoadedPlugin(datatype)) {
        name = datatype.module.getTitle(doc) || name;
      }
    }
  }

  return { name, type, url };
}

export interface CreateNewProps {
  repo: Repo;
  hive?: AutomergeRepoKeyhive;
  changeFolder(fn: ChangeFn<FolderDoc>): void;
  open(detail: OpenDocumentEventDetail): void;
  context?: string;
}

export default function CreateNew(props: CreateNewProps) {
  const datatypes = useFilteredDatatypes((item) => !item.unlisted);
  const [query, setQuery] = createSignal("");
  const [highlightIndex, setHighlightIndex] = createSignal(0);
  const [open, setOpen] = createSignal(false);

  const isUrl = () => isValidAutomergeUrl(query().trim());

  const filteredDatatypes = () => {
    const q = query().toLowerCase();
    if (!q) return datatypes;
    return datatypes.filter((d) => d.name.toLowerCase().includes(q));
  };

  // total number of selectable items (url item + datatypes)
  const itemCount = () => (isUrl() ? 1 : 0) + filteredDatatypes().length;

  async function handleUrlSubmit(url: string) {
    const trimmed = url.trim();
    if (!isValidAutomergeUrl(trimmed)) return;
    const docLink = await addByUrl(props.repo, trimmed as AutomergeUrl);
    props.changeFolder((doc) => {
      doc.docs.push(docLink);
    });
    props.open(docLink);
    setQuery("");
  }

  async function selectHighlighted() {
    const idx = highlightIndex();
    if (isUrl()) {
      if (idx === 0) {
        await handleUrlSubmit(query());
        return;
      }
      // offset by 1 for the url item
      const datatype = filteredDatatypes()[idx - 1];
      if (datatype) await selectDatatype(datatype);
    } else {
      const datatype = filteredDatatypes()[idx];
      if (datatype) await selectDatatype(datatype);
    }
  }

  async function selectDatatype(datatype: Plugin<DatatypeDescription>) {
    const freshy = await createNew(props.repo, datatype, props.hive);
    props.changeFolder(async (doc) => {
      doc.docs.push(freshy);
    });
    props.open(freshy);
  }

  // get the datatype index in filteredDatatypes for a given overall highlight index
  const datatypeIndex = (i: number) => (isUrl() ? i - 1 : i);

  return (
    <DropdownMenu
      open={open()}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setQuery("");
          setHighlightIndex(0);
        }
      }}
    >
      <DropdownMenu.Trigger class="create-new-button" aria-label="create new">
        <PlusIcon class="create-new-button__icon" />{" "}
        <span class="create-new-button__text">Create new</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="popmenu__content">
          <div class="create-new-filter">
            <input
              class="create-new-filter__input"
              placeholder="Filter or paste automerge url…"
              value={query()}
              onInput={(e) => {
                setQuery(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  selectHighlighted();
                  setOpen(false);
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.min(i + 1, itemCount() - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlightIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Escape") {
                  // let the menu handle escape to close
                  return;
                }
                // prevent the menu from handling other keys
                e.stopPropagation();
              }}
              onPaste={(e) => {
                const text = e.clipboardData?.getData("text/plain") ?? "";
                if (isValidAutomergeUrl(text.trim())) {
                  e.preventDefault();
                  handleUrlSubmit(text);
                }
              }}
              ref={(el) => {
                requestAnimationFrame(() => el.focus());
              }}
            />
          </div>
          <Show when={isUrl()}>
            <DropdownMenu.Item
              class="popmenu__item"
              classList={{
                "popmenu__item--highlighted": highlightIndex() === 0,
              }}
              onSelect={() => handleUrlSubmit(query())}
              onPointerMove={() => setHighlightIndex(0)}
            >
              Add by URL
            </DropdownMenu.Item>
          </Show>
          <For each={filteredDatatypes()}>
            {(datatype, i) => (
              <DropdownMenu.Item
                class="popmenu__item"
                classList={{
                  "popmenu__item--highlighted":
                    highlightIndex() === i() + (isUrl() ? 1 : 0),
                }}
                onSelect={() => selectDatatype(datatype)}
                onPointerMove={() => setHighlightIndex(i() + (isUrl() ? 1 : 0))}
              >
                {datatype.name}
              </DropdownMenu.Item>
            )}
          </For>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  );
}
