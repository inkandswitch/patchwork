import "./global.css";
// @ts-expect-error there ain't no types for tenfold
import * as tenfold from "@inkandswitch/tenfold";
import "@inkandswitch/tenfold/style.css";

import patchwork, { getRegistry } from "@inkandswitch/patchwork";

await patchwork.setup({
  serviceWorker: { syncServer: "wss://sync.tenfold.inkandswitch.com" },
});

patchwork.register(tenfold.plugins);
(window as any).tools = getRegistry("patchwork:tool");

const rootElement = document.getElementById("root")!;
rootElement.addEventListener(
  "patchwork:mounted",
  () => {
    rootElement.classList.add("mounted");
  },
  { once: true }
);
const doc = new URLSearchParams(window.location.search).get("doc");
if (doc) {
  localStorage.setItem("tenfold", doc);
  rootElement.setAttribute("tool-id", "inkandswitch/tenfold");
  rootElement.setAttribute("doc-url", doc);
} else {
  const saved = localStorage.getItem("tenfold");
  if (saved) {
    const url = new URL(window.location.href);
    url.searchParams.set("doc", saved);
    window.location.href = url.toString();
  } else {
    const handle = await patchwork.repo.create2({
      "@patchwork": { type: "tenfriend" },
    });
    rootElement.setAttribute("tool-id", "tenfriend");
    rootElement.setAttribute("doc-url", handle.url);
  }
}
