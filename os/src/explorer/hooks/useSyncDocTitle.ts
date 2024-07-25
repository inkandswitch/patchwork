import { incorporateDocReactiveState, isLoaded, LoadingError, useDocReactive } from "@/doc-reactive";
import { DocLinkWithFolderPath, FolderDoc } from "@/packages/folder";
import { fakeDocPath, getOmOnBranchFromPath } from "@/versionControl/signals";
import { AutomergeUrl, Repo } from "@automerge/automerge-repo";
import { useCallback, useEffect, useRef } from "react";
import { useDataType } from "../../datatypes";
import { useUIStateOm } from "../account";

// This hook keeps the name of the link synced with the title of the document.
// The update is triggered every time the selected doc changes.
// Only the title of the currently selected document is synced.
// This means that the names of doc links can become out of synce but they are
// updated once the users opens the link again.

export const useSyncDocTitle = ({
  selectedDocLink,
  repo,
  selectDocLink,
}: {
  selectedDocLink?: DocLinkWithFolderPath;
  repo: Repo;
  selectDocLink: (docLink: DocLinkWithFolderPath) => void;
}) => {
  // counter is incremented each time the title is re computed so we can detect async operations that should be aborted because they are based on old state
  const counterRef = useRef(0);
  const selectedDocTitleRef = useRef<{ url: AutomergeUrl; title?: string }>();
  const dataType = useDataType(selectedDocLink?.type);
  const uiStateOm = useUIStateOm();
  const selectedDocPath = selectedDocLink && fakeDocPath(selectedDocLink);

  const selectedDoc = useDocReactive(useCallback(() => {
    if (!selectedDocPath) { throw new LoadingError; }
    incorporateDocReactiveState(uiStateOm);
    return getOmOnBranchFromPath(selectedDocPath, uiStateOm, repo).doc;
  }, [repo, selectedDocPath, uiStateOm]));

  const parentFolderOm = useDocReactive(useCallback(() => {
    if (!selectedDocPath) { throw new LoadingError; }
    incorporateDocReactiveState(uiStateOm);
    return getOmOnBranchFromPath<FolderDoc>(selectedDocPath.slice(0, -1), uiStateOm, repo);
  }, [repo, selectedDocPath, uiStateOm]));

  useEffect(() => {
    if (!selectedDocLink || !isLoaded(selectedDoc) || !dataType || !isLoaded(parentFolderOm)) {
      selectedDocTitleRef.current = undefined;
      return;
    }

    // reset title if url has changed
    if (selectedDocTitleRef.current?.url !== selectedDocLink?.url) {
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
            selectDocLink({ ...selectedDocLink, name: title });
          }
        });
      }
    });
  }, [selectedDoc, dataType, selectedDocLink, repo, selectDocLink, parentFolderOm]);
};
