import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import { registerPatchworkViewElement } from "@patchwork/elements";
import { getPluginRegistry, registerPlugins } from "@patchwork/plugins";
import bootstrap from "virtual:patchwork/setup";
const repo = await bootstrap();

import { getAccountDocHandle } from "./lib/account";

declare global {
  interface Window {
    accountDocHandle: Awaited<ReturnType<typeof getAccountDocHandle>>;
  }
}

import { plugins } from "./tools";

const loadedPlugins = await Promise.all(
  plugins.map(async (plugin) => ({ ...plugin, module: await plugin.load() }))
);

registerPlugins(loadedPlugins, "./tools");

console.log(plugins);

const accountDocHandle = (window.accountDocHandle =
  await getAccountDocHandle(repo));

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

console.log(
  "load doc",
  accountDocHandle.doc().rootDocUrl,
  "with tool",
  accountDocHandle.doc().rootToolId
);

rootElement.setAttribute("doc-url", accountDocHandle.doc().rootDocUrl);
rootElement.setAttribute("tool-id", accountDocHandle.doc().rootToolId);
