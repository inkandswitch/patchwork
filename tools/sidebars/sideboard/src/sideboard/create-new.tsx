import type { ChangeFn, Repo } from "@automerge/automerge-repo";
import {
  type DataType,
  type DataTypeDescription,
  type Plugin,
  createDocOfDataType2,
  getRegistry,
  isLoadablePlugin,
  isLoadedPlugin,
} from "@patchwork/plugins";
import { For } from "solid-js";
import { PlusIcon } from "./icons.tsx";
import type { FolderDoc } from "@patchwork/filesystem";
import { useFilteredDatatypes } from "@patchwork/solid";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import type { OpenDocumentEventDetail } from "@patchwork/elements";

async function createNew(repo: Repo, datatype: Plugin<DataTypeDescription>) {
  if (isLoadablePlugin(datatype)) {
    const registry = getRegistry("patchwork:datatype");
    await registry.load(datatype.id);
  }
  if (!isLoadedPlugin(datatype)) {
    throw new Error("plugin not loaded after loading");
  }
  const docHandle = await createDocOfDataType2(datatype, repo);
  const doc = docHandle.doc();
  const name = datatype.module.getTitle(doc);

  return {
    name,
    type: datatype.id,
    url: docHandle.url,
  };
}

export interface CreateNewProps {
  repo: Repo;
  changeFolder(fn: ChangeFn<FolderDoc>): void;
  open(detail: OpenDocumentEventDetail): void;
}

export default function CreateNew(props: CreateNewProps) {
  const datatypes = useFilteredDatatypes((item) => !item.unlisted);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        class="create-new-button"
        aria-label="create new"
        onClick={(event) => {
          event.stopImmediatePropagation();
          event.stopPropagation();
        }}
      >
        <PlusIcon class="create-new-button__icon" />{" "}
        <span class="create-new-button__text">Create new</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="popmenu__content">
          <For each={datatypes}>
            {(datatype) => (
              <DropdownMenu.Item
                class="popmenu__item"
                onSelect={async () => {
                  const freshy = await createNew(props.repo, datatype);
                  props.changeFolder(async (doc) => {
                    doc.docs.push(freshy);
                  });
                  props.open(freshy);
                }}
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
