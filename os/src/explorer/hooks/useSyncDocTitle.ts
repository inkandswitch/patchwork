import {
  fetchAwaitMissing,
  useAsyncComputed,
} from "@patchwork/sdk/async-signals";
import { DocPath, DocPathUtils } from "@patchwork/sdk/router";
import { FolderDoc } from "@patchwork/folder";
import { dataTypeById } from "@patchwork/sdk";
import { fetchOmOnActiveBranch } from "@patchwork/sdk/versionControl";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { useCallback, useEffect, useRef } from "react";
import { useCurrentAccount } from "@patchwork/sdk";

// This hook keeps the name of the link synced with the title of the document.
// The update is triggered every time the selected doc changes.
// Only the title of the currently selected document is synced.
// This means that the names of doc links can become out of synce but they are
// updated once the users opens the link again.

export const useSyncDocTitle = ({
  selectedDocPath,
  repo,
  selectDocPath,
}: {
  selectedDocPath?: DocPath;
  repo: Repo;
  selectDocPath: (docLink: DocPath) => void;
}) => {
  const selectedDocLink =
    selectedDocPath && DocPathUtils.toLink(selectedDocPath);

  // counter is incremented each time the title is re computed so we can detect async operations that should be aborted because they are based on old state
  const counterRef = useRef(0);
  const selectedDocTitleRef = useRef<{ url: AutomergeUrl; title?: string }>();
  const dataType = dataTypeById(selectedDocLink?.type);
  const account = useCurrentAccount();

  const selectedDoc = useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(selectedDocPath);
      return fetchOmOnActiveBranch(selectedDocPath, account, repo).doc;
    }, [account, repo, selectedDocPath])
  ).ifPending(undefined).value;

  const parentFolderOm = useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(selectedDocPath);
      return fetchOmOnActiveBranch<FolderDoc>(
        DocPathUtils.parent(selectedDocPath),
        account,
        repo
      );
    }, [account, repo, selectedDocPath])
  ).ifPending(undefined).value;

  useEffect(() => {
    if (!selectedDocLink || !selectedDoc || !dataType || !parentFolderOm) {
      selectedDocTitleRef.current = undefined;
      return;
    }

    // reset title if url has changed
    if (selectedDocTitleRef.current?.url !== selectedDocLink.url) {
      selectedDocTitleRef.current = { url: selectedDocLink.url };
    }

    const counter = (counterRef.current = counterRef.current + 1);

    // load title
    dataType.getTitle(selectedDoc, repo).then((title) => {
      // do nothing if selectedDocLink has changed in between
      // or if this promise resolved after newer update
      if (
        selectedDocLink.url !== selectedDocTitleRef.current?.url ||
        counter !== counterRef.current
      ) {
        return;
      }

      // title has changed compared to previous computation
      if (title !== selectedDocTitleRef.current?.title) {
        selectedDocTitleRef.current.title = title;

        parentFolderOm.handle.change((d) => {
          const existingDocLink = d.docs.find(
            (link) => link.url === selectedDocLink.url
          );
          // check if the doc link matches the current title
          if (
            existingDocLink &&
            existingDocLink.name &&
            existingDocLink.name !== title
          ) {
            existingDocLink.name = title;

            // update url
            selectDocPath([
              ...DocPathUtils.parent(selectedDocPath),
              { ...selectedDocLink, name: title },
            ]);
          }
        });
      }
    });
  }, [
    selectedDoc,
    dataType,
    selectedDocPath,
    repo,
    selectDocPath,
    parentFolderOm,
    selectedDocLink,
  ]);
};
