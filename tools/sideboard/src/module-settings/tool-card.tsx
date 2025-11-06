import { Show, For } from "solid-js";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Repo } from "@automerge/automerge-repo";
import { ViewSource } from "./view-source.tsx";

interface ToolCardProps {
  tool: {
    name: string;
    importUrl?: string;
    supportedDataTypes?: string[] | string;
  };
  installed: boolean;
  onToggleInstall: () => void;
  isValidUrl: boolean;
  repo: Repo;
}

export function ToolCard(props: ToolCardProps) {
  const handleCopyUrl = async () => {
    if (props.tool.importUrl) {
      try {
        await navigator.clipboard.writeText(props.tool.importUrl);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  };

  return (
    <article class="tool-card">
      <h2 class="tool-card__name">{props.tool.name}</h2>

      <Show when={props.tool.importUrl}>
        <div
          class="tool-card__url"
          onClick={handleCopyUrl}
          title={props.tool.importUrl}
        >
          <code>{props.tool.importUrl}</code>
        </div>
      </Show>

      <Show when={props.isValidUrl}>
        <label class="tool-card__checkbox">
          <input
            type="checkbox"
            checked={props.installed}
            onInput={props.onToggleInstall}
          />
          <span>Load at startup</span>
        </label>
      </Show>

      <div class="tool-card__datatypes">
        <h3>Supported data types</h3>
        <div class="tool-card__datatypes-pills">
          <Show
            when={
              Array.isArray(props.tool.supportedDataTypes) &&
              props.tool.supportedDataTypes.length > 0 &&
              !props.tool.supportedDataTypes.includes("*")
            }
            fallback={
              <Show
                when={
                  !Array.isArray(props.tool.supportedDataTypes) ||
                  props.tool.supportedDataTypes.includes("*")
                }
                fallback={
                  <span class="tool-card__datatype-pill tool-card__datatype-pill--none">
                    None
                  </span>
                }
              >
                <span class="tool-card__datatype-pill tool-card__datatype-pill--any">
                  Any
                </span>
              </Show>
            }
          >
            <For each={props.tool.supportedDataTypes as string[]}>
              {(dt) => <span class="tool-card__datatype-pill">{dt}</span>}
            </For>
          </Show>
        </div>
      </div>

      <Show when={props.isValidUrl}>
        <ViewSource
          moduleUrl={props.tool.importUrl as AutomergeUrl}
          repo={props.repo}
        />
      </Show>
    </article>
  );
}
