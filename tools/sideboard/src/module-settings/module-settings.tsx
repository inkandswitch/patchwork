import { For, Suspense, createMemo, createSignal } from "solid-js";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import type { ModuleSettingsDoc } from "@patchwork/filesystem";
import type { PatchworkToolProps } from "../types.ts";
import { useModules } from "@patchwork/solidjs";
import { ToolCard } from "./tool-card.tsx";
import { ModuleInput } from "./module-input.tsx";

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const pluginsByTypeArray = useModules();
  const [searchQuery, setSearchQuery] = createSignal("");

  const doc = makeDocumentProjection(props.handle);

  // Filter plugins based on search query
  const filteredPluginsByType = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return pluginsByTypeArray;

    return pluginsByTypeArray
      .map(
        ([type, plugins]) =>
          [
            type,
            plugins.filter(
              (plugin) =>
                plugin.name.toLowerCase().includes(query) ||
                type.toLowerCase().includes(query) ||
                plugin.importUrl?.toLowerCase().includes(query)
            ),
          ] as const
      )
      .filter(([, plugins]) => plugins.length > 0);
  });

  const handleAddModule = (url: AutomergeUrl) => {
    props.handle.change((doc) => {
      if (!doc.modules.includes(url)) {
        doc.modules.push(url);
      }
    });
  };

  const handleRemoveModule = (url: AutomergeUrl) => {
    props.handle.change((doc) => {
      const idx = doc.modules.indexOf(url);
      if (idx !== -1) {
        doc.modules.splice(idx, 1);
      }
    });
  };

  return (
    <div class="module-settings">
      <div class="module-settings__header">
        <h1 class="module-settings__title">Modules</h1>
        <input
          type="text"
          class="module-settings__search"
          placeholder="Search modules..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <ModuleInput onAdd={handleAddModule} repo={props.repo} />
      </div>
      <div class="module-settings__content">
        <For each={filteredPluginsByType()}>
          {([type, plugins]) => (
            <div>
              <h2 class="module-settings__type-header">{type}</h2>
              <div class="module-settings__type-section">
                <For each={plugins}>
                  {(plugin) => {
                    const installed = () =>
                      isValidAutomergeUrl(plugin.importUrl) &&
                      doc.modules.includes(plugin.importUrl as AutomergeUrl);

                    return (
                      <Suspense>
                        <ToolCard
                          tool={plugin}
                          installed={installed()}
                          onUninstall={
                            installed()
                              ? () =>
                                  handleRemoveModule(
                                    plugin.importUrl as AutomergeUrl
                                  )
                              : undefined
                          }
                          isValidUrl={isValidAutomergeUrl(plugin.importUrl)}
                          repo={props.repo}
                        />
                      </Suspense>
                    );
                  }}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
