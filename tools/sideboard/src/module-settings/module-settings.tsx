import { For, Suspense } from "solid-js";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import type { ModuleSettingsDoc } from "@patchwork/filesystem";
import type { PatchworkToolProps } from "../types.ts";
import { useTools } from "../sideboard/plugins.ts";
import { ToolCard } from "./tool-card.tsx";
import { ModuleInput } from "./module-input.tsx";

function swapWithEnd(list: any[], idx: number) {
  const end = list.length - 1;
  [list[idx], list[end]] = [list[end], list[idx]];
}

const add = (item: AutomergeUrl) => (doc: ModuleSettingsDoc) => {
  const idx = doc.modules.findIndex((mod) => item == mod);
  if (idx == -1) {
    doc.modules.push(item);
  } else {
    swapWithEnd(doc.modules, idx);
  }
};

const rm = (item: AutomergeUrl) => (doc: ModuleSettingsDoc) => {
  const idx = doc.modules.findIndex((mod) => item == mod);
  if (idx != -1) {
    swapWithEnd(doc.modules, idx);

    doc.modules.pop();
  }
};

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const tools = useTools();

  const doc = makeDocumentProjection(props.handle);

  const handleAddModule = (url: AutomergeUrl) => {
    props.handle.change(add(url));
  };

  return (
    <div class="module-settings">
      <div class="module-settings__header">
        <h1 class="module-settings__title">Modules</h1>
        <ModuleInput onAdd={handleAddModule} repo={props.repo} />
      </div>
      <div class="module-settings__content">
        <For each={tools}>
          {(tool) => {
            const installed = () =>
              isValidAutomergeUrl(tool.importUrl) &&
              doc.modules.includes(tool.importUrl as AutomergeUrl);

            const handleToggle = () => {
              const url = tool.importUrl as AutomergeUrl;
              props.handle.change((doc) => {
                if (installed()) {
                  add(url)(doc);
                } else {
                  rm(url)(doc);
                }
              });
            };

            return (
              <Suspense>
                <ToolCard
                  tool={tool}
                  installed={installed()}
                  onToggleInstall={handleToggle}
                  isValidUrl={isValidAutomergeUrl(tool.importUrl)}
                  repo={props.repo}
                />
              </Suspense>
            );
          }}
        </For>
      </div>
    </div>
  );
}
