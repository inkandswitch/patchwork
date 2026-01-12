import { createSignal, createEffect, Show } from "solid-js";
import { isValidAutomergeUrl } from "@automerge/automerge-repo";

const STORAGE_KEY = "tinyPatchworkAccountUrl";

export function AccountUrlInput() {
  const [url, setUrl] = createSignal("");
  const [isEditing, setIsEditing] = createSignal(false);
  const [isValid, setIsValid] = createSignal<boolean | null>(null);
  const [copied, setCopied] = createSignal(false);

  // Load from localStorage on mount
  createEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUrl(stored);
    }
  });

  // Validate URL whenever it changes
  createEffect(() => {
    const value = url().trim();
    if (!value) {
      setIsValid(null);
      return;
    }
    setIsValid(isValidAutomergeUrl(value));
  });

  const handleSave = () => {
    const value = url().trim();
    if (value && isValid()) {
      localStorage.setItem(STORAGE_KEY, value);
      setIsEditing(false);
      // Reload the page to apply the new account URL
      window.location.reload();
    }
  };

  const handleCopy = async () => {
    const value = url().trim();
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && isValid()) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      // Restore from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUrl(stored);
      }
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
              class="module-settings-account-url__overlay-button account-url__save-button"
              onClick={handleSave}
              disabled={!isValid()}
              title="Save"
            >
              ✓
            </button>
            <Show when={url().trim() && localStorage.getItem(STORAGE_KEY)}>
              <button
                class="module-settings-account-url__overlay-button account-url__cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  const stored = localStorage.getItem(STORAGE_KEY);
                  if (stored) {
                    setUrl(stored);
                  }
                }}
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
              "account-url__display--copied": copied(),
            }}
            onClick={handleCopy}
            title="Click to copy"
          >
            <code>{url()}</code>
          </div>
          <button
            class="module-settings-account-url__overlay-button account-url__edit-button"
            onClick={() => setIsEditing(true)}
            title="Edit URL"
          >
            ✏️
          </button>
        </div>
      </Show>
    </div>
  );
}
