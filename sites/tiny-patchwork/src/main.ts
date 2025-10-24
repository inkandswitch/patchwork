import "./styles/global.css";

import { CONTEXT, Context } from "@patchwork/context";
import { registerPatchworkViewElement } from "@patchwork/elements";
import { ModuleWatcher } from "@patchwork/filesystem";
import { registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
import { initCommands } from "./commands";
import {
  getOrCreateAccountDocHandle,
  TinyPatchworkAccountDoc,
} from "./lib/account-doc";
import { openDocument } from "./lib/navigation";
import {
  DocHandle,
  isValidAutomergeUrl,
  isValidDocumentId,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type UrlHeads,
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
      if (isValidAutomergeUrl(name)) {
        registerPlugins(mod.plugins, name);
      }
    }
  }
);

registerPatchworkViewElement({ moduleWatcher, repo, hive });

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);

rootElement.addEventListener("patchwork:open-document", (event) => {
  const params = new URLSearchParams();
  const { url, toolId } = event.detail;
  const { documentId, heads } = parseAutomergeUrl(url);
  params.set("doc", documentId);
  if (heads) params.set("heads", heads?.join("|"));
  if (toolId) params.set("tool", toolId);
  window.location.hash = params.toString();
});

const handleHashChange = async (hash: string) => {
  const params = new URLSearchParams(hash);
  const documentId = params.get("doc");
  const heads = params.get("heads")?.split("|") as UrlHeads | undefined;
  const toolId = params.get("tool");
  if (isValidDocumentId(documentId)) {
    openDocument(
      rootElement,
      stringifyAutomergeUrl({ documentId, heads }),
      toolId ?? undefined
    );
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
