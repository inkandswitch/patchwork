import type { DocLink } from "@patchwork/filesystem";
import { For, Match, onMount, Show, Switch } from "solid-js";
import { filter, filterMatches, selectedDocUrls } from "./state.ts";
import { type Repo } from "@automerge/automerge-repo";
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
  return (
    <>
      <For each={props.docs}>
        {(doc) => {
          const visible = () => !filter().length || filterMatches(doc.name);

          const classes = () => ({
            sideboard__item: true,
            "sideboard__item--visible": visible(),
            "sideboard__item--invisible": !visible(),
          });

          const tools = useSupportedToolsForType(() => doc.type);

          return (
            <Switch>
              <Match when={doc.type == "folder"}>
                <div classList={classes()}>
                  <Folder url={doc.url} depth={props.depth} repo={props.repo} />
                </div>
              </Match>
              <Match when={doc.type != "folder"}>
                <ContextMenu>
                  <ContextMenu.Trigger
                    as="button"
                    class="popmenu__trigger sideboard-folder-item sideboard-folder-item--file"
                    role="treeitem"
                    aria-pressed={selectedDocUrls().includes(doc.url)}
                    classList={classes()}
                    onClick={createOpenEventHandler(doc.url)}
                    data-url={doc.url}
                  >
                    <span class="sideboard-folder-item__name">{doc.name}</span>
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
                                  let element: HTMLElement;
                                  let parent: HTMLElement;
                                  onMount(() => {
                                    parent = element!?.parentElement!;
                                    console.log(parent, element!);
                                  });
                                  return (
                                    <ContextMenu.Item
                                      ref={element!}
                                      class="popmenu__item"
                                      onSelect={() => {
                                        console.log({
                                          element: element!,
                                          parent,
                                        });
                                        parent!?.dispatchEvent(
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
    </>
  );
}
