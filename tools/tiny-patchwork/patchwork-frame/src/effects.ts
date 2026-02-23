import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
} from "@automerge/automerge-repo-react-hooks";
import {
  $selectedDocHandles,
  $selectedDocUrls,
} from "@inkandswitch/annotations-selection";
import { useSubscribe } from "@inkandswitch/subscribables-react";
import {
  FolderDoc,
  HasPatchworkMetadata,
} from "@inkandswitch/patchwork-filesystem";
import {
  DatatypeDescription,
  getRegistry,
} from "@inkandswitch/patchwork-plugins";
import { useEffect } from "react";

export const useUpdateDocLinksOfActiveDocumentsEffect = (
  rootFolderUrl: AutomergeUrl
) => {
  const selectedDocUrls = useSubscribe($selectedDocUrls);
  const [selectedDocsMap] = useDocuments<HasPatchworkMetadata>(
    selectedDocUrls as AutomergeUrl[]
  );

  const [rootFolderDoc, changeRootFolderDoc] = useDocument<FolderDoc>(
    rootFolderUrl,
    {
      suspense: true,
    }
  );

  useEffect(() => {
    let canceled = false;

    const registry = getRegistry<DatatypeDescription>("patchwork:datatype");

    for (const docUrl of selectedDocUrls) {
      const doc = selectedDocsMap.get(docUrl as AutomergeUrl);

      if (!doc) {
        continue;
      }

      const type = doc["@patchwork"]?.type;

      if (!type) {
        continue;
      }

      const datatype = registry.get(type);
      if (!datatype?.importUrl) continue;

      import(/* @vite-ignore */ datatype.importUrl).then((mod) => {
        if (canceled) return;

        const title = mod.default.getTitle(doc);

        changeRootFolderDoc((doc) => {
          for (const docLink of doc.docs) {
            if (docLink.url === docUrl && docLink.name !== title) {
              docLink.name = title;
            }
          }
        });
      });
    }

    return () => {
      canceled = true;
    };
  }, [changeRootFolderDoc, rootFolderDoc, selectedDocUrls, selectedDocsMap]);
};

export const useAddUnknownDocumentsToSidebarEffect = (
  rootFolderUrl: AutomergeUrl
) => {
  const selectedDocHandles = useSubscribe($selectedDocHandles);

  const [rootFolderDoc, changeRootFolderDoc] =
    useDocument<FolderDoc>(rootFolderUrl);

  useEffect(() => {
    if (!rootFolderDoc) {
      return;
    }

    let canceled = false;

    const registry = getRegistry<DatatypeDescription>("patchwork:datatype");

    for (const docHandle of selectedDocHandles) {
      const type = docHandle.doc()["@patchwork"]?.type;

      if (!type) {
        continue;
      }

      const datatype = registry.get(type);
      if (!datatype?.importUrl) continue;

      import(/* @vite-ignore */ datatype.importUrl).then((mod) => {
        if (canceled) return;

        const title = mod.default.getTitle(docHandle.doc());
        if (rootFolderDoc.docs.some((doc) => doc.url === docHandle.url)) {
          return;
        }

        changeRootFolderDoc((rootFolderDoc) => {
          rootFolderDoc.docs[rootFolderDoc.docs.length] = {
            name: title,
            url: docHandle.url,
            type: type,
          };
        });
      });
    }

    return () => {
      canceled = true;
    };
  }, [changeRootFolderDoc, rootFolderDoc, selectedDocHandles]);
};
