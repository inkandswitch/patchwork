import { save, type Doc } from "@automerge/automerge";

export async function exportAsAutomerge(doc: Doc<unknown>) {
  return new File([save(doc) as BlobPart], "document.automerge", {
    type: "application/octet-stream",
  });
}

export async function exportAsJSON(doc: Doc<unknown>) {
  return new File([JSON.stringify(doc)], "document.json", {
    type: "application/json",
  });
}
