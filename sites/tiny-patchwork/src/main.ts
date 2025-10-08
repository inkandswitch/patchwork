import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const { repo, ...identity } = await bootstrap();

import { TinyPatchworkAccountDoc, initAccountDoc } from "./lib/account-doc";
import { Context, CONTEXT } from "@patchwork/context";

declare global {
  interface Window {
    accountDocHandle: DocHandle<TinyPatchworkAccountDoc>;
    CONTEXT: Context;
  }
}

window.CONTEXT = CONTEXT;

import { DocHandle } from "@automerge/automerge-repo";
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
