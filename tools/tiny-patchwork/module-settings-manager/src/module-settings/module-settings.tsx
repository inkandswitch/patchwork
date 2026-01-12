import "../index.css";
import { For, Show, createMemo, createResource, createSignal } from "solid-js";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
} from "@automerge/automerge-repo";
import {
  type ModuleSettingsDoc,
  importModuleFromFolderDocUrl,
} from "@inkandswitch/patchwork-filesystem";
import type { PatchworkToolProps } from "../types.ts";
import { ModuleInput } from "./module-input.tsx";
import { AccountUrlInput } from "./account-url-input.tsx";
import { DebugToggle } from "./debug-toggle.tsx";
import { ViewRaw } from "./view-raw.tsx";
import { SearchIcon } from "./icons/search-icon.tsx";
import { ClearIcon } from "./icons/clear-icon.tsx";
import type {
  Plugin,
  PluginDescription,
} from "@inkandswitch/patchwork-plugins";

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [sortOrder, setSortOrder] = createSignal<"name-asc" | "name-desc">(
    "name-asc"
  );
  const [filterPluginType, setFilterPluginType] = createSignal<string>("");
  const [filterDataType, setFilterDataType] = createSignal<string>("");
  const doc = makeDocumentProjection(props.handle);

  // Load all plugins from user's modules
  const [allPlugins] = createResource(
    () => doc.modules,
    async (moduleUrls) => {
      const pluginArrays = await Promise.all(
        moduleUrls.map(async (url) => {
          const module = await importModuleFromFolderDocUrl(url);
          return module?.plugins || [];
        })
      );
      return pluginArrays.flat();
    }
  );

  // Get unique plugin types for filter dropdown
  const uniquePluginTypes = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];
    const types = new Set(plugins.map((p) => p.type));
    return Array.from(types).sort();
  });

  // Get unique data types for filter dropdown
  const uniqueDataTypes = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];
    const dataTypes = new Set<string>();
    plugins.forEach((plugin) => {
      if ("supportedDatatypes" in plugin) {
        const datatypes = plugin.supportedDatatypes as
          | string[]
          | string
          | undefined;
        if (Array.isArray(datatypes)) {
          datatypes.forEach((dt) => dataTypes.add(dt));
        } else if (datatypes === "*") {
          dataTypes.add("Any");
        }
      }
    });
    return Array.from(dataTypes).sort();
  });

  // Filter and sort plugins by search query
  const filteredPlugins = createMemo(() => {
    const plugins = allPlugins();
    if (!plugins) return [];

    const query = searchQuery().toLowerCase();
    const pluginTypeFilter = filterPluginType();
    const dataTypeFilter = filterDataType();

    // Filter plugins by search query, plugin type, and data type
    const filtered = plugins.filter((plugin) => {
      // Apply search query filter
      if (query) {
        const matchesQuery =
          plugin.name.toLowerCase().includes(query) ||
          plugin.type.toLowerCase().includes(query) ||
          plugin.id?.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Apply plugin type filter
      if (pluginTypeFilter && plugin.type !== pluginTypeFilter) {
        return false;
      }

      // Apply data type filter
      if (dataTypeFilter) {
        if ("supportedDatatypes" in plugin) {
          const datatypes = plugin.supportedDatatypes as
            | string[]
            | string
            | undefined;
          if (Array.isArray(datatypes)) {
            if (!datatypes.includes(dataTypeFilter)) return false;
          } else if (datatypes === "*" && dataTypeFilter === "Any") {
            // Match "Any" filter
          } else if (datatypes !== "*") {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    });

    // Sort by name based on sortOrder
    return filtered.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return sortOrder() === "name-asc" ? nameCompare : -nameCompare;
    });
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

  const handleToggleSort = () => {
    setSortOrder(sortOrder() === "name-asc" ? "name-desc" : "name-asc");
  };

  const getSupportedDatatypesDisplay = (
    supportedDatatypes?: string[] | string
  ) => {
    if (!supportedDatatypes) return { type: "empty", values: [] };
    if (
      !Array.isArray(supportedDatatypes) ||
      supportedDatatypes.includes("*")
    ) {
      return { type: "any", values: ["Any"] };
    }
    if (supportedDatatypes.length === 0)
      return { type: "none", values: ["None"] };
    return { type: "list", values: supportedDatatypes };
  };

  const [copiedId, setCopiedId] = createSignal<string | null>(null);
  const [copiedUrl, setCopiedUrl] = createSignal<string | null>(null);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const renderModuleTable = (plugins: Plugin<PluginDescription>[]) => (
    <div class="module-settings-manager__table-container">
      <table class="module-settings-manager__table">
        <thead>
          <tr>
            <th
              class="module-settings-manager__sortable-header"
              onClick={handleToggleSort}
            >
              Name
              <span class="module-settings-manager__sort-indicator">
                {sortOrder() === "name-asc" ? " ▲" : " ▼"}
              </span>
            </th>
            <th>Plugin Type</th>
            <th>Identifiers</th>
            <th>Supported Data Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <For each={plugins}>
            {(plugin) => {
              const isValidUrl = isValidAutomergeUrl(plugin.importUrl);
              const datatypesDisplay = getSupportedDatatypesDisplay(
                "supportedDatatypes" in plugin
                  ? (plugin.supportedDatatypes as string[] | string | undefined)
                  : undefined
              );

              return (
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
                                copiedId() === plugin.id,
                            }}
                            onClick={() => handleCopyId(plugin.id)}
                            title="Click to copy ID"
                          >
                            {copiedId() === plugin.id ? "Copied!" : plugin.id}
                          </code>
                        </div>
                      </Show>
                      <Show when={isValidUrl && plugin.importUrl}>
                        <div class="module-settings-manager__id-url-row">
                          <span class="module-settings-manager__id-url-label">
                            URL:
                          </span>
                          <code
                            class="module-settings-manager__copyable"
                            classList={{
                              "module-settings__copyable--copied":
                                copiedUrl() === plugin.importUrl,
                            }}
                            onClick={() =>
                              handleCopyUrl(plugin.importUrl as string)
                            }
                            title="Click to copy URL"
                          >
                            {copiedUrl() === plugin.importUrl
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
                        when={datatypesDisplay.type !== "empty"}
                        fallback={
                          <span class="module-settings-manager__datatype-pill module-settings__datatype-pill--empty">
                            —
                          </span>
                        }
                      >
                        <For each={datatypesDisplay.values}>
                          {(datatype) => (
                            <span
                              class="module-settings-manager__datatype-pill"
                              classList={{
                                "module-settings__datatype-pill--any":
                                  datatypesDisplay.type === "any",
                                "module-settings__datatype-pill--none":
                                  datatypesDisplay.type === "none",
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
                      <Show when={isValidUrl}>
                        <ViewRaw
                          url={plugin.importUrl as AutomergeUrl}
                          class="module-settings-manager__view-raw-button"
                        />
                      </Show>
                      <button
                        class="module-settings-manager__remove-btn"
                        onClick={() =>
                          handleRemoveModule(plugin.importUrl as AutomergeUrl)
                        }
                        title="Uninstall"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          </For>
        </tbody>
      </table>
    </div>
  );

  return (
    <div class="module-settings-manager">
      <div class="module-settings-manager__header">
        <h1 class="module-settings-manager__title">Modules</h1>
        <AccountUrlInput />

        <ModuleInput
          onAdd={handleAddModule}
          isInstalled={(url: AutomergeUrl) => doc.modules.includes(url)}
          repo={props.repo}
        />
      </div>
      <div class="module-settings-manager__content">
        <div class="module-settings-manager__filter-bar">
          <div class="module-settings-manager__search-container">
            <SearchIcon class="module-settings-manager__search-icon" />
            <input
              type="text"
              class="module-settings-manager__search"
              placeholder="Search modules..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
            />
            <Show when={searchQuery()}>
              <ClearIcon
                class="module-settings-manager__clear-icon"
                onClick={() => setSearchQuery("")}
              />
            </Show>
          </div>
          <select
            class="module-settings-manager__filter-select"
            value={filterPluginType()}
            onChange={(e) => setFilterPluginType(e.currentTarget.value)}
          >
            <option value="">All Plugin Types</option>
            <For each={uniquePluginTypes()}>
              {(type) => <option value={type}>{type}</option>}
            </For>
          </select>
          <select
            class="module-settings-manager__filter-select"
            value={filterDataType()}
            onChange={(e) => setFilterDataType(e.currentTarget.value)}
          >
            <option value="">All Data Types</option>
            <For each={uniqueDataTypes()}>
              {(dataType) => <option value={dataType}>{dataType}</option>}
            </For>
          </select>
          <DebugToggle />
        </div>
        {renderModuleTable(filteredPlugins())}
      </div>
    </div>
  );
}
