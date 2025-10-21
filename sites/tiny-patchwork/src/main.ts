import "./styles/global.css";

import bootstrap from "virtual:patchwork/setup";
import { ModuleWatcher } from "@patchwork/filesystem";
import { registerPatchworkViewElement } from "@patchwork/elements";
import { registerPlugins } from "@patchwork/plugins";
import { CONTEXT, Context } from "@patchwork/context";
import { initCommands } from "./commands";
import {
  getOrCreateAccountDocHandle,
  TinyPatchworkAccountDoc,
} from "./lib/account-doc";
import { openDocument } from "./lib/navigation";
import {
  type AutomergeUrl,
  DocHandle,
  isValidAutomergeUrl,
  isValidDocumentId,
  parseAutomergeUrl,
} from "@automerge/vanillajs";

import { plugins } from "./tools";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkAccountDoc>;
    CONTEXT: Context;
  }
}

const { repo, hive } = await bootstrap();

window.CONTEXT = CONTEXT;

const loadedPlugins = await Promise.all(
  plugins.map(async (plugin) => ({ ...plugin, module: await plugin.load() }))
);

registerPlugins(loadedPlugins, "DEV");

const accountDocHandle = await getOrCreateAccountDocHandle(repo, hive);

window.accountDocHandle = accountDocHandle;

// Initialize global commands
initCommands(accountDocHandle, repo);

const moduleWatcher = new ModuleWatcher(
  accountDocHandle.doc().moduleSettingsUrl,
  [],
  repo,
  (name, mod) => {
    if (Array.isArray(mod.plugins)) {
      registerPlugins(mod.plugins, name);
    }
  }
);

registerPatchworkViewElement({ moduleWatcher, repo, hive });

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);

rootElement.addEventListener("patchwork:open-document", (event) => {
  window.location.hash = parseAutomergeUrl(event.detail.url).documentId;
});

const handleHashChange = async (hash: string) => {
  if (isValidDocumentId(hash)) {
    const url = isValidAutomergeUrl(hash)
      ? hash
      : (`automerge:${hash}` as AutomergeUrl);
    openDocument(rootElement, url);
  } else {
    window.location.hash = "";
  }
};

// Listen for hash changes and interpret them as Automerge URLs
window.addEventListener("hashchange", () => {
  const hash = window.location.hash;
  handleHashChange(hash.slice(1));
});

if (window.location.hash) {
  const initialAutomergeUrl = window.location.hash.slice(1);
  // todo: actually wait for root to be mounted
  setTimeout(() => {
    handleHashChange(initialAutomergeUrl);
  }, 100);
}
