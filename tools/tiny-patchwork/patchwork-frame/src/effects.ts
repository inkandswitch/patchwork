import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocuments,
} from "@automerge/automerge-repo-react-hooks";
import { useReactive } from "@patchwork/context-react";
import {
  $selectedDocHandles,
  $selectedDocUrls,
} from "@patchwork/context-selection";
import { FolderDoc, HasPatchworkMetadata } from "@patchwork/filesystem";
import {
  DataTypeDescription,
  DataTypeImplementation,
  getRegistry,
} from "@patchwork/plugins";
import { PluginRegistry } from "@patchwork/plugins/dist/registry/registry";
import { useEffect } from "react";

export const useUpdateDocLinksOfActiveDocumentsEffect = (
  rootFolderUrl: AutomergeUrl
) => {
  const selectedDocUrls = useReactive($selectedDocUrls);
  const [selectedDocsMap] = useDocuments<HasPatchworkMetadata>(selectedDocUrls);

  // todo: handle folders
  const [rootFolderDoc, changeRootFolderDoc] = useDocument<FolderDoc>(
    rootFolderUrl,
    {
      suspense: true,
    }
  );

  useEffect(() => {
    let canceled = false;

    const registry = getRegistry("patchwork:datatype") as PluginRegistry<
      DataTypeDescription,
      DataTypeImplementation
    >;

    for (const docUrl of selectedDocUrls) {
      const doc = selectedDocsMap.get(docUrl);

      if (!doc) {
        continue;
      }

      const type = doc["@patchwork"]?.type;

      if (!type) {
        continue;
      }

      registry.load(type).then((datatype) => {
        if (canceled || !datatype) {
          return;
        }

        const title = datatype.module.getTitle(doc);

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
  const selectedDocHandles = useReactive($selectedDocHandles);
  const [rootFolderDoc, changeRootFolderDoc] =
    useDocument<FolderDoc>(rootFolderUrl);

  useEffect(() => {
    if (!rootFolderDoc) {
      return;
    }

    let canceled = false;

    const registry = getRegistry<DataTypeDescription>("patchwork:datatype");

    for (const docHandle of selectedDocHandles) {
      const type = docHandle.doc()["@patchwork"]?.type;

      if (!type) {
        continue;
      }

      registry.load(type).then((datatype) => {
        if (canceled || !datatype) {
          return;
        }

        const title = datatype.module.getTitle(docHandle.doc());
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
