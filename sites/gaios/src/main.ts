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
  type UrlHeads,
} from "@automerge/vanillajs";
import type * as AutomergeRepo from "@automerge/automerge-repo";

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

const accountDocHandle = await getOrCreateLayoutDocHandle(patchwork.repo);
(window as any).accountDocHandle = accountDocHandle;

const rootElement = document.getElementById("root")!;

const initialParams = new URLSearchParams(location.hash.slice(1));
if (initialParams.has("frame")) {
  rootElement.setAttribute("tool-id", initialParams.get("frame")!);
  const docId = initialParams.get("doc");
  const docUrl = docId
    ? stringifyAutomergeUrl({ documentId: docId as import("@automerge/automerge-repo").DocumentId })
    : accountDocHandle.url;
  rootElement.setAttribute("doc-url", docUrl);
} else {
  rootElement.setAttribute("doc-url", accountDocHandle.url);
  rootElement.setAttribute("tool-id", accountDocHandle.doc().frameToolId);
}

rootElement.addEventListener("patchwork:open-document", async (event) => {
  const params = new URLSearchParams();
  const { url, toolId, type, title } = event.detail;
  const { documentId, heads } = parseAutomergeUrl(url);
  params.set("doc", documentId);
  if (heads) params.set("heads", heads?.join("|"));
  if (toolId) params.set("tool", toolId);
  if (title) params.set("title", title);
  if (type) {
    params.set("type", type);
  }
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
          document.title = `${docTitle} | GAIOS`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to update document title", e);
  }
});

rootElement.addEventListener("patchwork:mounted", () => {
  handleHashChange();
});

patchwork.watch([
  accountDocHandle.doc().moduleSettingsUrl,
  // default tools for gaios
  "automerge:3XRXFS96oVXe5D4joMyQWAfNeFNN" as AutomergeRepo.AutomergeUrl,
]);

rootElement.addEventListener("patchwork:no-tool", (event) => {
  patchwork.modules!.loadSuggestedImportUrl(event.detail.url);
});

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
  const documentId = params.get("doc");
  const heads = params.get("heads")?.split("|") as UrlHeads | undefined;
  const toolId = params.get("tool");
  const title = params.get("title");
  const type = params.get("type");
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
