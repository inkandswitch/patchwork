import "./global.css";

import patchwork, { getRegistry } from "@inkandswitch/patchwork";
import { openDocument } from "@inkandswitch/patchwork-elements";
import {
  DatatypeDescription,
  DatatypeImplementation,
} from "@inkandswitch/patchwork-plugins";
import {
  getOrCreateLayoutDocHandle,
  TinyPatchworkLayoutDoc,
} from "./layout-doc";
import {
  DocHandle,
  isValidDocumentId,
  parseAutomergeUrl,
  stringifyAutomergeUrl,
  type AutomergeUrl,
  type UrlHeads,
} from "@automerge/vanillajs";

await patchwork.setup({
  repo: {
    enableRemoteHeadsGossiping: true,
    subscribeToRemotes: [
      "3760df37-a4c6-4f66-9ecd-732039a9385d",
    ],
  },
});

window.getRepoChannel = () => {
  const { port1, port2 } = new MessageChannel();
  navigator.serviceWorker.controller!.postMessage({ type: "port" }, [port2]);
  return port1;
};

document.body.style.background = "#fffffe";

const accountDocHandle = await getOrCreateLayoutDocHandle(patchwork.repo);
(window as any).accountDocHandle = accountDocHandle;

const rootElement = document.getElementById("root")!;
rootElement.style.visibility = "hidden";
document.body.style.background = "#fffefe";
const initialParams = new URLSearchParams(location.hash.slice(1));
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docId = initialParams.get("doc");
  const docUrl = docId
    ? stringifyAutomergeUrl({
        documentId: docId as import("@automerge/automerge-repo").DocumentId,
      })
    : accountDocHandle.url;
  rootElement.setAttribute("doc-url", docUrl);
} else {
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
  rootElement.setAttribute("doc-url", accountDocHandle.url);
}

const defaultToolsUrl =
  "automerge:2LZBb891v37vggWYQPJRbYdyBGGE" as AutomergeUrl;

patchwork.watch([
  defaultToolsUrl,
  accountDocHandle.doc().moduleSettingsUrl,
]);

rootElement.addEventListener("patchwork:no-tool", (event) => {
  patchwork.modules!.loadSuggestedImportUrl(event.detail.url);
});

rootElement.addEventListener("patchwork:open-document", async (event) => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const { url, toolId, type, title } = event.detail;
  const { documentId, heads } = parseAutomergeUrl(url);
  params.set("doc", documentId);
  if (heads) params.set("heads", heads?.join("|"));
  else params.delete("heads");
  if (toolId) params.set("tool", toolId);
  else params.delete("tool");
  if (title) params.set("title", title);
  else params.delete("title");
  if (type) params.set("type", type);
  else params.delete("type");
  window.location.hash = params.toString();

  try {
    const docHandle = await patchwork.repo.find(
      stringifyAutomergeUrl({ documentId, heads })
    );
    const doc = docHandle.doc();
    const docType = type || doc?.["@patchwork"]?.type;
    if (docType) {
      const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
      const datatype = await registry.load(docType);
      if (datatype) {
        const docTitle = (datatype.module as DatatypeImplementation).getTitle(
          doc
        );
        if (docTitle) {
          document.title = `${docTitle} | patchwork`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to update document title", e);
  }
});

let firstMount = true;
rootElement.addEventListener("patchwork:mounted", (event) => {
  handleHashChange();
  if (event.target != rootElement) return;
  console.info(`root element mounted`);
  if (firstMount) {
    firstMount = false;
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
  setTimeout(() => {
    handleHashChange();
  }, 1000);
});
setTimeout(() => {
  if (firstMount) {
    rootElement.style.visibility = "visible";
    document.body.style.background = "";
  }
}, 12000);

const bigPatchworkHashRegex =
  /(?<title>[A-Za-z0-9-]+)--(?<docId>[1-9A-HJ-NP-Za-km-z]+)(?<type>\?=[^&?]+)?/;

const handleHashChange = async () => {
  const hash = window.location.hash.slice(1);
  const legacy = bigPatchworkHashRegex.exec(hash);

  if (legacy) {
    const documentId = legacy.groups?.docId;
    if (isValidDocumentId(documentId)) {
      openDocument(rootElement, stringifyAutomergeUrl({ documentId }));
    }
    return;
  }

  const params = new URLSearchParams(hash);
  const documentId = params.get("doc");
  const heads = params.get("heads")?.split("|") as UrlHeads | undefined;
  const toolId = params.get("tool");
  const title = params.get("title");
  const type = params.get("type");
  const frame = params.get("frame");
  if (frame) {
    const docUrl = params.get("doc") ?? accountDocHandle.url;
    if (
      rootElement.getAttribute("tool-id") !== frame ||
      rootElement.getAttribute("doc-url") !== docUrl
    ) {
      rootElement.setAttribute("tool-id", frame);
      rootElement.setAttribute("doc-url", docUrl);
    }
  }
  if (isValidDocumentId(documentId)) {
    rootElement.dispatchEvent(
      new CustomEvent("patchwork:open-document", {
        detail: {
          url: stringifyAutomergeUrl({ documentId, heads }),
          toolId,
          title,
          type,
        },
      })
    );
  }
};

// Listen for hash changes and interpret them as Automerge URLs
window.addEventListener("hashchange", () => {
  handleHashChange();
});

async function uncache(match: string) {
  for (const name of await caches.keys()) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      if (request.url.includes(match)) {
        cache.delete(request);
      }
    }
  }
}

(window as any).uncache = uncache;
