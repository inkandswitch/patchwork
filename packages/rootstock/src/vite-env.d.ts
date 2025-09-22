/// <reference types="vite/client" />

interface ImportMeta {
  dirname: string;
}

interface Window {
  __ROOTSTOCK_VERSION__: {
    gitHash: string;
    buildTimestamp: number;
  };
}
