import { FolderDoc, ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { getPluginRegistry, registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const repo = await bootstrap();

import { AccountDoc, getAccountDocHandle } from "./lib/account";

declare global {
  interface Window {
    accountDocHandle: DocHandle<AccountDoc>;
    rootDocHandle: DocHandle<unknown>;
  }
}

import { plugins } from "./tools";
import { DocHandle } from "@automerge/automerge-repo";
import { PatchworkFrameDoc } from "./tools/PatchworkFrame";

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
