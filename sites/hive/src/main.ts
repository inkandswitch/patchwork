import { ModuleWatcher } from "@patchwork/filesystem";

import bootstrap from "virtual:patchwork/setup";
import { registerPlugins } from "@patchwork/plugins";
import { type AutomergeUrl } from "@automerge/vanillajs";
import { registerPatchworkViewElement } from "@patchwork/elements";
const { repo, hive } = await bootstrap();

const moduleWatcher = new ModuleWatcher(
  "automerge:3n51DZbA1FRwHAV8K2sW1g2aA3P2" as AutomergeUrl,
  [],
  repo,
  (name, mod) => {
    Array.isArray(mod.plugins) && registerPlugins(mod.plugins, name);
  }
);

const params = new URLSearchParams(document.location.search);

(window as any).repo = repo;

registerPatchworkViewElement({
  moduleWatcher,
  repo,
});

const docUrl = params.get("docUrl");
const toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

if (!toolId) {
  throw new Error("need docUrl and toolId query params");
}

const rootElement = document.getElementById("root")!;

async function getOrCreateAccountUrl() {
  const existing = localStorage.getItem("hiveAccountUrl") as
    | AutomergeUrl
    | undefined;
  if (existing) return existing;
  const account = await repo.create2({ id: hive?.active.peerId ?? null });
  localStorage.setItem("patchworkAccountUrl", account.url);
  return account.url;
}
const accountUrl = await getOrCreateAccountUrl();

rootElement.setAttribute("doc-url", docUrl ?? accountUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
