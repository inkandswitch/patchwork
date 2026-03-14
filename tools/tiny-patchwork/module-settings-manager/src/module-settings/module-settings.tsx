import "../index.css";
import { createSignal, onCleanup } from "solid-js";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { ModuleSettingsDoc } from "@inkandswitch/patchwork-filesystem";
import type { PatchworkToolProps } from "../types.ts";
import { ModuleFilters, ModuleTable } from "./components";
import { useModulePlugins } from "./hooks/useModulePlugins.ts";
import { MODULE_FETCH_DEBOUNCE } from "./constants.ts";
import { DebugToggle } from "./components/DebugToggle.tsx";

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const [searchInputValue, setSearchInputValue] = createSignal("");
  const [debouncedSearch, setDebouncedSearch] = createSignal("");
  const [sortOrder, setSortOrder] = createSignal<
    "name-asc" | "name-desc" | "type-asc" | "type-desc" | "id-asc" | "id-desc"
  >("name-asc");
  const [filterPluginType, setFilterPluginType] = createSignal<string>("");
  const [filterDataType, setFilterDataType] = createSignal<string>("");
  const doc = makeDocumentProjection(props.handle);

  // Debounce search to avoid expensive filtering on every keystroke
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);

    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, MODULE_FETCH_DEBOUNCE);
  };

  onCleanup(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
  });

  // Load and filter plugins
  const { allPlugins, filteredPlugins, uniquePluginTypes, uniqueDataTypes } =
    useModulePlugins({
      modules: doc.modules,
      disabled: doc.disabled ?? [],
      searchQuery: debouncedSearch,
      filterPluginType,
      filterDataType,
      sortOrder,
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
      const disabledIdx = (doc.disabled ?? []).indexOf(url);
      if (disabledIdx !== -1) {
        doc.disabled!.splice(disabledIdx, 1);
      }
    });
  };

  const handleToggleEnabled = (url: AutomergeUrl, enabled: boolean) => {
    props.handle.change((doc) => {
      if (!doc.modules) {
        doc.modules = [];
      }
      if (!doc.disabled) {
        doc.disabled = [];
      }
      if (enabled) {
        // Move from disabled to modules
        const disabledIdx = doc.disabled.findIndex((u) => u === url);
        if (disabledIdx !== -1) {
          doc.disabled.splice(disabledIdx, 1);
        }
        if (!doc.modules.some((u) => u === url)) {
          doc.modules.push(url);
        }
      } else {
        // Move from modules to disabled
        const idx = doc.modules.findIndex((u) => u === url);
        if (idx !== -1) {
          doc.modules.splice(idx, 1);
        }
        if (!doc.disabled.some((u) => u === url)) {
          doc.disabled.push(url);
        }
      }
    });
  };

  const handleToggleSort = (column: "name" | "type" | "id") => {
    const current = sortOrder();
    if (current.startsWith(column)) {
      setSortOrder(
        current.endsWith("-asc") ? `${column}-desc` : `${column}-asc`
      );
    } else {
      setSortOrder(`${column}-asc`);
    }
  };

  const isModuleInstalled = (url: AutomergeUrl) => {
    return doc.modules.includes(url) || (doc.disabled ?? []).includes(url);
  };

  return (
    <div class="module-settings-manager">
      <div class="module-settings-manager__content-container">
        <h2 class="module-settings-manager__title">Plugins</h2>

        <div class="module-settings-manager__content">
          <ModuleFilters
            searchQuery={searchInputValue()}
            onSearchChange={handleSearchChange}
            filterPluginType={filterPluginType()}
            onPluginTypeChange={setFilterPluginType}
            filterDataType={filterDataType()}
            onDataTypeChange={setFilterDataType}
            uniquePluginTypes={uniquePluginTypes()}
            uniqueDataTypes={uniqueDataTypes()}
            repo={props.repo}
            onAdd={handleAddModule}
            isInstalled={isModuleInstalled}
          />
          <ModuleTable
            plugins={filteredPlugins()}
            allPlugins={allPlugins()}
            sortOrder={sortOrder()}
            onToggleSort={handleToggleSort}
            onRemoveModule={handleRemoveModule}
            onToggleEnabled={handleToggleEnabled}
          />
        </div>
      </div>

      <footer class="module-settings-manager__footer">
        <DebugToggle />
      </footer>
    </div>
  );
}
