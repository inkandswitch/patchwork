import { For, Show } from "solid-js";
import { ClearIcon, SearchIcon } from "../icons";
import { DebugToggle } from "./DebugToggle.tsx";

interface ModuleFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterPluginType: string;
  onPluginTypeChange: (value: string) => void;
  filterDataType: string;
  onDataTypeChange: (value: string) => void;
  uniquePluginTypes: string[];
  uniqueDataTypes: string[];
}

export function ModuleFilters(props: ModuleFiltersProps) {
  return (
    <div class="module-settings-manager__filter-bar">
      <div class="module-settings-manager__search-container">
        <SearchIcon class="module-settings-manager__search-icon" />
        <input
          type="text"
          class="module-settings-manager__search"
          placeholder="Search modules..."
          value={props.searchQuery}
          onInput={(e) => props.onSearchChange(e.currentTarget.value)}
        />
        <Show when={props.searchQuery}>
          <ClearIcon
            class="module-settings-manager__clear-icon"
            onClick={() => props.onSearchChange("")}
          />
        </Show>
      </div>
      <select
        class="module-settings-manager__filter-select"
        value={props.filterPluginType}
        onChange={(e) => props.onPluginTypeChange(e.currentTarget.value)}
      >
        <option value="">All Plugin Types</option>
        <For each={props.uniquePluginTypes}>
          {(type) => <option value={type}>{type}</option>}
        </For>
      </select>
      <select
        class="module-settings-manager__filter-select"
        value={props.filterDataType}
        onChange={(e) => props.onDataTypeChange(e.currentTarget.value)}
      >
        <option value="">All Data Types</option>
        <For each={props.uniqueDataTypes}>
          {(dataType) => <option value={dataType}>{dataType}</option>}
        </For>
      </select>
      <DebugToggle />
    </div>
  );
}
