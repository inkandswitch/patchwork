import { useRootFolderDocWithChildren } from "@/explorer/account";
import { next as A } from "@automerge/automerge";
import { DocumentId } from "@automerge/automerge-repo";
import { useDocuments } from "@automerge/automerge-repo-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { PackageDoc } from "./datatype";

type Package = {
  module: any;
};

const NO_PACKAGES: Package[] = [];

export const usePackageModulesInRootFolder = (): Package[] => {
  // we can do an return before the hooks because this condition is fixed at build time
  if (import.meta.env.MODE === "development") {
    return NO_PACKAGES; // return same array so hooks that depend on usePackageModulesInRootFolder don't create an infinite loops
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePackageModulesInRootFolderForReal();
};

const usePackageModulesInRootFolderForReal = (): Package[] => {
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

  const packageDocsRef = useRef<Record<DocumentId, PackageDoc>>();
  packageDocsRef.current = packageDocs;
  useEffect(() => {
    (async () => {
      const modules = await Promise.all(
        Object.entries(packageDocs).map(async ([docId, packageDoc]) => {
          const { packageJSON } = packageDoc;
          const heads = A.getHeads(packageDoc).join(",");
          const moduleUrl = `https://automerge/${docId}/fileContents/${packageJSON.main}?heads=${heads}`;

          return {
            module: await import(/* @vite-ignore */ moduleUrl),
          };
        })
      );

      // skip if packageDocs has changed in the meantime
      if (packageDocs !== packageDocsRef.current) {
        return;
      }

      setModules(modules);
    })();
  }, [packageDocs]);

  return modules;
};
