import { ModuleWatcher } from "@patchwork/filesystem";
import "./styles/global.css";

import bootstrap from "virtual:patchwork/setup";
import { registerPlugins } from "@patchwork/plugins";
import { type AutomergeUrl } from "@automerge/vanillajs";
import { registerPatchworkViewElement } from "@patchwork/elements";
const repo = await bootstrap();

import { getAccountDocHandle } from "./account";

declare global {
  interface Window {
    accountDocHandle: Awaited<ReturnType<typeof getAccountDocHandle>>;
  }
}

const accountDocHandle = (window.accountDocHandle =
  await getAccountDocHandle(repo));

console.log("accountDocHandle", accountDocHandle.doc());

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

rootElement.setAttribute("doc-url", accountDocHandle.url);
rootElement.setAttribute("tool-id", accountDocHandle.doc().rootToolId);
