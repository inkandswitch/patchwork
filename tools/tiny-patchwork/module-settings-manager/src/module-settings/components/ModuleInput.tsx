import { createSignal, Show, createEffect, onCleanup, For } from "solid-js";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";
import type { FolderDoc } from "@inkandswitch/patchwork-filesystem";
import { automergeUrlToServiceWorkerUrl } from "@inkandswitch/patchwork-filesystem";
import { ViewRaw } from "./ViewRaw.tsx";
import { ClearIcon, InstallIcon } from "../icons/index.ts";
import { MODULE_FETCH_DEBOUNCE } from "../constants.ts";

interface ModuleInputProps {
  isInstalled: (url: AutomergeUrl) => boolean;
  onAdd: (url: AutomergeUrl) => void;
  repo: Repo;
}

interface PackageInfo {
  name?: string;
  version?: string;
  plugins?: Array<{ id: string; name: string; type: string }>;
}

interface ModulePreview {
  isFolder: boolean;
  packageInfo?: PackageInfo;
  error?: string;
}

export function ModuleInput(props: ModuleInputProps) {
  const [input, setInput] = createSignal("");
  const [isValid, setIsValid] = createSignal<boolean | null>(null);
  const [preview, setPreview] = createSignal<ModulePreview | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [previewUrl, setPreviewUrl] = createSignal<AutomergeUrl | null>(null);

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const value = input().trim();

    if (!value) {
      setIsValid(null);
      setPreview(null);
      setPreviewUrl(null);
      return;
    }

    const valid = isValidAutomergeUrl(value);
    setIsValid(valid);

    if (valid) {
      // Debounce the fetch
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        setIsLoading(true);
        setPreview(null);
        setPreviewUrl(value as AutomergeUrl);

        try {
          const handle = await props.repo.find(value as AutomergeUrl);
          await handle.whenReady();
          const doc = handle.doc();

          if (!doc) {
            setPreview({
              isFolder: false,
              error: "Document not found",
            });
            return;
          }

          // Check if it's a folder document
          const isFolder = isFolderDoc(doc);

          if (!isFolder) {
            setPreview({
              isFolder: false,
              error: "Not a folder document (modules must be folders)",
            });
            return;
          }

          // Try to fetch package.json
          let packageInfo: PackageInfo | undefined;
          try {
            const packageJsonUrl = new URL(
              "package.json",
              new URL(
                automergeUrlToServiceWorkerUrl(value as AutomergeUrl),
                window.location.origin
              )
            ).href;

            const response = await fetch(packageJsonUrl);
            if (response.ok) {
              const pkgJson = await response.json();
              packageInfo = {
                name: pkgJson.name,
                version: pkgJson.version,
                plugins: pkgJson.plugins,
              };
            }
          } catch (err) {
            // Package.json fetch failed, but we can still show it's a valid folder
            console.warn("Failed to fetch package.json:", err);
          }

          setPreview({
            isFolder: true,
            packageInfo,
          });
        } catch (error) {
          setPreview({
            isFolder: false,
            error:
              error instanceof Error ? error.message : "Failed to fetch module",
          });
        } finally {
          setIsLoading(false);
        }
      }, MODULE_FETCH_DEBOUNCE);
    } else {
      setPreview(null);
    }
  });

  onCleanup(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  const handleAdd = () => {
    const value = input().trim();
    if (isValid() && value) {
      props.onAdd(value as AutomergeUrl);
      setInput("");
      setIsValid(null);
      setPreview(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && isValid() && input().trim()) {
      e.preventDefault();
      handleAdd();
    }
  };

  const hasValidation = () =>
    Boolean(
      input().trim() &&
      (isValid() === false || isLoading() || preview() !== null)
    );

  return (
    <div class="module-settings-module-input">
      <div
        class="module-settings-module-input__row"
        style={{ display: "flex", gap: "0.5rem", "align-items": "center" }}
      >
        <div
          class="module-settings-module-input__input-container"
          style={{ flex: "1", "min-width": "0" }}
        >
          <InstallIcon class="module-settings-module-input__install-icon" />
          <input
            class="module-settings-module-input__field"
            classList={{
              "module-input__field--has-validation": hasValidation(),
            }}
            type="text"
            value={input()}
            onInput={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="automerge:..."
            autofocus
          />
          <Show when={input().trim()}>
            <ClearIcon
              class="module-settings-module-input__clear-icon"
              onClick={() => {
                setInput("");
                setIsValid(null);
                setPreview(null);
                setPreviewUrl(null);
              }}
            />
          </Show>
        </div>
        <button
          class="module-settings-module-input__add-button"
          onClick={handleAdd}
          disabled={
            !isValid() || !input().trim() || props.isInstalled(previewUrl()!)
          }
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.5rem",
            "flex-shrink": "0",
          }}
        >
          <InstallIcon />
          <span>Install</span>
        </button>
      </div>

      <Show when={hasValidation()}>
        <div class="module-settings-module-input__validation">
          <Show when={input().trim() && isValid() === false}>
            <div class="module-settings-module-input__error">
              Invalid Automerge URL
            </div>
          </Show>

          <Show when={isLoading()}>
            <div class="module-settings-module-input__loading">
              Loading module details...
            </div>
          </Show>

          <Show when={preview() && !isLoading()}>
            <div class="module-settings-module-input__preview">
              <Show when={preview()?.error}>
                <div class="module-settings-module-input__preview-error">
                  ⚠️ {preview()?.error}
                </div>
              </Show>
              <Show when={!preview()?.error}>
                <Show when={preview()?.packageInfo}>
                  <div class="module-settings-module-input__package-info">
                    <Show when={preview()?.packageInfo?.name}>
                      <div class="module-settings-module-input__package-row">
                        <span class="module-settings-module-input__package-label">
                          Name:
                        </span>
                        <span class="module-settings-module-input__package-value">
                          {preview()?.packageInfo?.name}
                        </span>
                      </div>
                    </Show>
                    <Show when={preview()?.packageInfo?.version}>
                      <div class="module-settings-module-input__package-row">
                        <span class="module-settings-module-input__package-label">
                          Version:
                        </span>
                        <span class="module-settings-module-input__package-value">
                          {preview()?.packageInfo?.version}
                        </span>
                      </div>
                    </Show>
                    <Show when={preview()?.packageInfo?.plugins?.length}>
                      <div class="module-settings-module-input__package-row">
                        <span class="module-settings-module-input__package-label">
                          Plugins:
                        </span>
                        <div class="module-settings-module-input__plugins">
                          <For each={preview()?.packageInfo?.plugins}>
                            {(plugin) => (
                              <span class="module-settings-module-input__plugin-pill">
                                {plugin.name || plugin.id}
                              </span>
                            )}
                          </For>
                        </div>
                      </div>
                    </Show>
                  </div>
                </Show>
                <Show when={!preview()?.packageInfo}>
                  <div class="module-settings-module-input__no-package">
                    📁 Valid folder (no package.json found)
                  </div>
                </Show>
                <Show when={previewUrl()}>
                  <div class="module-settings-module-input__actions">
                    <ViewRaw
                      url={previewUrl()!}
                      class="module-settings-module-input__view-raw-button"
                    />
                    <Show when={props.isInstalled(previewUrl()!)}>
                      <span class="module-settings-module-input__installed-pill">
                        Installed
                      </span>
                    </Show>
                  </div>
                </Show>
              </Show>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function isFolderDoc(doc: unknown): doc is FolderDoc {
  return Boolean(
    doc &&
    typeof doc === "object" &&
    "docs" in doc &&
    Array.isArray((doc as { docs?: unknown }).docs)
  );
}
