import type { ChangeFn, Repo } from "@automerge/automerge-repo";
import {
  type DatatypeDescription,
  createDocOfDatatype2,
} from "@inkandswitch/patchwork-plugins";
import { For } from "solid-js";
import { PlusIcon } from "./icons.tsx";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { useFilteredDatatypes } from "@patchwork/solid";
import { DropdownMenu } from "@kobalte/core/dropdown-menu";
import type { OpenDocumentEventDetail } from "@inkandswitch/patchwork-elements";
import type { AutomergeRepoKeyhive } from "@automerge/automerge-repo-keyhive";

async function createNew(
  repo: Repo,
  datatype: DatatypeDescription,
  hive?: AutomergeRepoKeyhive
) {
  const docHandle = await createDocOfDatatype2(datatype, repo);
  const doc = docHandle.doc();

  if (!datatype.importUrl) {
    throw new Error(`Datatype "${datatype.id}" has no importUrl`);
  }
  const mod = await import(/* @vite-ignore */ datatype.importUrl);
  const name = mod.default.getTitle(doc);

  return {
    name,
    type: datatype.id,
    url: docHandle.url,
  };
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
                  const freshy = await createNew(
                    props.repo,
                    datatype,
                    props.hive
                  );
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
