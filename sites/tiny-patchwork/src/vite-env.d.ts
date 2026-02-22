/// <reference types="vite/client" />
/// <reference types="@inkandswitch/patchwork-bootloader" />

interface ImportMetaEnv {
  readonly VITE_SUBDUCTION_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
