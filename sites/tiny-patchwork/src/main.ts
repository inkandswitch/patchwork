import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const { repo, ...identity } = await bootstrap();

import { TinyPatchworkAccountDoc, initAccountDoc } from "./lib/account-doc";
import { Context, CONTEXT } from "@patchwork/context";
import { openDocument, OpenDocumentEvent } from "./lib/navigation";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkAccountDoc>;
    CONTEXT: Context;
  }
}

window.CONTEXT = CONTEXT;

import {
  AutomergeUrl,
  DocHandle,
  isValidAutomergeUrl,
  isValidDocumentId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { plugins } from "./tools";

const loadedPlugins = await Promise.all(
  plugins.map(async (plugin) => ({ ...plugin, module: await plugin.load() }))
);

registerPlugins(loadedPlugins, "DEV");

const accountDocHandle = await repo.find<TinyPatchworkAccountDoc>(
  identity.accountUrl
);

initAccountDoc(repo, accountDocHandle);

const moduleWatcher = new ModuleWatcher(
  accountDocHandle.doc()["@tiny-patchwork"].moduleSettingsUrl,
  [],
  repo,
  (name, mod) => {
    Array.isArray(mod.plugins) && registerPlugins(mod.plugins, name);
  }
);

registerPatchworkViewElement({
  moduleWatcher,
  repo,
  // todo remove when css is solved
  shadow: false,
});

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute(
  "tool-id",
  accountDocHandle.doc()["@tiny-patchwork"].frameToolId
);

rootElement.addEventListener("patchwork:open-document", (event) => {
  const { docLink } = event as OpenDocumentEvent;
  window.location.hash = parseAutomergeUrl(docLink.url).documentId;
});

const handleUrlChange = async (url: string) => {
  if (isValidDocumentId(url)) {
    const handle = await repo.find<any>(url);
    const doc = handle.doc();

    const type = doc["@patchwork"].type;
    const name = doc.title ?? "Unknown"; // todo: load data type to figure out the name

    openDocument(rootElement, {
      url: handle.url,
      name,
      type,
    });
  } else {
    window.location.hash = "";
  }
};

// Listen for hash changes and interpret them as automerge URLs
window.addEventListener("hashchange", () => {
  const hash = window.location.hash;
  handleUrlChange(hash.slice(1));
});

// Also log the initial hash if present
if (window.location.hash) {
  const initialAutomergeUrl = window.location.hash.slice(1);
  // todo: actually wait for root to be mounted
  setTimeout(() => {
    handleUrlChange(initialAutomergeUrl);
  }, 100);
}
