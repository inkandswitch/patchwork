import { AutomergeUrl } from "@automerge/automerge-repo";
// import { DecodedChangeWithMetadata } from "@/versionControl/groupChanges";
import { Annotation, HasVersionControlMetadata } from "@/versionControl/schema";
import { next as A } from "@automerge/automerge";
import { initFrom, type DataType } from "@/sdk";
// import { TextPatch } from "@/versionControl/utils";
import { defaultSongConfig, ROW_COUNT, SongConfig, totalStepsFromConfig } from "./config";
import { Step } from "./music/instrument-scheduler";
import { DRUM_PIECES_COUNT } from "./music/drum";

// SCHEMA

export type SequencerDoc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  toggleRows: Toggle[][];
  drumToggleRows: Toggle[][];
  stepGrid: Step[];
  config: SongConfig;
};

export type Toggle = {
  toggled: boolean,
  avatarUrl: AutomergeUrl | null;
  toggleOnTime: number;
}

// TODO
export type SequencerDocAnchor = {};

export const markCopy = (doc: SequencerDoc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: SequencerDoc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: SequencerDoc) => {
  return doc.title || "Mystery Song";
};

export const init = (doc: SequencerDoc) => {
  let config: SongConfig = defaultSongConfig();
  let totalSteps = totalStepsFromConfig(config);
  initFrom(doc, {
    title: "Untitled Song",
    toggleRows: Array.from({ length: ROW_COUNT }, () =>
      Array.from({ length: totalSteps }, () => ({ toggled: false, avatarUrl: null, toggleOnTime: 0 }))
    ),
    drumToggleRows: Array.from({ length: DRUM_PIECES_COUNT }, () =>
      Array.from({ length: totalSteps }, () => ({ toggled: false, avatarUrl: null, toggleOnTime: 0 }))
    ),
    stepGrid: Array.from({ length: totalSteps }, () => ({ "instrument": {}, "drum": {} })),
    config,
  });
}

// // TODO: Review this to create a better approach.
// export const includeChangeInHistory = (doc: SequencerDoc) => {
//   const toggleObjId = A.getObjectId(doc, "toggleRows");
//   const drumToggleObjId = A.getObjectId(doc, "drumToggleRows");
//   const gridObjId = A.getObjectId(doc, "stepGrid");
//   const configObjId = A.getObjectId(doc, "config");
//   const toggleObjIds = doc.toggleRows.map((_, index) => A.getObjectId(doc.toggleRows, index));
//   const drumToggleObjIds = doc.drumToggleRows.map((_, index) => A.getObjectId(doc.drumToggleRows, index));
//   const gridObjIds = doc.stepGrid.map((_, index) => A.getObjectId(doc.stepGrid, index));

//   return (decodedChange: DecodedChangeWithMetadata) => {
//     return decodedChange.ops.some(
//       (op) =>
//         op.obj === toggleObjId ||
//         op.obj === drumToggleObjId ||
//         op.obj === gridObjId ||
//         op.obj === configObjId ||
//         toggleObjIds.includes(op.obj) ||
//         drumToggleObjIds.includes(op.obj) ||
//         gridObjIds.includes(op.obj)
//     );
//   };
// };

// export const includePatchInChangeGroup = (patch: A.Patch | TextPatch) => {
//   return patch.path[0] === "toggleRows" ||
//   patch.path[0] === "drumToggleRows" ||
//   patch.path[0] === "stepGrid" ||
//   patch.path[0] === "config"
// }

const patchesToAnnotations = (
  doc: SequencerDoc,
  docBefore: SequencerDoc,
  patches: A.Patch[]
) => {
  return patches.flatMap((patch): Annotation<SequencerDocAnchor, string>[] => {
    const handledPatchActions = ["splice"];
    if (patch.path[0] !== "toggleRows" || !handledPatchActions.includes(patch.action))
      return [];

    // TODO: find a way to show the old value in the annotation
    switch (patch.action) {
      case "splice": {
        return [
          {
            type: "added",
            added: patch.value,
            anchor: {
              row: patch.path[1] as number,
              column: patch.path[2] as number,
            },
          },
        ];
      }
      case "del":
        // TODO
        return [];

      default:
        throw new Error("invalid patch");
    }
  });
};

export const SequencerDatatype: DataType<
  SequencerDoc,
  SequencerDocAnchor,
  string
> = {
  type: "patchwork:dataType",
  id: "sequencer",
  name: "Sequencer",
  icon: "CassetteTape",
  isExperimental: true,

  init,
  getTitle,
  setTitle,
  markCopy, // TODO: this shouldn't be here

  // includeChangeInHistory,
  // includePatchInChangeGroup,

  patchesToAnnotations,
};
