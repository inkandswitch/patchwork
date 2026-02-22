import {
  createSignal,
  createEffect,
  Show,
  For,
  onCleanup,
  createMemo,
} from "solid-js";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import {
  Access,
  ContactCard,
  docIdFromAutomergeUrl,
  Identifier,
  uint8ArrayToHex,
  type AutomergeRepoKeyhive,
} from "@automerge/automerge-repo-keyhive";

type DocAccessList = Record<string, string>;

interface ShareModalProps {
  isOpen: boolean;
  docUrl: AutomergeUrl;
  hive: AutomergeRepoKeyhive;
  onClose: () => void;
}

const ACCESS_LEVELS = ["Pull", "Read", "Write", "Admin"] as const;

async function fetchAccessList(
  hive: AutomergeRepoKeyhive,
  docUrl: AutomergeUrl
): Promise<DocAccessList> {
  const keyhiveDocId = docIdFromAutomergeUrl(docUrl);
  const accessList: DocAccessList = {};
  const members = await hive.docMemberCapabilities(keyhiveDocId);
  members.forEach((capability) => {
    const hexId = uint8ArrayToHex(capability.who.id.toBytes());
    accessList[hexId] = capability.can.toString();
  });
  return accessList;
}

export function ShareModal(props: ShareModalProps) {
  const [contactCardInput, setContactCardInput] = createSignal("");
  const [docAccessList, setDocAccessList] = createSignal<DocAccessList>({});
  const [isLoadingAccessList, setIsLoadingAccessList] = createSignal(true);
  const [currentUserAccess, setCurrentUserAccess] = createSignal<
    string | undefined
  >(undefined);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const keyhiveDocId = createMemo(() => docIdFromAutomergeUrl(props.docUrl));

  const currentUserHexId = createMemo(() => {
    const id = props.hive.active.individual.id;
    return id ? uint8ArrayToHex(id.toBytes()) : null;
  });

  const syncServerHexId = createMemo(() => {
    const syncServer = props.hive.syncServer;
    if (!syncServer) return null;
    const contactCard = ContactCard.fromJson(syncServer.contactCard.toJson());
    if (!contactCard) return null;
    return uint8ArrayToHex(contactCard.individualId.bytes);
  });

  const publicHexId = createMemo(() => {
    const publicId = Identifier.publicId();
    return uint8ArrayToHex(publicId.toBytes());
  });

  const currentPublicAccess = createMemo(() => {
    const accessList = docAccessList();
    const pubHexId = publicHexId();
    return accessList[pubHexId] || null;
  });

  const isAdmin = createMemo(() => currentUserAccess() === "Admin");

  // Fetch current user's access level
  createEffect(() => {
    if (!props.isOpen) return;

    let cancelled = false;

    async function fetchCurrentUserAccess() {
      const id = props.hive.active.individual.id;
      if (!id) {
        if (!cancelled) setCurrentUserAccess(undefined);
        return;
      }

      try {
        const access = await props.hive.accessForDoc(id, keyhiveDocId());
        if (!cancelled) {
          setCurrentUserAccess(access ? access.toString() : undefined);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ShareModal] Error checking access level:", err);
          setCurrentUserAccess(undefined);
        }
      }
    }

    fetchCurrentUserAccess();

    onCleanup(() => {
      cancelled = true;
    });
  });

  // Fetch access list when modal opens
  createEffect(() => {
    if (!props.isOpen) return;

    let cancelled = false;

    async function loadAccessList() {
      if (!cancelled) setIsLoadingAccessList(true);

      try {
        const accessList = await fetchAccessList(props.hive, props.docUrl);
        if (!cancelled) {
          setDocAccessList(accessList);
          setIsLoadingAccessList(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[ShareModal] Error loading access list:", err);
          setDocAccessList({});
          setIsLoadingAccessList(false);
        }
      }
    }

    loadAccessList();

    onCleanup(() => {
      cancelled = true;
    });
  });

  // Escape key handler
  createEffect(() => {
    if (!props.isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    onCleanup(() => {
      document.removeEventListener("keydown", handleEscape);
    });
  });

  const handleAddMember = async (e: Event) => {
    e.preventDefault();

    const input = contactCardInput().trim();
    if (!input) return;

    setIsSubmitting(true);

    try {
      const contactCard = ContactCard.fromJson(input);
      if (!contactCard) {
        throw new Error("Invalid ContactCard JSON");
      }

      const access = Access.tryFromString("write");
      if (!access) {
        throw new Error("Invalid access level");
      }

      await props.hive.addMemberToDoc(props.docUrl, contactCard, access);

      setContactCardInput("");
    } catch (err) {
      console.error("[ShareModal]", err);
    } finally {
      // Refresh access list even on error, since the delegation may
      // have succeeded even if there is an error.
      const accessList = await fetchAccessList(props.hive, props.docUrl);
      setDocAccessList(accessList);
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (hexId: string) => {
    try {
      await props.hive.revokeMemberFromDoc(props.docUrl, hexId);
    } catch (err) {
      console.error("[ShareModal]", err);
    } finally {
      const accessList = await fetchAccessList(props.hive, props.docUrl);
      setDocAccessList(accessList);
    }
  };

  const handleMakePublic = async () => {
    try {
      const access = Access.tryFromString("write");
      if (!access) {
        throw new Error("Invalid access level");
      }

      // TODO: pass to tool
      await props.hive.setPublicAccess(props.docUrl, access);
    } catch (err) {
      console.error("[ShareModal]", err);
    } finally {
      // Refresh access list even on error, since the delegation may
      // have succeeded even if there is an error.
      const accessList = await fetchAccessList(props.hive, props.docUrl);
      setDocAccessList(accessList);
    }
  };

  const handleMakePrivate = async () => {
    try {
      await props.hive.revokeMemberFromDoc(props.docUrl, publicHexId());
    } catch (err) {
      console.error("[ShareModal]", err);
    } finally {
      const accessList = await fetchAccessList(props.hive, props.docUrl);
      setDocAccessList(accessList);
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const formatHexId = (hexId: string) => `0x${hexId.slice(0, 12)}...`;

  const sortedMembers = createMemo(() => {
    return Object.entries(docAccessList()).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  });

  return (
    <Show when={props.isOpen}>
      <div class="share-modal__overlay" onClick={handleBackdropClick}>
        <div
          class="share-modal__content"
          onClick={(e) => e.stopPropagation()}
        >
          <header class="share-modal__header">
            <h2>Share this document</h2>
            <button
              class="share-modal__close"
              onClick={() => props.onClose()}
              aria-label="Close modal"
            >
              &times;
            </button>
          </header>

          <div class="share-modal__body">
<section class="share-modal__public-section">
              <h3 class="share-modal__section-title">Public Access</h3>
              <div class="share-modal__public-controls">
                <Show when={currentPublicAccess()}>
                  <span class="share-modal__public-status">
                    This document is <strong>public</strong>
                  </span>
                </Show>
                <Show when={isAdmin()}>
                  <div class="share-modal__public-actions">
                    <Show when={currentPublicAccess()}>
                      <button
                        class="share-modal__add-button"
                        onClick={handleMakePrivate}
                      >
                        Revoke Public Access
                      </button>
                    </Show>
                    <Show when={!currentPublicAccess()}>
                      <button
                        class="share-modal__add-button"
                        onClick={handleMakePublic}
                      >
                        Make Public
                      </button>
                    </Show>
                  </div>
                </Show>
              </div>
            </section>

            <Show when={isAdmin()}>
              <hr class="share-modal__divider" />

              <form class="share-modal__form" onSubmit={handleAddMember}>
                <textarea
                  class="share-modal__input"
                  placeholder="Paste ContactCard JSON..."
                  value={contactCardInput()}
                  onInput={(e) => setContactCardInput(e.currentTarget.value)}
                  rows={3}
                />
                <div class="share-modal__form-actions">
                  <button
                    type="submit"
                    class="share-modal__add-button"
                    disabled={isSubmitting() || !contactCardInput().trim()}
                  >
                    {isSubmitting() ? "Adding..." : "Add"}
                  </button>
                </div>
              </form>

              <hr class="share-modal__divider" />
            </Show>

            <section>
              <h3 class="share-modal__section-title">Current Access</h3>

              <Show when={isLoadingAccessList()}>
                <p class="share-modal__loading">Loading...</p>
              </Show>

              <Show when={!isLoadingAccessList() && sortedMembers().length === 0}>
                <p class="share-modal__empty">No users have access yet</p>
              </Show>

              <Show when={!isLoadingAccessList() && sortedMembers().length > 0}>
                <div class="share-modal__member-list">
                  <For each={sortedMembers()}>
                    {([hexId, access]) => {
                      const isCurrentUser = hexId === currentUserHexId();
                      const isSyncServer = hexId === syncServerHexId();
                      const isPublic = hexId === publicHexId();
                      const myAccessIdx = ACCESS_LEVELS.indexOf(
                        currentUserAccess() as (typeof ACCESS_LEVELS)[number]
                      );
                      const memberAccessIdx = ACCESS_LEVELS.indexOf(
                        access as (typeof ACCESS_LEVELS)[number]
                      );
                      const canRemove =
                        myAccessIdx >= 0 &&
                        memberAccessIdx >= 0 &&
                        memberAccessIdx <= myAccessIdx &&
                        !isCurrentUser &&
                        !isSyncServer;

                      const displayName = () => {
                        if (isCurrentUser) return "You";
                        if (isSyncServer) return "Sync Server";
                        if (isPublic) return "Public";
                        return formatHexId(hexId);
                      };

                      return (
                        <div class="share-modal__member">
                          <div class="share-modal__member-info">
                            <span
                              class="share-modal__member-id"
                              classList={{
                                "share-modal__member-id--you": isCurrentUser,
                                "share-modal__member-id--public": isPublic,
                              }}
                            >
                              {displayName()}
                            </span>
                            <span class="share-modal__member-access">
                              {access}
                            </span>
                          </div>
                          <Show when={canRemove}>
                            <button
                              class="share-modal__remove-button"
                              onClick={() => handleRemoveMember(hexId)}
                              aria-label="Remove member"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </Show>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </section>
          </div>
        </div>
      </div>
    </Show>
  );
}
