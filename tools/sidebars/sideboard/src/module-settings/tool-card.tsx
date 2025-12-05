import { Show, For, createSignal } from "solid-js";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import type { Repo } from "@automerge/automerge-repo";
import { ViewSource } from "./view-source.tsx";

interface ToolCardProps {
  tool: {
    name: string;
    importUrl?: string;
    supportedDatatypes?: string[] | string;
  };
  installed: boolean;
  onUninstall?: () => void;
  isValidUrl: boolean;
  repo: Repo;
}

export function ToolCard(props: ToolCardProps) {
  const [copied, setCopied] = createSignal(false);

  const handleCopyUrl = async () => {
    if (props.tool.importUrl) {
      try {
        await navigator.clipboard.writeText(props.tool.importUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
          classList={{ "tool-card__url--copied": copied() }}
          onClick={handleCopyUrl}
          title={props.tool.importUrl}
        >
          <code>{copied() ? "Copied!" : props.tool.importUrl}</code>
        </div>
      </Show>

      <Show when={props.tool.supportedDatatypes !== undefined}>
        <div class="tool-card__datatypes">
          <h3>Supported data types</h3>
          <div class="tool-card__datatypes-pills">
            <Show
              when={
                Array.isArray(props.tool.supportedDatatypes) &&
                props.tool.supportedDatatypes.length > 0 &&
                !props.tool.supportedDatatypes.includes("*")
              }
              fallback={
                <Show
                  when={
                    !Array.isArray(props.tool.supportedDatatypes) ||
                    props.tool.supportedDatatypes.includes("*")
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
              <For each={props.tool.supportedDatatypes as string[]}>
                {(dt) => <span class="tool-card__datatype-pill">{dt}</span>}
              </For>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={props.isValidUrl}>
        <div class="tool-card__footer-actions">
          <ViewSource
            moduleUrl={props.tool.importUrl as AutomergeUrl}
            repo={props.repo}
          />
          <Show when={props.onUninstall}>
            <button class="tool-card__uninstall" onClick={props.onUninstall}>
              Uninstall
            </button>
          </Show>
        </div>
      </Show>
    </article>
  );
}
