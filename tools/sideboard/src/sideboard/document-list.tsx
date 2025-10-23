import type { DocLink } from "@patchwork/filesystem";
import { For, Match, Show, Switch } from "solid-js";
import { filter, selectedId } from "./state.ts";
import { parseAutomergeUrl, type Repo } from "@automerge/automerge-repo";
import { createOpenEvent, createOpenEventHandler } from "./events.ts";
import Folder from "./folder.tsx";
import { ContextMenu } from "@kobalte/core/context-menu";
import { useSupportedToolsForType } from "./plugins.ts";

export interface DocumentListProps {
  docs?: DocLink[];
  depth: number;
  repo: Repo;
}

export function DocumentList(props: DocumentListProps) {
  let ref: HTMLDivElement;
  return (
    <div ref={ref!}>
      <For each={props.docs}>
        {(doc) => {
          const visible = () =>
            !filter().length || doc.name?.toLowerCase().includes(filter());

          const classes = () => ({
            visible: visible(),
            invisible: !visible(),
          });

          const tools = useSupportedToolsForType(() => doc.type);
          const documentId = () => parseAutomergeUrl(doc.url).documentId;

          return (
            <Switch>
              <Match when={doc.type == "folder"}>
                <div classList={classes()}>
                  <Folder
                    url={doc.url}
                    depth={props.depth + 1}
                    repo={props.repo}
                  />
                </div>
              </Match>
              <Match when={doc.type != "folder"}>
                <ContextMenu>
                  <ContextMenu.Trigger
                    class="popmenu__trigger sideboard-folder__link sideboard-folder__link--file"
                    role="treeitem"
                    aria-pressed={documentId() === selectedId()}
                    classList={classes()}
                    onClick={createOpenEventHandler(doc.url)}
                  >
                    {doc.name}
                  </ContextMenu.Trigger>
                  <ContextMenu.Portal>
                    <ContextMenu.Content class="popmenu__content">
                      <Show when={tools.length}>
                        <ContextMenu.Sub>
                          <ContextMenu.SubTrigger class="popmenu__sub-trigger">
                            Open with...
                          </ContextMenu.SubTrigger>
                          <ContextMenu.Portal>
                            <ContextMenu.SubContent class="popmenu__sub-content">
                              <For each={tools}>
                                {(tool) => {
                                  return (
                                    <ContextMenu.Item
                                      class="popmenu__item"
                                      onSelect={() => {
                                        ref!?.dispatchEvent(
                                          createOpenEvent(doc.url, tool.id)
                                        );
                                      }}
                                    >
                                      {tool.name}
                                    </ContextMenu.Item>
                                  );
                                }}
                              </For>
                            </ContextMenu.SubContent>
                          </ContextMenu.Portal>
                        </ContextMenu.Sub>
                      </Show>
                    </ContextMenu.Content>
                  </ContextMenu.Portal>
                </ContextMenu>
              </Match>
            </Switch>
          );
        }}
      </For>
    </div>
  );
}
