import { DatatypeImplementation } from "@inkandswitch/patchwork-plugins";
import { HistoryGroupingsDoc } from "./types";

const init = (doc: HistoryGroupingsDoc) => {
  if (!doc.sourceDocumentUrl) return;
  Object.assign(doc, {
    ["@patchwork"]: { type: "patchwork:history-change-groups" },
    version: doc.version || 1,
    sourceDocumentUrl: doc.sourceDocumentUrl,
    groupings: doc.groupings || {},
  } as HistoryGroupingsDoc);
};

const getTitle = (doc: HistoryGroupingsDoc) => {
  return `History Change Groups for ${doc.sourceDocumentUrl}`;
};

const setTitle = (doc: HistoryGroupingsDoc, title: string) => {
  // file for caching history change groups, so title should not need to be set directly
};

export const ChangeGroupsDataType: DatatypeImplementation<HistoryGroupingsDoc> =
  {
    init,
    getTitle,
    setTitle,
  };
