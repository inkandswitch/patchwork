import "./styles/global.css";

import setupServiceWorker from "@patchwork/service-worker/setup";

const serviceWorker = await setupServiceWorker();
console.log("service worker loaded");

const rootstock = await import("@patchwork/rootstock");
console.log("rootstock imported");

const { repo, moduleWatcher, keyhiveKit } = await rootstock.start({
  serviceWorker,
});

const params = new URLSearchParams(document.location.search);
const docUrl = params.get("docUrl");
const toolId = params.get("toolId");
const modules = params.getAll("loadModules");
await moduleWatcher.loadModules(modules);

// if (!docUrl || !toolId) {
//   throw new Error("Need a docUrl and toolId");
// }

const rootElement = document.getElementById("root")!;

rootElement.setAttribute("doc-url", docUrl ?? keyhiveKit.accountUrl);
toolId && rootElement.setAttribute("tool-id", toolId);
