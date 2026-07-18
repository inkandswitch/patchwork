/// <reference types="vite/client" />
/// <reference types="@inkandswitch/patchwork-bootloader" />

interface ImportMetaEnv {
  /**
   * Comma-separated list of default tool-manifest sources the shell boots with.
   * Each entry is an `automerge:` URL or a static `modules.json` URL. Overridable
   * at runtime via `localStorage.systemPackageListURL`.
   */
  readonly PATCHWORK_SYSTEM_PACKAGE_LIST_URL?: string;

  /**
   * @deprecated Use {@link ImportMetaEnv.PATCHWORK_SYSTEM_PACKAGE_LIST_URL}.
   * Retained for backwards compatibility with existing build configs.
   */
  readonly VITE_DEFAULT_MODULES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
