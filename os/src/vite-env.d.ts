/// <reference types="vite/client" />

interface ImportMeta {
  dirname: string;
}

declare const __PATCHWORK_VERSION__: {
  gitHash: string;
  buildTimestamp: number;
};
