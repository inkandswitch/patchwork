import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const repo = await bootstrap();

import { AccountDoc, getAccountDocHandle } from "./lib/account";
import { Context, CONTEXT } from "@patchwork/context";
declare global {
  interface Window {
    accountDocHandle: DocHandle<AccountDoc>;
    rootDocHandle: DocHandle<unknown>;
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

const accountDocHandle = (window.accountDocHandle =
  await getAccountDocHandle(repo));

window.rootDocHandle = await repo.find(accountDocHandle.doc().rootDocUrl);

const moduleWatcher = new ModuleWatcher(
  accountDocHandle.doc().moduleSettingsUrl,
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

rootElement.setAttribute("doc-url", accountDocHandle.doc().rootDocUrl);
rootElement.setAttribute("tool-id", accountDocHandle.doc().rootToolId);
