import type { ChangeFn, Repo } from "@automerge/automerge-repo";
import { type DataType, createDocOfDataType2 } from "@patchwork/plugins";
import { For } from "solid-js";
import { PlusIcon } from "./icons.tsx";
import type { FolderDoc } from "@patchwork/filesystem";
import { useDatatypes } from "./plugins.ts";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";

async function createNew(repo: Repo, dataType: DataType<unknown>) {
  const docHandle = await createDocOfDataType2(dataType, repo);
  const doc = docHandle.doc();
  const name = dataType.module.getTitle(doc);

  return {
    name,
    type: dataType.id,
    url: docHandle.url,
  };
}

export interface CreateNewProps {
  repo: Repo;
  changeFolder(fn: ChangeFn<FolderDoc>): void;
}

export default function CreateNew(props: CreateNewProps) {
  const datatypes = useDatatypes((item) => !item.unlisted);

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>
        <PlusIcon /> Create new
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
