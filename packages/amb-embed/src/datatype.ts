import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { initFrom, type DataType } from "@patchwork/sdk";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { RawValue } from "@patchwork/ambsheet/src/datatype";
import { Filter } from "@patchwork/ambsheet/src/eval";

// SCHEMA

export type AmbEmbedDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  linkedSheets: {
    [key: string]: AutomergeUrl;
  };
  blocks: Array<{
    type: "cellReference";
    sheetName: string; // TODO: decide whether to reference sheets by name or by URL
    cellName: string;
    viewerName: string;
  }>;

  // {
  //   1,2: [1,2,3],   // cell 1,2 has values 1,2,3 selected
  //   2,3: [4,5,6]
  // }
  selectedFilters: {
    // sheet name => Filter[]
    [key: string]: Filter[];
  };
};

// FUNCTIONS

export const markCopy = (doc: AmbEmbedDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: AmbEmbedDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: AmbEmbedDoc) => {
  return doc.title || "AmbEmbed";
};

export const init = (doc: AmbEmbedDoc) => {
  initFrom(doc, {
    title: "Untitled AmbEmbed",
    linkedSheets: {
      test: "automerge:3io9Zy95WUmhZT7y1t5SosTK3U9t" as AutomergeUrl,
    },
    blocks: [],
    selectedFilters: {},
  });
};

export const datatype: DataType<AmbEmbedDoc, unknown> = {
  type: "patchwork:dataType",
  id: "ambEmbed",
  name: "Amb Embed",
  icon: "Component",
  isExperimental: true,

  init,
  getTitle,
  setTitle,
  markCopy,
};
