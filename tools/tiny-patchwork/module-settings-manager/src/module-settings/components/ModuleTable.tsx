import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
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
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= 768);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  onMount(() => {
    window.addEventListener("resize", handleResize);
  });

  onCleanup(() => {
    window.removeEventListener("resize", handleResize);
  });

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
            <Show when={!isMobile()}>
              <th>Identifiers</th>
            </Show>
            <Show when={isMobile()}>
              <th>Tool ID</th>
              <th>URL</th>
            </Show>
            <th>Data Types</th>
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
                <Show when={!isMobile()}>
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
                              "module-settings-manager__copyable--copied":
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
                              "module-settings-manager__copyable--copied":
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
                </Show>
                <Show when={isMobile()}>
                  <td class="module-settings-manager__table-id">
                    <Show when={plugin.id} fallback={<span style={{ opacity: 0.5 }}>—</span>}>
                      <code
                        class="module-settings-manager__copyable"
                        classList={{
                          "module-settings-manager__copyable--copied":
                            copiedIdText() === plugin.id,
                        }}
                        onClick={() => copyId(plugin.id)}
                        title="Click to copy ID"
                      >
                        {copiedIdText() === plugin.id ? "Copied!" : plugin.id}
                      </code>
                    </Show>
                  </td>
                  <td class="module-settings-manager__table-url">
                    <Show when={plugin.isValidUrl && plugin.importUrl} fallback={<span style={{ opacity: 0.5 }}>—</span>}>
                      <code
                        class="module-settings-manager__copyable"
                        classList={{
                          "module-settings-manager__copyable--copied":
                            copiedUrlText() === plugin.importUrl,
                        }}
                        onClick={() => copyUrl(plugin.importUrl as string)}
                        title="Click to copy URL"
                      >
                        {copiedUrlText() === plugin.importUrl
                          ? "Copied!"
                          : plugin.importUrl}
                      </code>
                    </Show>
                  </td>
                </Show>
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
                      <span class="module-settings-manager__button-text">Uninstall</span>
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
