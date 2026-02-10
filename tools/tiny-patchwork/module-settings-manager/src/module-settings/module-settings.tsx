import "../index.css";
import { createSignal, onCleanup } from "solid-js";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { ModuleSettingsDoc } from "@inkandswitch/patchwork-filesystem";
import type { PatchworkToolProps } from "../types.ts";
import {
  AccountUrlInput,
  ModuleFilters,
  ModuleTable,
  ModuleInput,
} from "./components";
import { useModulePlugins } from "./hooks/useModulePlugins.ts";
import { MODULE_FETCH_DEBOUNCE } from "./constants.ts";

export function ModuleSettings(props: PatchworkToolProps<ModuleSettingsDoc>) {
  const [searchInputValue, setSearchInputValue] = createSignal("");
  const [debouncedSearch, setDebouncedSearch] = createSignal("");
  const [sortOrder, setSortOrder] = createSignal<"name-asc" | "name-desc">(
    "name-asc"
  );
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
  const { filteredPlugins, uniquePluginTypes, uniqueDataTypes } =
    useModulePlugins({
      modules: doc.modules,
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
    });
  };

  const handleToggleSort = () => {
    setSortOrder(sortOrder() === "name-asc" ? "name-desc" : "name-asc");
  };

  const isModuleInstalled = (url: AutomergeUrl) => {
    return doc.modules.includes(url);
  };

  return (
    <div class="module-settings-manager">
      <div class="module-settings-manager__header">
        <h1 class="module-settings-manager__title">Modules</h1>
        <AccountUrlInput />

        <ModuleInput
          onAdd={handleAddModule}
          isInstalled={isModuleInstalled}
          repo={props.repo}
        />
      </div>
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
        />
        <ModuleTable
          plugins={filteredPlugins()}
          sortOrder={sortOrder()}
          onToggleSort={handleToggleSort}
          onRemoveModule={handleRemoveModule}
        />
      </div>
    </div>
  );
}
