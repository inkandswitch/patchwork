import "./styles/global.css";

import { start } from "@patchwork/rootstock";

const { repo, moduleWatcher } = await start();

const params = new URLSearchParams(document.location.search);
const docUrl = params.get("docUrl");
const toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

if (!docUrl || !toolId) {
  throw new Error("Need a docUrl and toolId");
}

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", docUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
