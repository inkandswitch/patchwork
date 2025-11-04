import { createSignal, createResource, Show, For } from "solid-js";
import type { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import type { FolderDoc } from "@patchwork/filesystem";

interface ViewSourceProps {
  moduleUrl: AutomergeUrl;
  repo: Repo;
}

interface FileContent {
  name: string;
  path: string[];
  content: string;
  mimeType: string;
}

async function fetchFolderFiles(
  url: AutomergeUrl,
  repo: Repo,
  path: string[] = []
): Promise<FileContent[]> {
  const handle = await repo.find(url);
  await handle.whenReady();
  const doc = handle.doc();

  if (!doc) return [];

  const files: FileContent[] = [];

  // Check if this is a folder document
  if (isFolderDoc(doc)) {
    const folderDoc = doc as FolderDoc;

    for (const docLink of folderDoc.docs) {
      const childHandle = await repo.find(docLink.url);
      await childHandle.whenReady();
      const childDoc = childHandle.doc();

      if (!childDoc) continue;

      // If it's a folder, recurse
      if (isFolderDoc(childDoc)) {
        const subFiles = await fetchFolderFiles(docLink.url, repo, [
          ...path,
          docLink.name,
        ]);
        files.push(...subFiles);
      } else {
        // It's a file
        const fileDoc = childDoc as any;
        if (fileDoc.content) {
          files.push({
            name: docLink.name,
            path: [...path, docLink.name],
            content:
              typeof fileDoc.content === "string"
                ? fileDoc.content
                : fileDoc.content.value ||
                  JSON.stringify(fileDoc.content, null, 2),
            mimeType: fileDoc.mimeType || "text/plain",
          });
        }
      }
    }
  }

  return files;
}

function isFolderDoc(doc: any): doc is FolderDoc {
  return (
    doc && typeof doc === "object" && "docs" in doc && Array.isArray(doc.docs)
  );
}

function getLanguageFromMimeType(mimeType: string, filename: string): string {
  if (mimeType.includes("javascript")) return "javascript";
  if (mimeType.includes("typescript")) return "typescript";
  if (mimeType.includes("json")) return "json";
  if (mimeType.includes("css")) return "css";
  if (mimeType.includes("html")) return "html";

  // Fallback to file extension
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "ts" || ext === "tsx") return "typescript";
  if (ext === "js" || ext === "jsx") return "javascript";
  if (ext === "json") return "json";
  if (ext === "css") return "css";
  if (ext === "html") return "html";
  if (ext === "md") return "markdown";

  return "text";
}

export function ViewSource(props: ViewSourceProps) {
  const [isOpen, setIsOpen] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<FileContent | null>(
    null
  );

  const [files] = createResource(
    () => ({ url: props.moduleUrl, repo: props.repo, open: isOpen() }),
    async ({ url, repo, open }) => {
      if (!open) return [];
      return fetchFolderFiles(url, repo);
    }
  );

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
  };

  return (
    <>
      <button class="view-source__button" onClick={handleOpen}>
        View Source
      </button>

      <Show when={isOpen()}>
        <div class="view-source__modal" onClick={handleClose}>
          <div
            class="view-source__modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="view-source__modal-header">
              <h2>Module Source Files</h2>
              <button class="view-source__close" onClick={handleClose}>
                ✕
              </button>
            </div>

            <Show when={files.loading}>
              <p class="view-source__loading">Loading files...</p>
            </Show>

            <Show when={files.error}>
              <p class="view-source__error">
                Error loading files: {files.error?.message}
              </p>
            </Show>

            <Show when={files() && files()!.length > 0}>
              <div class="view-source__layout">
                <div class="view-source__file-list">
                  <h4>Files</h4>
                  <For each={files()}>
                    {(file) => (
                      <button
                        class="view-source__file-item"
                        classList={{
                          "view-source__file-item--selected":
                            selectedFile()?.path.join("/") ===
                            file.path.join("/"),
                        }}
                        onClick={() => setSelectedFile(file)}
                      >
                        {file.path.join("/")}
                      </button>
                    )}
                  </For>
                </div>

                <Show when={selectedFile()}>
                  <div class="view-source__file-preview">
                    <h4>{selectedFile()!.name}</h4>
                    <div class="view-source__file-meta">
                      <code>{selectedFile()!.path.join("/")}</code>
                      <span> • {selectedFile()!.mimeType}</span>
                    </div>
                    <pre class="view-source__code">
                      <code
                        class={`language-${getLanguageFromMimeType(selectedFile()!.mimeType, selectedFile()!.name)}`}
                      >
                        {selectedFile()!.content}
                      </code>
                    </pre>
                  </div>
                </Show>

                <Show when={!selectedFile()}>
                  <div class="view-source__empty-preview">
                    <p>Select a file to view its contents</p>
                  </div>
                </Show>
              </div>
            </Show>

            <Show when={files() && files()!.length === 0 && !files.loading}>
              <p class="view-source__empty">No files found in this module.</p>
            </Show>
          </div>
        </div>
      </Show>
    </>
  );
}
