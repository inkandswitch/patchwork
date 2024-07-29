import { useRootFolderDocWithChildren } from "@/explorer/account";
import {
  AutomergeUrl,
  DocumentId,
  parseAutomergeUrl,
} from "@automerge/automerge-repo";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { useMemo, useRef, useEffect, useState } from "react";
import { next as A } from "@automerge/automerge";
import { PackageDoc } from "./datatype";
import { HasVersionControlMetadata } from "@/versionControl/schema";

type Package = {
  module: any;
  sourceDocUrl?: AutomergeUrl;
};

const NO_PACKAGES: Package[] = [];

export const usePackageModulesInRootFolder = (): Package[] => {
  // we can do an return before the hooks because this condition is fixed at build time
  if (import.meta.env.MODE === "development") {
    return NO_PACKAGES; // return same array so hooks that depend on usePackageModulesInRootFolder don't create an infinite loops
  }

  const folderDocWithMetadata = useRootFolderDocWithChildren();
  const flatDocLinks = folderDocWithMetadata?.flatDocLinks;
  const [modules, setModules] = useState<Package[]>([]);

  const packageDocLinks = useMemo(
    () =>
      flatDocLinks ? flatDocLinks.filter((link) => link.type === "pkg") : [],
    [flatDocLinks]
  );

  const packageDocUrls = useMemo(
    () => packageDocLinks.map((link) => link.url),
    [packageDocLinks]
  );
  const packageDocs = useDocuments<PackageDoc>(packageDocUrls);

  const branchUrls = useMemo(
    () =>
      (
        Object.values(packageDocs) as HasVersionControlMetadata<
          unknown,
          unknown
        >[]
      ).flatMap((doc) =>
        doc.branchMetadata?.branches
          .filter((branch) => !branch.mergeMetadata)
          .map((branch) => branch.url)
      ),
    [packageDocs]
  );

  const packageDocsOnBranches = useDocuments<PackageDoc>(branchUrls);

  const allPackageDocs = useMemo(
    () => ({ ...packageDocs, ...packageDocsOnBranches }),
    [packageDocs, packageDocsOnBranches]
  );

  const packageDocsRef = useRef<Record<DocumentId, PackageDoc>>();
  packageDocsRef.current = packageDocs;
  useEffect(() => {
    (async () => {
      const modules = await Promise.all(
        Object.entries(allPackageDocs).map(async ([docId, packageDoc]) => {
          const { packageJSON } = packageDoc;
          const heads = A.getHeads(packageDoc).join(",");
          const moduleUrl = `https://automerge/${docId}/fileContents/${packageJSON.main}?heads=${heads}`;

          let sourcePackage: PackageDoc | undefined;
          if (packageDoc.branchMetadata?.source) {
            const { documentId } = parseAutomergeUrl(
              packageDoc.branchMetadata.source.url
            );

            sourcePackage = packageDocs[documentId];
          }

          return {
            module: await import(/* @vite-ignore */ moduleUrl),
            sourceDocUrl: sourcePackage
              ? sourcePackage.branchMetadata.branches.find((branch) =>
                  branch.url.includes(docId)
                ).url
              : undefined,
          };
        })
      );

      // skip if packageDocs has changed in the meantime
      if (packageDocs !== packageDocsRef.current) {
        return;
      }

      setModules(modules);
    })();
  }, [allPackageDocs]);

  return modules;
};
