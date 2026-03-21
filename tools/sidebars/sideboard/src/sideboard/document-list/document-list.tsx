import {
  deleteAt,
  updateText,
  type AutomergeUrl,
  type DocHandle,
  type Repo,
} from "@automerge/automerge-repo";
import {
  docIdFromAutomergeUrl,
  Access,
  ContactCard,
  type AutomergeRepoKeyhive,
} from "@automerge/automerge-repo-keyhive";
import type {
  OpenDocumentEventDetail,
  PatchworkViewElement,
} from "@inkandswitch/patchwork-elements";
import type {
  DocLink,
  FolderDoc,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import { getRegistry, type Datatype } from "@inkandswitch/patchwork-plugins";
import { createSignal, For, Match, Show, Suspense, Switch } from "solid-js";
import { filter, filterMatches, setRenaming } from "../state.ts";
import Folder from "./folder.tsx";
import Item from "./item.tsx";
import { ItemName } from "./name.tsx";
import { ShareModal } from "../share-modal.tsx";

// TODO: Re-enable when secure copy feature is ready
const MAKE_SECURE_COPY_ENABLED = false;

function isKeyhiveProtected(url: AutomergeUrl): boolean {
  try {
    docIdFromAutomergeUrl(url);
    return true;
  } catch {
    return false;
  }
}

export interface DocumentListProps {
  handle: DocHandle<FolderDoc>;
  docs?: DocLink[];
  depth: number;
  repo: Repo;
  open(detail: OpenDocumentEventDetail): void;
  hive?: AutomergeRepoKeyhive;
  selectedDocUrls: AutomergeUrl[];
  visitedFolders?: Set<AutomergeUrl>;
  element: PatchworkViewElement;
  rootFolderHandle: DocHandle<FolderDoc>;
}

export function DocumentList(props: DocumentListProps) {
  const [shareModalUrl, setShareModalUrl] = createSignal<AutomergeUrl | null>(
    null
  );
  const visitedFolders = props.visitedFolders ?? new Set<AutomergeUrl>();

  function removeItem(index: number) {
    props.handle.change((folder) => deleteAt(folder.docs, index));
  }

  async function makeSecureCopy(docLink: DocLink) {
    if (!props.hive) return;

    // Get the old document
    const oldHandle = await props.repo.find<HasPatchworkMetadata>(docLink.url);
    const oldDoc = oldHandle.doc();

    // Create new secure doc with create2 (uses keyhive idFactory)
    const newHandle = await props.repo.create2<HasPatchworkMetadata>(
      structuredClone(oldDoc)
    );

    // Add sync server with pull access
    if (props.hive.syncServer) {
      try {
        const serverContactCard = ContactCard.fromJson(
          props.hive.syncServer.contactCard.toJson()
        );
        if (serverContactCard) {
          const pullAccess = Access.tryFromString("pull");
          if (pullAccess) {
            await props.hive.addMemberToDoc(
              newHandle.url,
              serverContactCard,
              pullAccess
            );
          }
        }
      } catch (err) {
        console.error(
          "[DocumentList] Failed to add sync server to secure copy:",
          err
        );
      }
    }

    // Add to sidebar
    props.handle.change((folder) => {
      folder.docs.unshift({
        name: docLink.name + " (secure)",
        type: docLink.type,
        url: newHandle.url,
      });
    });

    // Open the new document
    props.open({
      url: newHandle.url,
      title: docLink.name + " (secure)",
      type: docLink.type,
    });
  }
  return (
    <Suspense>
      <For each={props.docs}>
        {(doc, index) => {
          const visible = () => !filter().length || filterMatches(doc.name);
          const remove = () => removeItem(index());
          const relid = () => props.handle.url + "/" + index();
          const rename = (name: string) => {
            props.handle.change((doc) => {
              updateText(doc, ["docs", index(), "name"], name);
            });
            const datatypes = getRegistry<Datatype>("patchwork:datatype");
            props.repo
              .find<Partial<HasPatchworkMetadata>>(doc.url)
              .then(async (handle) => {
                const { "@patchwork": metadata } = handle.doc();

                if (metadata) {
                  const datatype = datatypes.get(metadata.type) as Datatype;

                  if (datatype) {
                    await datatypes.load(datatype.id);
                    handle.change((doc) =>
                      (datatype as any).module.setTitle?.(doc, name)
                    );
                  }
                }
              });
          };

          return (
            <div
              classList={{
                sideboard__item: true,
                "sideboard__item--visible": visible(),
                "sideboard__item--invisible": !visible(),
              }}
            >
              <Switch>
                <Match when={doc.type == "folder"}>
                  <Show
                    when={!visitedFolders.has(doc.url)}
                    fallback={
                      <div
                        class="document-list-folder__circular-ref"
                        style={{ "padding-left": `calc(var(--depth) * 1rem)` }}
                      >
                        <span>{doc.name} (i contain myself eventually)</span>
                      </div>
                    }
                  >
                    <Folder
                      url={doc.url}
                      depth={props.depth}
                      repo={props.repo}
                      removeFromParent={remove}
                      open={props.open}
                      name={doc.name}
                      hive={props.hive}
                      selectedDocUrls={props.selectedDocUrls}
                      visitedFolders={visitedFolders}
                      element={props.element}
                      rootFolderHandle={props.rootFolderHandle}
                    />
                  </Show>
                </Match>
                <Match when={doc.type != "folder"}>
                  <Item
                    aria-label={doc.name}
                    url={doc.url}
                    name={doc.name}
                    id={relid()}
                    startRenaming={() => setRenaming(relid())}
                    remove={remove}
                    pressed={props.selectedDocUrls.includes(doc.url)}
                    type={doc.type}
                    element={props.element}
                    repo={props.repo}
                    rootFolderHandle={props.rootFolderHandle}
                    parentFolderHandle={props.handle}
                    itemIndex={index()}
                    openWith={(toolId) =>
                      props.open({
                        url: doc.url,
                        toolId,
                        title: doc.name,
                        type: doc.type,
                      })
                    }
                    share={
                      props.hive ? () => setShareModalUrl(doc.url) : undefined
                    }
                    shareDisabled={
                      props.hive ? !isKeyhiveProtected(doc.url) : false
                    }
                    makeSecureCopy={
                      MAKE_SECURE_COPY_ENABLED &&
                      props.hive &&
                      !isKeyhiveProtected(doc.url)
                        ? () => makeSecureCopy(doc)
                        : undefined
                    }
                  >
                    <ItemName name={doc.name} id={relid()} rename={rename} />
                    <Show when={props.hive && !isKeyhiveProtected(doc.url)}>
                      <span class="document-list-item__unprotected">
                        [insecure]
                      </span>
                    </Show>
                  </Item>
                </Match>
              </Switch>
            </div>
          );
        }}
      </For>
      <Show when={shareModalUrl() && props.hive}>
        <ShareModal
          isOpen={!!shareModalUrl()}
          docUrl={shareModalUrl()!}
          hive={props.hive!}
          onClose={() => setShareModalUrl(null)}
        />
      </Show>
    </Suspense>
  );
}
