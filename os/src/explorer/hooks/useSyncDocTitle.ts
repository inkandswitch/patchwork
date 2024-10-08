import { fetchAwaitMissing, useAsyncComputed } from "@/async-signals";
import { useDataTypes } from "@/hooks/useDataTypes";
import { FolderDoc } from "@/packages/folder";
import { DocPath } from "@/packages/folder/datatype";
import { dataTypeById } from "@/sdk";
import { fetchOmOnActiveBranch } from "@/versionControl/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { useCallback, useEffect, useRef } from "react";
import { useCurrentAccount } from "../account";

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
  const selectedDocLink = selectedDocPath && DocPath.toLink(selectedDocPath);

  // counter is incremented each time the title is re computed so we can detect async operations that should be aborted because they are based on old state
  const counterRef = useRef(0);
  const selectedDocTitleRef = useRef<{ url: AutomergeUrl; title?: string }>();
  const dataTypes = useDataTypes();
  const dataType = dataTypeById(dataTypes, selectedDocLink?.type);
  const account = useCurrentAccount();

  const selectedDoc = useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(selectedDocPath);
      return fetchOmOnActiveBranch(selectedDocPath, account, repo, dataTypes)
        .doc;
    }, [account, dataTypes, repo, selectedDocPath])
  ).ifPending(undefined).value;

  const parentFolderOm = useAsyncComputed(
    useCallback(() => {
      fetchAwaitMissing(selectedDocPath);
      return fetchOmOnActiveBranch<FolderDoc>(
        DocPath.parent(selectedDocPath),
        account,
        repo,
        dataTypes
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
              ...DocPath.parent(selectedDocPath),
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
