import * as Automerge from "@automerge/automerge/next";

// These patches use cursors instead of indexes so they can be applied
// without thinking about how to adjust the indexes when another patch
// was applied previously

// todo: this functionality should probably move into automerge

export type CursorDelPatch = {
  action: "del";
  path: Automerge.Prop[];
  cursor: Automerge.Cursor;
  length: number;
};

export type CursorSpliceTextPatch = {
  action: "splice";
  path: Automerge.Prop[];
  cursor: Automerge.Cursor;
  value: string;
};

export type CursorPatch = CursorDelPatch | CursorSpliceTextPatch;

export const applyCursorPatches = (
  doc: Automerge.Doc<unknown>,
  patches: CursorPatch[]
) => {
  for (const p of patches) {
    switch (p.action) {
      case "del": {
        const index = Automerge.getCursorPosition(doc, p.path, p.cursor);
        Automerge.splice(doc, p.path, index, p.length);
        break;
      }

      case "splice": {
        const index = Automerge.getCursorPosition(doc, p.path, p.cursor);
        Automerge.splice(doc, p.path, index, 0, p.value);
        break;
      }
    }
  }
};
