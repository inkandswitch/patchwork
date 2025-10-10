import { ModuleWatcher } from "@patchwork/filesystem";

import bootstrap from "virtual:patchwork/setup";
import { registerPlugins } from "@patchwork/plugins";
import { type AutomergeUrl } from "@automerge/vanillajs";
import { registerPatchworkViewElement } from "@patchwork/elements";
import type { KeyhiveKit } from "@patchwork/identity";
const { repo, ...identity } = await bootstrap();

const moduleWatcher = new ModuleWatcher(
  "automerge:3n51DZbA1FRwHAV8K2sW1g2aA3P2" as AutomergeUrl,
  [],
  repo,
  (name, mod) => {
    Array.isArray(mod.plugins) && registerPlugins(mod.plugins, name);
  }
);

const params = new URLSearchParams(document.location.search);

registerPatchworkViewElement({
  moduleWatcher,
  repo,
  // todo remove when css is solved
  shadow: false,
  identity: identity as KeyhiveKit,
});

const docUrl = params.get("docUrl");
const toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

if (!toolId) {
  throw new Error("need docUrl and toolId query params");
}

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", docUrl ?? identity.accountUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
