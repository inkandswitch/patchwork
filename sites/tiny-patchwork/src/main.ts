import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const { repo, ...identity } = await bootstrap();

import { CONTEXT, Context } from "@patchwork/context";
import { initCommands } from "./commands";
import { initAccountDoc, TinyPatchworkAccountDoc } from "./lib/account-doc";
import { openDocument } from "./lib/navigation";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkAccountDoc>;
    CONTEXT: Context;
  }
}

window.CONTEXT = CONTEXT;

import {
  type AutomergeUrl,
  DocHandle,
  isValidAutomergeUrl,
  isValidDocumentId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { plugins } from "./tools";
import { KeyhiveKit } from "@patchwork/identity";

const loadedPlugins = await Promise.all(
  plugins.map(async (plugin) => ({ ...plugin, module: await plugin.load() }))
);

registerPlugins(loadedPlugins, "DEV");

const accountDocHandle = await repo.find<TinyPatchworkAccountDoc>(
  identity.accountUrl
);

(window as any).accountDocHandle = accountDocHandle;

await initAccountDoc(repo, accountDocHandle);

// Initialize global commands
initCommands(accountDocHandle, repo);

const moduleWatcher = new ModuleWatcher(
  accountDocHandle.doc()?.["@tiny-patchwork"]?.moduleSettingsUrl,
  [],
  repo,
  (name, mod) => {
    Array.isArray(mod.plugins) && registerPlugins(mod.plugins, name);
  }
);

registerPatchworkViewElement({
  moduleWatcher,
  repo,
  identity: identity as KeyhiveKit,
  // todo remove when css is fixed
  shadow: false,
});

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute(
  "tool-id",
  accountDocHandle.doc()["@tiny-patchwork"].frameToolId
);

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
