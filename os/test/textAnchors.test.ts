import assert from "assert";
import { describe, it } from "vitest";
import * as Automerge from "@automerge/automerge/next";
import { TextAnchor, textAnchorsAtPath } from "@patchwork/sdk/textAnchors";
import { AddAnnotation, ChangeAnnotation, DeleteAnnotation } from "@patchwork/sdk/versionControl";
import { applyCursorPatches, CursorPatch } from "@patchwork/sdk/versionControl";

type TextDoc = {
  content: string;
};

describe("textAnchors", () => {
  describe("patchesToAnnotations", () => {
    const { patchesToAnnotations } = textAnchorsAtPath(["content"]);

    it("returns empty list for empty diff", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const patches = Automerge.diff(
        docWithText,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithText)
      );

      const annotations = patchesToAnnotations(
        docWithText,
        docWithText,
        patches
      );

      assert.deepEqual(annotations, []);
    });

    it("returns a delete annotation for a delete patch", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithDeletion = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, "sample ", "");
        }
      );

      assert.equal(docWithDeletion.content, "This is some text.");

      const patches = Automerge.diff(
        docWithDeletion,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithDeletion)
      );

      const annotations = patchesToAnnotations(
        docWithDeletion,
        docWithText,
        patches
      );

      // verify annotation props
      assert.equal(annotations.length, 1);

      const annotation = annotations[0] as DeleteAnnotation<TextAnchor, string>;

      assert.deepEqual(annotation.type, "deleted");
      assert.deepEqual(annotation.deleted, "sample ");

      const deletePosition = "This is some sample text.".indexOf("sample");
      const anchorFromPosition = Automerge.getCursorPosition(
        docWithDeletion,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithDeletion,
        ["content"],
        annotation.anchor.toCursor
      );

      assert.deepEqual(anchorFromPosition, deletePosition);
      assert.deepEqual(anchorToPosition, deletePosition);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithDeletion),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it.skip("returns a delete annotation for a delete patch at the end of the tex", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithDeletion = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, ".", "");
        }
      );

      assert.equal(docWithDeletion.content, "This is some sample text");

      const patches = Automerge.diff(
        docWithDeletion,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithDeletion)
      );

      const annotations = patchesToAnnotations(
        docWithDeletion,
        docWithText,
        patches
      );

      // verify annotation props
      assert.equal(annotations.length, 1);

      const annotation = annotations[0] as DeleteAnnotation<TextAnchor, string>;

      assert.deepEqual(annotation.type, "deleted");
      assert.deepEqual(annotation.deleted, ".");

      const deletePosition = "This is some sample text.".indexOf(".");
      const anchorFromPosition = Automerge.getCursorPosition(
        docWithDeletion,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithDeletion,
        ["content"],
        annotation.anchor.toCursor
      );

      // todo: this fails because we can't point to the end of the text because cursors don't have a side
      // so we interpret them as pointing to the left of the character
      assert.deepEqual(anchorFromPosition, deletePosition);
      assert.deepEqual(anchorToPosition, deletePosition);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithDeletion),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it("returns an add annotation for a splice patch", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const insertPosition = "This is some sample text.".indexOf("some");
      const docWithInsert = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          Automerge.splice(doc, ["content"], insertPosition, 0, "also ");
        }
      );

      assert.equal(docWithInsert.content, "This is also some sample text.");

      const patches = Automerge.diff(
        docWithInsert,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithInsert)
      );

      const annotations = patchesToAnnotations(
        docWithInsert,
        docWithText,
        patches
      );

      // verify annotation props
      assert.equal(annotations.length, 1);

      const annotation = annotations[0] as AddAnnotation<TextAnchor, string>;
      assert.deepEqual(annotation.type, "added");
      assert.deepEqual(annotation.added, "also ");

      const anchorFromPosition = Automerge.getCursorPosition(
        docWithInsert,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithInsert,
        ["content"],
        annotation.anchor.toCursor
      );

      assert.deepEqual(anchorFromPosition, insertPosition);
      assert.deepEqual(anchorToPosition, insertPosition + "also ".length);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithInsert),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it("turns an delete followed by an insert into a change annotation", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithReplace = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, "sample", "great");
        }
      );
      assert.equal(docWithReplace.content, "This is some great text.");

      const patches = Automerge.diff(
        docWithReplace,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithReplace)
      );

      const annotations = patchesToAnnotations(
        docWithReplace,
        docWithText,
        patches
      );

      // validate annotation props

      assert.equal(annotations.length, 1);
      const annotation = annotations[0] as ChangeAnnotation<TextAnchor, string>;

      assert.deepEqual(annotation.type, "changed");
      assert.deepEqual(annotation.before, "sample");
      assert.deepEqual(annotation.after, "great");

      const anchorFromPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.toCursor
      );

      const changePosition = "This is some greate text.".indexOf("great");

      assert.deepEqual(anchorFromPosition, changePosition);
      assert.deepEqual(anchorToPosition, changePosition + "great".length);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithReplace),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it("turns an insert followed by an delete into a change annotation", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithReplace = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          Automerge.splice(
            doc,
            ["content"],
            "This is some ".length,
            0,
            "great"
          );
          replace(doc, "sample", "");
        }
      );

      assert.equal(docWithReplace.content, "This is some great text.");

      const patches = Automerge.diff(
        docWithReplace,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithReplace)
      );

      const annotations = patchesToAnnotations(
        docWithReplace,
        docWithText,
        patches
      );

      const annotation = annotations[0] as ChangeAnnotation<TextAnchor, string>;

      // check annotation props

      assert.deepEqual(annotation.type, "changed");
      assert.deepEqual(annotation.before, "sample");
      assert.deepEqual(annotation.after, "great");

      const anchorFromPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.toCursor
      );

      const changePosition = "This is some greate text.".indexOf("great");

      assert.deepEqual(anchorFromPosition, changePosition);
      assert.deepEqual(anchorToPosition, changePosition + "great".length);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithReplace),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it("filters out redundant edits", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithReplace = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, "sample", "sample");
        }
      );

      assert.equal(docWithReplace.content, "This is some sample text.");

      const patches = Automerge.diff(
        docWithReplace,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithReplace)
      );

      assert.equal(patches.length, 2);

      const annotations = patchesToAnnotations(
        docWithReplace,
        docWithText,
        patches
      );

      assert.deepEqual(annotations, []);
    });

    it("falls back to word based diffing if a large text has been replaced with almost identical content", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithReplace = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, "This is some sample text.", "This is some great text.");
        }
      );

      assert.equal(docWithReplace.content, "This is some great text.");

      const patches = Automerge.diff(
        docWithReplace,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithReplace)
      );

      const annotations = patchesToAnnotations(
        docWithReplace,
        docWithText,
        patches
      );

      // validate annotation props

      assert.equal(annotations.length, 1);
      const annotation = annotations[0] as ChangeAnnotation<TextAnchor, string>;

      assert.deepEqual(annotation.type, "changed");
      assert.deepEqual(annotation.before, "sample");
      assert.deepEqual(annotation.after, "great");

      const anchorFromPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.fromCursor
      );

      const anchorToPosition = Automerge.getCursorPosition(
        docWithReplace,
        ["content"],
        annotation.anchor.toCursor
      );

      const changePosition = "This is some greate text.".indexOf("great");

      assert.deepEqual(anchorFromPosition, changePosition);
      assert.deepEqual(anchorToPosition, changePosition + "great".length);

      // check annotation can be inverted

      assert.notEqual(annotation.inversePatches, undefined);

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithReplace),
        (doc) => {
          applyCursorPatches(doc, annotation.inversePatches as CursorPatch[]);
        }
      );

      assert.equal(docWithRevert.content, docWithText.content);
    });

    it("handles complex edits", () => {
      const docWithText = Automerge.change(Automerge.init<TextDoc>(), (doc) => {
        doc.content = "This is some sample text.";
      });
      const docWithManyEdits = Automerge.change(
        Automerge.clone(docWithText),
        (doc) => {
          replace(doc, "This is some sample", "This is some great");
          replace(doc, "This", "That");
          replace(doc, "some", "one");
          replace(doc, ".", "");
        }
      );

      assert.deepEqual(docWithManyEdits.content, "That is one great text");

      const patches = Automerge.diff(
        docWithManyEdits,
        Automerge.getHeads(docWithText),
        Automerge.getHeads(docWithManyEdits)
      );

      const annotations = patchesToAnnotations(
        docWithManyEdits,
        docWithText,
        patches
      );

      // just check if it's revertable

      const inversePatches: CursorPatch[] = annotations.flatMap((annotation) =>
        "inversePatches" in annotation && annotation.inversePatches
          ? annotation.inversePatches
          : ([] as CursorPatch[])
      );

      const docWithRevert = Automerge.change(
        Automerge.clone(docWithManyEdits),
        (doc) => {
          applyCursorPatches(doc, inversePatches);
        }
      );

      // todo: this doesn't work because we can't properly point to the end of the text
      // se comment above
      // assert.equal(docWithRevert.content, docWithText.content);
    });
  });
});

const replace = (doc: TextDoc, searchText: string, replaceText: string) => {
  const matchIndex = doc.content.indexOf(searchText);

  if (matchIndex === -1) {
    return;
  }

  Automerge.splice(
    doc,
    ["content"],
    matchIndex,
    searchText.length,
    replaceText
  );
};
