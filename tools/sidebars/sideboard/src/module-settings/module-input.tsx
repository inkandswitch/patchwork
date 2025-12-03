import { createSignal, Show, createEffect, onCleanup, For } from "solid-js";
import {
  isValidAutomergeUrl,
  type AutomergeUrl,
  type Repo,
} from "@automerge/automerge-repo";
import { ViewSource } from "./view-source.tsx";
import type { FolderDoc } from "@patchwork/filesystem";
import { automergeUrlToServiceWorkerUrl } from "@patchwork/filesystem";

interface ModuleInputProps {
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
      }, 300);
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
    input().trim() &&
    (isValid() === false || isLoading() || preview() !== null);

  return (
    <div class="module-input">
      <input
        class="module-input__field"
        classList={{
          "module-input__field--has-validation": hasValidation(),
        }}
        type="text"
        value={input()}
        onInput={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter module URL (automerge:...)"
      />

      <Show when={hasValidation()}>
        <div class="module-input__validation">
          <Show when={input().trim() && isValid() === false}>
            <div class="module-input__error">Invalid Automerge URL</div>
          </Show>

          <Show when={isLoading()}>
            <div class="module-input__loading">Loading module details...</div>
          </Show>

          <Show when={preview() && !isLoading()}>
            <div class="module-input__preview">
          <Show when={preview()?.error}>
            <div class="module-input__preview-error">⚠️ {preview()?.error}</div>
          </Show>
          <Show when={!preview()?.error}>
            <Show when={preview()?.packageInfo}>
              <div class="module-input__package-info">
                <Show when={preview()?.packageInfo?.name}>
                  <div class="module-input__package-row">
                    <span class="module-input__package-label">Name:</span>
                    <span class="module-input__package-value">
                      {preview()?.packageInfo?.name}
                    </span>
                  </div>
                </Show>
                <Show when={preview()?.packageInfo?.version}>
                  <div class="module-input__package-row">
                    <span class="module-input__package-label">Version:</span>
                    <span class="module-input__package-value">
                      {preview()?.packageInfo?.version}
                    </span>
                  </div>
                </Show>
                <Show when={preview()?.packageInfo?.plugins?.length}>
                  <div class="module-input__package-row">
                    <span class="module-input__package-label">Plugins:</span>
                    <div class="module-input__plugins">
                      <For each={preview()?.packageInfo?.plugins}>
                        {(plugin) => (
                          <span class="module-input__plugin-pill">
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
              <div class="module-input__no-package">
                📁 Valid folder (no package.json found)
              </div>
            </Show>
            <Show when={previewUrl()}>
              <div class="module-input__actions">
                <ViewSource moduleUrl={previewUrl()!} repo={props.repo} />
                <button
                  class="module-input__add-button"
                  onClick={handleAdd}
                  disabled={
                    isLoading() ||
                    preview()?.error !== undefined ||
                    !preview()?.isFolder
                  }
                >
                  Add
                </button>
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

function isFolderDoc(doc: any): doc is FolderDoc {
  return (
    doc && typeof doc === "object" && "docs" in doc && Array.isArray(doc.docs)
  );
}
