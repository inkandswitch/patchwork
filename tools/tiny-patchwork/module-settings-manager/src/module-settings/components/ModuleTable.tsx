import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { type AutomergeUrl } from "@automerge/automerge-repo";
import { ViewRaw } from "./ViewRaw.tsx";
import { TrashIcon } from "../icons";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard.ts";
import type { EnrichedPlugin } from "../hooks/useModulePlugins.ts";

interface SiblingPlugin {
  importUrl: string;
  name: string;
  type: string;
}

interface ModuleTableProps {
  plugins: EnrichedPlugin[];
  allPlugins: SiblingPlugin[];
  sortOrder:
    | "name-asc"
    | "name-desc"
    | "type-asc"
    | "type-desc"
    | "id-asc"
    | "id-desc";
  onToggleSort: (column: "name" | "type" | "id") => void;
  onRemoveModule: (url: AutomergeUrl) => void;
  onToggleEnabled: (url: AutomergeUrl, enabled: boolean) => void;
}

function SwitchWithTooltip(props: {
  enabled: boolean;
  plugins: SiblingPlugin[];
  formatKind: (type: string) => string;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = createSignal(false);
  const [pos, setPos] = createSignal({ top: 0, right: 0 });
  let wrapperRef!: HTMLDivElement;

  const updatePos = () => {
    const rect = wrapperRef.getBoundingClientRect();
    setPos({
      top: rect.top,
      right: window.innerWidth - rect.right,
    });
  };

  return (
    <div
      ref={wrapperRef}
      class="module-settings-manager__switch-wrapper"
      onMouseEnter={() => {
        updatePos();
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <label class="module-settings-manager__switch">
        <input
          type="checkbox"
          checked={props.enabled}
          onChange={props.onToggle}
        />
        <span class="module-settings-manager__switch-slider" />
      </label>
      <Show when={hovered() && props.plugins.length > 0}>
        <Portal>
          <div
            class="module-settings-manager__tooltip"
            style={{
              position: "fixed",
              top: `${pos().top}px`,
              right: `${pos().right}px`,
              transform: "translateY(calc(-100% - 6px))",
            }}
          >
            <div class="module-settings-manager__tooltip-header">
              This will {props.enabled ? "disable" : "enable"}:
            </div>
            <ul class="module-settings-manager__tooltip-list">
              <For each={props.plugins}>
                {(p) => (
                  <li>
                    <span class="module-settings-manager__tooltip-kind">
                      {props.formatKind(p.type)}
                    </span>{" "}
                    {p.name}
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Portal>
      </Show>
    </div>
  );
}

export function ModuleTable(props: ModuleTableProps) {
  const [copiedIdText, copyId] = useCopyToClipboard();
  const [copiedUrlText, copyUrl] = useCopyToClipboard();

  const siblingsByUrl = createMemo(() => {
    const map = new Map<string, SiblingPlugin[]>();
    for (const p of props.allPlugins) {
      const url = p.importUrl as string;
      if (!map.has(url)) map.set(url, []);
      map.get(url)!.push(p);
    }
    return map;
  });

  function getPackagePlugins(plugin: EnrichedPlugin): SiblingPlugin[] {
    return siblingsByUrl().get(plugin.importUrl as string) || [];
  }

  function formatPluginKind(type: string): string {
    if (type === "patchwork:datatype") return "datatype";
    if (type === "patchwork:tool") return "tool";
    return type;
  }

  return (
    <div class="module-settings-manager__table-container">
      <table class="module-settings-manager__table">
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "15%" }} />
        </colgroup>
        <thead>
          <tr>
            <th
              class="module-settings-manager__sortable-header"
              onClick={() => props.onToggleSort("name")}
            >
              Name
              <span class="module-settings-manager__sort-indicator">
                {props.sortOrder.startsWith("name")
                  ? props.sortOrder === "name-asc"
                    ? " ▲"
                    : " ▼"
                  : ""}
              </span>
            </th>
            <th
              class="module-settings-manager__sortable-header"
              onClick={() => props.onToggleSort("type")}
            >
              Plugin Type
              <span class="module-settings-manager__sort-indicator">
                {props.sortOrder.startsWith("type")
                  ? props.sortOrder === "type-asc"
                    ? " ▲"
                    : " ▼"
                  : ""}
              </span>
            </th>

            <th
              class="module-settings-manager__sortable-header"
              onClick={() => props.onToggleSort("id")}
            >
              Tool ID
              <span class="module-settings-manager__sort-indicator">
                {props.sortOrder.startsWith("id")
                  ? props.sortOrder === "id-asc"
                    ? " ▲"
                    : " ▼"
                  : ""}
              </span>
            </th>
            <th>URL</th>
            <th>Data Types</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <For each={props.plugins}>
            {(plugin) => (
              <tr classList={{ "module-settings-manager__row--disabled": !plugin.enabled }}>

                <td class="module-settings-manager__table-name" title={plugin.name}>
                  <span class="module-settings-manager__table-name-text">{plugin.name}</span>
                </td>
                <td class="module-settings-manager__table-type" title={plugin.type}>
                  <span
                    class="module-settings-manager__type-pill"
                    classList={{
                      "module-settings-manager__type-pill--datatype":
                        plugin.type === "patchwork:datatype",
                      "module-settings-manager__type-pill--tool":
                        plugin.type === "patchwork:tool",
                      "module-settings-manager__type-pill--other":
                        plugin.type !== "patchwork:datatype" &&
                        plugin.type !== "patchwork:tool",
                    }}
                  >
                    {plugin.type}
                  </span>
                </td>
                <td class="module-settings-manager__table-id">
                  <Show
                    when={plugin.id}
                    fallback={<span style={{ opacity: 0.5 }}>—</span>}
                  >
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
                  <Show
                    when={plugin.isValidUrl && plugin.importUrl}
                    fallback={<span style={{ opacity: 0.5 }}>—</span>}
                  >
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
                <td class="module-settings-manager__table-datatypes" title={plugin.datatypesDisplay.values.join(", ")}>
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
                              "module-settings-manager__datatype-pill--any":
                                plugin.datatypesDisplay.type === "any",
                              "module-settings-manager__datatype-pill--none":
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
                    <SwitchWithTooltip
                      enabled={plugin.enabled}
                      plugins={getPackagePlugins(plugin)}
                      formatKind={formatPluginKind}
                      onToggle={() =>
                        props.onToggleEnabled(
                          plugin.importUrl as AutomergeUrl,
                          !plugin.enabled
                        )
                      }
                    />
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
                      style={{
                        display: "flex",
                        "align-items": "center",
                        gap: "0.5rem",
                      }}
                    >
                      <TrashIcon />
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
