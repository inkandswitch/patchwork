import {
  ModuleWatcher,
  type HasPatchworkMetadata,
} from "@patchwork/filesystem";
import "./styles/global.css";

import bootstrap from "virtual:patchwork/setup";
import {
  getPluginRegistry,
  registerPlugins,
  type Tool,
  type ToolDescription,
} from "@patchwork/plugins";
import { type AutomergeUrl } from "@automerge/vanillajs";
import { registerPatchworkViewElement } from "@patchwork/element";
import patchworkReactShim from "./shim";
const { repo } = await bootstrap();

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
});

const docUrl = params.get("docUrl");
let toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

if (!docUrl) {
  throw new Error("need docUrl query params");
}

if (!toolId) {
  const doc = await repo.find<HasPatchworkMetadata>(docUrl as AutomergeUrl);
  const suggestedImportUrl = doc.doc()["@patchwork"].suggestedImportUrl;
  if (suggestedImportUrl) {
    await moduleWatcher.loadModules([suggestedImportUrl]);
  }

  const type = doc.doc()["@patchwork"].type;

  const [plugin] = await getPluginRegistry<ToolDescription>(
    "patchwork:tool"
  ).loadAll((desc) => {
    if (desc.id == "raw") return false;
    return (
      desc.supportedDataTypes.includes(type) ||
      desc.supportedDataTypes.includes("*")
    );
  });
  if (plugin && "EditorComponent" in (plugin as Tool).module) {
    plugin.module = patchworkReactShim(plugin.module.EditorComponent);
  }

  toolId = plugin?.id;
}

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", docUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
