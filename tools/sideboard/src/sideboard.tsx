import {
  createSignal,
  For,
  Suspense,
  onCleanup,
  Switch,
  Match,
  createResource,
  createEffect,
} from "solid-js";
import { ContextMenu } from "@kobalte/core/context-menu";

import {
  useDocument,
  makeDocumentProjection,
} from "@automerge/automerge-repo-solid-primitives";
import {
  parseAutomergeUrl,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";

import { createStore, reconcile } from "solid-js/store";
import {
  getPluginRegistry,
  getLoadedSupportedToolsForType,
  type Tool,
  type DataType,
  type ToolDescription,
  type DataTypeDescription,
} from "@patchwork/plugins";
import type { TinyPatchworkAccountDoc } from "tiny-patchwork/src/lib/account-doc.ts";
import type { PatchworkToolProps } from "./types.ts";
import { ModuleWatcher } from "@patchwork/filesystem";

/* const addDocument = async (dataType: DataType<unknown>) => {
  const docHandle = await createDocOfDataType2(dataType, repo);

  const docLink = {
    name: dataType.name,
    type: dataType.id,
    url: docHandle.url,
  };

  changeRootFolder((doc) => {
    doc.docs.push(docLink);
  });

  openDocument(root!, docLink.url);
}; */

const [filter, setFilter] = createSignal("");

const [selectedId, setSelectedId] = createSignal(location.hash.slice(1));

const toolRegistry = getPluginRegistry<ToolDescription>("patchwork:tool");
const datatypeRegistry =
  getPluginRegistry<DataTypeDescription>("patchwork:datatype");

function useTools(): Tool[] {
  const [plugins, setPlugins] = createStore(toolRegistry.getPlugins());
  const dispose = toolRegistry.onChange((change) => {
    setPlugins(reconcile(toolRegistry.getPlugins()));
  });
  onCleanup(dispose);
  return plugins;
}

function useDatatypes(): DataType[] {
  const [plugins, setPlugins] = createStore(datatypeRegistry.getPlugins());
  const dispose = datatypeRegistry.onChange(() =>
    setPlugins(reconcile(datatypeRegistry.getPlugins()))
  );
  onCleanup(dispose);
  return plugins;
}

function useLoadedSupportedToolsForType(type: string) {
  const [supportedTools, control] = createResource(
    () => type,
    getLoadedSupportedToolsForType
  );
  onCleanup(toolRegistry.onChange(control.refetch));
  return supportedTools;
}

function createOpenEvent(url: AutomergeUrl, toolId?: string) {
  const openEvent = new CustomEvent("patchwork:open-document", {
    detail: { url, toolId },
    bubbles: true,
    composed: true,
  });
  return openEvent;
}

function createOpenEventHandler(url: AutomergeUrl, toolId?: string) {
  return function (this: HTMLElement, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const openEvent = createOpenEvent(url, toolId);
    this.dispatchEvent(openEvent);
  };
}

function onHashChange() {
  setSelectedId(window.location.hash.slice(1));
}

function useWindowEvent<E extends keyof WindowEventMap>(
  event: E,
  listener: (event: WindowEventMap[E]) => void
) {
  window.addEventListener(event, listener);
  onCleanup(() => window.removeEventListener(event, listener));
}

export default function Sideboard(
  props: PatchworkToolProps<TinyPatchworkAccountDoc>
) {
  useWindowEvent("hashchange", onHashChange);

  const doc = makeDocumentProjection(props.handle);

  const moduleSettingsUrl = () => doc.moduleSettingsUrl;

  //const tools = useTools();

  createEffect(() => {
    new ModuleWatcher(doc.moduleSettingsUrl, [], props.repo, (name) => {
      console.log("HELLO WORLD?????");
      if (name === "chee/sideboard") {
        location.reload();
      } else {
        console.log(name);
        console.info({ name });
      }
    });
  });

  return (
    <aside class="sideboard">
      <header class="sideboard-header">
        <button
          onClick={() => {
            console.log("hey ");
          }}
          class="sideboard-header__button"
        >
          <PlusIcon /> Create New
        </button>
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
        <Folder
          url={doc?.rootFolderUrl ?? props.handle.url}
          repo={props.repo}
        />
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

interface DocLink {
  type: string | null;
  name: string;
  url: AutomergeUrl;
}

interface FolderDoc {
  docs: DocLink[];
  title: string;
}

function Folder(props: { url: AutomergeUrl; repo: Repo; depth?: number }) {
  const [folder, handle] = useDocument<FolderDoc>(() => props.url, props);

  const depth = () => props.depth ?? 1;
  const depthStyle = () => ({ "--depth": depth() });

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
          aria-pressed={selectedId() == handle()?.documentId}
          data-patchwork-open={props.url}
          onClick={createOpenEventHandler(props.url)}
        >
          {folder()?.title}
        </a>
        <div
          class="sideboard-folder__contents"
          data-depth={depth()}
          style={depthStyle()}
        >
          <For each={folder()?.docs}>
            {(doc) => {
              const visible = () =>
                !filter().length || doc.name?.toLowerCase().includes(filter());

              const classes = () => ({
                visible: visible(),
                invisible: !visible(),
              });

              const documentId = () => parseAutomergeUrl(doc.url)?.documentId;

              return (
                <Switch>
                  <Match when={doc.type == "folder"}>
                    <div classList={classes()}>
                      <Folder
                        url={doc.url}
                        depth={depth() + 1}
                        repo={props.repo}
                      />
                    </div>
                  </Match>
                  <Match when={doc.type != "folder"}>
                    <ContextMenu>
                      <ContextMenu.Trigger class="context-menu__trigger">
                        <a
                          href={doc.url}
                          role="treeitem"
                          aria-pressed={documentId() === selectedId()}
                          class="sideboard-folder__link sideboard-folder__link--file"
                          classList={classes()}
                          onClick={createOpenEventHandler(doc.url)}
                        >
                          {doc.name}
                        </a>
                      </ContextMenu.Trigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Content class="context-menu__content">
                          <ContextMenu.Item class="context-menu__item">
                            Commit{" "}
                            <div class="context-menu__item-right-slot">⌘+K</div>
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu>
                  </Match>
                </Switch>
              );
            }}
          </For>
        </div>
      </div>
    </Suspense>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="search-icon"
    >
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="plus-icon icon"
    >
      <path d="M5 12h14"></path>
      <path d="M12 5v14"></path>
    </svg>
  );
}
