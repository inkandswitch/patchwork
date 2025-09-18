/// <reference types="vite/client" />

interface ImportMeta {
  dirname: string;
}

interface Window {
  __ROOTSTOCK_VERSION_: {
    gitHash: string;
    buildTimestamp: number;
  };
}
