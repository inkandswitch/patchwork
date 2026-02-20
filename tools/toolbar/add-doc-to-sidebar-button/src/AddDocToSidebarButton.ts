import { AutomergeUrl, DocHandle } from "@automerge/automerge-repo";
import {
  FolderDoc,
  getType,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  getRegistry,
  ToolElement,
  type DatatypeDescription,
  type DatatypeImplementation,
} from "@inkandswitch/patchwork-plugins";
import "./styles.css";

export function renderAddDocToSidebarButton(
  handle: DocHandle<HasPatchworkMetadata>,
  element: ToolElement
) {
  const wrapper = document.createElement("div");
  wrapper.className = "add-doc-to-sidebar";

  const button = document.createElement("button");
  button.textContent = "Add to sidebar";
  wrapper.appendChild(button);

  // hidden by default until we confirm there's a datatype
  wrapper.style.display = "none";

  let docDatatypeId: string | undefined;
  let title: string | undefined;

  function update() {
    const doc = handle.doc();
    if (!doc) return;

    docDatatypeId = getType(doc);
    if (!docDatatypeId) {
      wrapper.style.display = "none";
      return;
    }

    const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
    const loaded = registry.get(docDatatypeId);
    if (loaded && "module" in loaded) {
      const impl = loaded.module as DatatypeImplementation;
      title = impl.getTitle(doc) || undefined;
    }

    wrapper.style.display = "";
  }

  async function onAddDocToSidebar() {
    const repo = element.repo;

    // hack: get reference to the account doc handle through window
    const accountDocHandle = (window as any).accountDocHandle as DocHandle<{
      rootFolderUrl: AutomergeUrl;
    }>;

    const rootFolderDocHandle = await repo.find<FolderDoc>(
      accountDocHandle.doc()!.rootFolderUrl
    );

    rootFolderDocHandle.change((doc) => {
      doc.docs.unshift({
        name: title ?? "Untitled",
        url: handle.url,
        type: docDatatypeId!,
      });
    });
  }

  button.addEventListener("click", onAddDocToSidebar);
  handle.on("change", update);
  update();

  // try to load the datatype async if it wasn't ready yet
  const doc = handle.doc();
  if (doc) {
    const datatypeId = getType(doc);
    if (datatypeId) {
      const registry = getRegistry<DatatypeDescription>("patchwork:datatype");
      registry.load(datatypeId).then(() => update());
    }
  }

  element.appendChild(wrapper);

  return () => {
    handle.off("change", update);
    button.removeEventListener("click", onAddDocToSidebar);
  };
}
