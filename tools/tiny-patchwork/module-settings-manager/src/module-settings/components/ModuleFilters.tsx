import { For, Show, createSignal, onMount, onCleanup } from "solid-js";
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
    <div class="module-settings-manager__filter-bar">
      <div class="module-settings-manager__search-container">
        <SearchIcon class="module-settings-manager__search-icon" />
        <input
          type="text"
          class="module-settings-manager__search"
          placeholder="pizza..."
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
        <option value="">
          {isMobile() ? "Plugin Type" : "All Plugin Types"}
        </option>
        <For each={props.uniquePluginTypes}>
          {(type) => <option value={type}>{type}</option>}
        </For>
      </select>
      <select
        class="module-settings-manager__filter-select"
        value={props.filterDataType}
        onChange={(e) => props.onDataTypeChange(e.currentTarget.value)}
      >
        <option value="">{isMobile() ? "Data Type" : "All Data Types"}</option>
        <For each={props.uniqueDataTypes}>
          {(dataType) => <option value={dataType}>{dataType}</option>}
        </For>
      </select>
    </div>
  );
}
