import type {
  DocLink,
  FolderDoc,
  HasPatchworkMetadata,
} from "@patchwork/filesystem";
import { For, Match, Suspense, Switch } from "solid-js";
import {
  filter,
  filterMatches,
  selectedDocUrls,
  setRenaming,
} from "../state.ts";
import {
  deleteAt,
  updateText,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import type { OpenDocumentEventDetail } from "@patchwork/elements";
import Folder from "./folder.tsx";
import Item from "./item.tsx";
import { ItemName } from "./name.tsx";
import { getRegistry, type DataType } from "@patchwork/plugins";

export interface DocumentListProps {
  handle: DocHandle<FolderDoc>;
  docs?: DocLink[];
  depth: number;
  repo: Repo;
  open(detail: OpenDocumentEventDetail): void;
}

export function DocumentList(props: DocumentListProps) {
  function removeItem(index: number) {
    props.handle.change((folder) => deleteAt(folder.docs, index));
  }
  return (
    <For each={props.docs}>
      {(doc, index) => {
        const visible = () => !filter().length || filterMatches(doc.name);
        const remove = () => removeItem(index());
        const relid = () => props.handle.url + "/" + index();
        const rename = (name: string) => {
          props.handle.change((doc) => {
            updateText(doc, ["docs", index(), "name"], name);
          });
          const datatypes = getRegistry<DataType>("patchwork:datatype");
          props.repo
            .find<Partial<HasPatchworkMetadata>>(doc.url)
            .then(async (handle) => {
              const { "@patchwork": metadata } = handle.doc();

              if (metadata) {
                const datatype = datatypes.get(metadata.type) as DataType;

                if (datatype) {
                  await datatypes.load(datatype.id);
                  handle.change((doc) => datatype.module.setTitle?.(doc, name));
                }
              }
            });
        };

        return (
          <div
            classList={{
              sideboard__item: true,
              "sideboard__item--visible": visible(),
              "sideboard__item--invisible": !visible(),
            }}
          >
            <Switch>
              <Match when={doc.type == "folder"}>
                <Folder
                  url={doc.url}
                  depth={props.depth}
                  repo={props.repo}
                  removeFromParent={remove}
                  open={props.open}
                  name={doc.name}
                />
              </Match>
              <Match when={doc.type != "folder"}>
                <Item
                  id={relid()}
                  startRenaming={() => setRenaming(relid())}
                  remove={remove}
                  pressed={selectedDocUrls()?.includes(doc.url)}
                  type={doc.type}
                  openWith={(toolId) =>
                    props.open({
                      url: doc.url,
                      toolId,
                      title: doc.name,
                      type: doc.type,
                    })
                  }
                >
                  <ItemName name={doc.name} id={relid()} rename={rename} />
                </Item>
              </Match>
            </Switch>
          </div>
        );
      }}
    </For>
  );
}
