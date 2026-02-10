import { For, Show } from "solid-js";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import { ViewRaw } from "./ViewRaw.tsx";
import { TrashIcon } from "../icons";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard.ts";
import type { EnrichedPlugin } from "../hooks/useModulePlugins.ts";

interface ModuleTableProps {
  plugins: EnrichedPlugin[];
  sortOrder: "name-asc" | "name-desc";
  onToggleSort: () => void;
  onRemoveModule: (url: AutomergeUrl) => void;
}

export function ModuleTable(props: ModuleTableProps) {
  const [copiedIdText, copyId] = useCopyToClipboard();
  const [copiedUrlText, copyUrl] = useCopyToClipboard();

  return (
    <div class="module-settings-manager__table-container">
      <table class="module-settings-manager__table">
        <thead>
          <tr>
            <th
              class="module-settings-manager__sortable-header"
              onClick={props.onToggleSort}
            >
              Name
              <span class="module-settings-manager__sort-indicator">
                {props.sortOrder === "name-asc" ? " ▲" : " ▼"}
              </span>
            </th>
            <th>Plugin Type</th>
            <th>Identifiers</th>
            <th>Supported Data Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.plugins}>
            {(plugin) => (
              <tr>
                <td class="module-settings-manager__table-name">
                  {plugin.name}
                </td>
                <td class="module-settings-manager__table-type">
                  {plugin.type}
                </td>
                <td class="module-settings-manager__table-id-url">
                  <div class="module-settings-manager__id-url-group">
                    <Show when={plugin.id}>
                      <div class="module-settings-manager__id-url-row">
                        <span class="module-settings-manager__id-url-label">
                          ID:
                        </span>
                        <code
                          class="module-settings-manager__copyable"
                          classList={{
                            "module-settings__copyable--copied":
                              copiedIdText() === plugin.id,
                          }}
                          onClick={() => copyId(plugin.id)}
                          title="Click to copy ID"
                        >
                          {copiedIdText() === plugin.id ? "Copied!" : plugin.id}
                        </code>
                      </div>
                    </Show>
                    <Show when={plugin.isValidUrl && plugin.importUrl}>
                      <div class="module-settings-manager__id-url-row">
                        <span class="module-settings-manager__id-url-label">
                          URL:
                        </span>
                        <code
                          class="module-settings-manager__copyable"
                          classList={{
                            "module-settings__copyable--copied":
                              copiedUrlText() === plugin.importUrl,
                          }}
                          onClick={() => copyUrl(plugin.importUrl as string)}
                          title="Click to copy URL"
                        >
                          {copiedUrlText() === plugin.importUrl
                            ? "Copied!"
                            : plugin.importUrl}
                        </code>
                      </div>
                    </Show>
                  </div>
                </td>
                <td class="module-settings-manager__table-datatypes">
                  <div class="module-settings-manager__datatypes-pills">
                    <Show
                      when={plugin.datatypesDisplay.type !== "empty"}
                      fallback={
                        <span class="module-settings-manager__datatype-pill module-settings__datatype-pill--empty">
                          —
                        </span>
                      }
                    >
                      <For each={plugin.datatypesDisplay.values}>
                        {(datatype) => (
                          <span
                            class="module-settings-manager__datatype-pill"
                            classList={{
                              "module-settings__datatype-pill--any":
                                plugin.datatypesDisplay.type === "any",
                              "module-settings__datatype-pill--none":
                                plugin.datatypesDisplay.type === "none",
                            }}
                          >
                            {datatype}
                          </span>
                        )}
                      </For>
                    </Show>
                  </div>
                </td>
                <td class="module-settings-manager__table-actions">
                  <div class="module-settings-manager__action-buttons">
                    <Show when={plugin.isValidUrl}>
                      <ViewRaw
                        url={plugin.importUrl as AutomergeUrl}
                        class="module-settings-manager__view-raw-button"
                      />
                    </Show>
                    <button
                      class="module-settings-manager__remove-btn"
                      onClick={() =>
                        props.onRemoveModule(plugin.importUrl as AutomergeUrl)
                      }
                      title="Uninstall"
                      style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}
                    >
                      <TrashIcon />
                      <span>Uninstall</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
