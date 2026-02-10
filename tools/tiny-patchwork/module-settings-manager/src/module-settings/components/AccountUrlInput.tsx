import { createSignal, createMemo, onMount, Show } from "solid-js";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";
import { STORAGE_KEY_ACCOUNT_URL } from "../constants.ts";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard.ts";
import { useLocalStorage } from "../hooks/useLocalStorage.ts";

export function AccountUrlInput() {
  const [storedUrl, setStoredUrl] = useLocalStorage(
    STORAGE_KEY_ACCOUNT_URL,
    ""
  );
  const [url, setUrl] = createSignal("");
  const [isEditing, setIsEditing] = createSignal(false);
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [copiedText, copy] = useCopyToClipboard();

  // Initialize editing state from stored URL on mount
  onMount(() => {
    if (storedUrl()) {
      setUrl(storedUrl());
    }
  });

  // Validate URL whenever it changes (using memo for performance)
  const isValid = createMemo(() => {
    const value = url().trim();
    if (!value) return null;
    return isValidAutomergeUrl(value);
  });

  const handleSave = () => {
    const value = url().trim();
    if (value && isValid()) {
      setStoredUrl(value);
      setIsEditing(false);
      // Reload the page to apply the new account URL
      window.location.reload();
    }
  };

  const handleCopy = () => {
    const value = url().trim();
    if (value) {
      copy(value);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const stored = storedUrl();
    if (stored) {
      setUrl(stored);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && isValid()) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div class="module-settings-account-url">
      <div class="module-settings-account-url__header">
        <h3 class="module-settings-account-url__label">Account URL</h3>
      </div>

      <Show when={isEditing() || !url().trim()}>
        <div class="module-settings-account-url__input-container">
          <input
            class="module-settings-account-url__input"
            classList={{
              "account-url__input--invalid":
                url().trim() !== "" && isValid() === false,
              "account-url__input--valid":
                url().trim() !== "" && isValid() === true,
            }}
            type="text"
            value={url()}
            onInput={(e) => setUrl(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter account URL (automerge:...)"
            autofocus
          />
          <div class="module-settings-account-url__overlay-buttons">
            <button
              class="module-settings-account-url__overlay-button module-settings-account-url__save-button"
              onClick={handleSave}
              disabled={!isValid()}
              title="Save"
            >
              ✓
            </button>
            <Show when={url().trim() && storedUrl()}>
              <button
                class="module-settings-account-url__overlay-button module-settings-account-url__cancel-button"
                onClick={handleCancel}
                title="Cancel"
              >
                ✕
              </button>
            </Show>
          </div>
        </div>
        <Show when={url().trim() && isValid() === false}>
          <div class="module-settings-account-url__error">
            Invalid Automerge URL
          </div>
        </Show>
      </Show>

      <Show when={!isEditing() && url().trim()}>
        <div class="module-settings-account-url__display-container">
          <div
            class="module-settings-account-url__display"
            classList={{
              "account-url__display--copied": copiedText() === url(),
              "account-url__display--expanded": isExpanded(),
            }}
            onClick={handleCopy}
            title="Click to copy"
          >
            <code>{url()}</code>
          </div>
          <div class="module-settings-account-url__display-buttons">
            <button
              class="module-settings-account-url__overlay-button module-settings-account-url__expand-button"
              onClick={() => setIsExpanded(!isExpanded())}
              title={isExpanded() ? "Collapse" : "Expand"}
            >
              {isExpanded() ? "−" : "+"}
            </button>
            <button
              class="module-settings-account-url__overlay-button module-settings-account-url__edit-button"
              onClick={() => setIsEditing(true)}
              title="Edit URL"
            >
              ✏️
            </button>
          </div>
        </div>
      </Show>
    </div>
  );
}
