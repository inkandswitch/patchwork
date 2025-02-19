import { getStringCompletion, isLLMActive } from "../versionControl/llm";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { debounce } from "lodash-es";
import { useEffect, useMemo } from "react";
import { ChangeGroup } from "./groupChanges";
import {
  HasChangeGroupSummaries,
  HasLinkToVersionControlSidecar,
  initVersionControlSidecarDoc,
} from "./schema";
export const populateChangeGroupSummaries = async <
  T extends HasLinkToVersionControlSidecar
>({
  groups,
  handle,
  force,
  promptForAutoChangeGroupDescription,
  repo,
}: {
  groups: ChangeGroup<T>[];
  handle: DocHandle<T>;
  force?: boolean;
  promptForAutoChangeGroupDescription?: (args: {
    docBefore: T;
    docAfter: T;
  }) => string;
  repo: Repo;
}) => {
  let versionControlMetadataUrl = handle.doc()?.versionControlMetadataUrl;
  if (!versionControlMetadataUrl) {
    // init sidecar doc for backwards compatibility
    handle.change((doc) => {
      initVersionControlSidecarDoc(doc, repo);
    });
    versionControlMetadataUrl = handle.doc()?.versionControlMetadataUrl;
  }

  const versionControlSidecarHandle = await repo.find<HasChangeGroupSummaries>(
    versionControlMetadataUrl!
  );
  if (!versionControlSidecarHandle) {
    console.error("Failed to load version control sidecar document");
    return;
  }
  versionControlSidecarHandle.change((doc) => {
    if (!doc.changeGroupSummaries) {
      doc.changeGroupSummaries = {};
    }
  });

  if (!isLLMActive || !promptForAutoChangeGroupDescription) {
    return;
  }

  for (const [index, group] of groups.entries()) {
    if (
      !force &&
      versionControlSidecarHandle.doc()!.changeGroupSummaries[group.id]
    ) {
      continue;
    }
    await populateGroupSummary<T>({
      group,
      docBefore: groups[index - 1]?.docAtEndOfChangeGroup ?? {},
      versionControlSidecarHandle,
      promptForAutoChangeGroupDescription,
    });
  }
};

const populateGroupSummary = async <
  DocType extends HasLinkToVersionControlSidecar
>({
  group,
  docBefore,
  versionControlSidecarHandle,
  promptForAutoChangeGroupDescription,
}: {
  group: ChangeGroup<DocType>;
  docBefore: any;
  versionControlSidecarHandle: DocHandle<HasChangeGroupSummaries>;
  promptForAutoChangeGroupDescription: (args: {
    docBefore: DocType;
    docAfter: DocType;
  }) => string;
}) => {
  const docAfter = group.docAtEndOfChangeGroup;
  const prompt = promptForAutoChangeGroupDescription({
    docBefore,
    docAfter,
  });

  const summary = await getStringCompletion(prompt);

  if (summary) {
    versionControlSidecarHandle.change((doc) => {
      doc.changeGroupSummaries[group.id] = {
        title: summary,
      };
    });
  }
};

export const useAutoPopulateChangeGroupSummaries = <
  DocType extends HasLinkToVersionControlSidecar
>({
  changeGroups,
  handle,
  // debounce to every 5s by default; this keeps LLM requests reasonably light while typing
  msBetween = 5000,
  promptForAutoChangeGroupDescription,
  repo,
}: {
  changeGroups: ChangeGroup<DocType>[];
  handle?: DocHandle<DocType>;
  msBetween?: number;
  promptForAutoChangeGroupDescription?: (args: {
    docBefore: DocType;
    docAfter: DocType;
  }) => string;
  repo: Repo;
}) => {
  const debouncedPopulate = useMemo(
    () =>
      debounce(({ groups, handle, force }) => {
        populateChangeGroupSummaries({
          groups,
          handle,
          force,
          promptForAutoChangeGroupDescription,
          repo,
        });
      }, msBetween),
    [msBetween, promptForAutoChangeGroupDescription, repo]
  );

  useEffect(() => {
    debouncedPopulate({
      groups: changeGroups,
      handle,
    });

    // Cleanup function to cancel the debounce
    return () => {
      debouncedPopulate.cancel();
    };
  }, [
    changeGroups,
    handle,
    debouncedPopulate,
    promptForAutoChangeGroupDescription,
    repo,
  ]);
};
