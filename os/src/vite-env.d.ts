/// <reference types="vite/client" />

interface ImportMeta {
  dirname: string;
}

declare const __ROOTSTOCK_VERSION__: {
  gitHash: string;
  buildTimestamp: number;
};
