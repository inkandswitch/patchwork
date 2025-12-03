import { describe, it, expect, beforeEach, vi } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { ref } from "@patchwork/refs";
import { AnnotationSet } from "../src/annotation-set";
import { defineAnnotationType } from "../src/annotation-type";

// Define test annotation types
const Comment = defineAnnotationType<string>();
const Highlight = defineAnnotationType<{ color: string }>();
const Tag = defineAnnotationType<string>();

// Document type for proper type inference
type TestDoc = {
  title: string;
  items: { name: string }[];
};

describe("AnnotationSet", () => {
  let repo: Repo;
  let handle: DocHandle<TestDoc>;
  let annotationSet: AnnotationSet;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create<TestDoc>();
    handle.change((d) => {
      d.title = "Test Document";
      d.items = [{ name: "Item 1" }, { name: "Item 2" }];
    });
    annotationSet = new AnnotationSet();
  });

  describe("add", () => {
    it("should add an annotation to a ref", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("A comment"));

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(1);

      expect(annotations[0][0]).toBe(titleRef);
      expect(annotations[0][1]).toEqual(Comment("A comment"));
    });

    it("should allow multiple annotations of same type on same ref", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, [
        Comment("First comment"),
        Comment("Second comment"),
      ]);

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(2);

      const firstCommentEntry = annotations[0];
      expect(firstCommentEntry[1].value).toBe("First comment");
      expect(firstCommentEntry[1].type).toBe(Comment);

      const secondCommentEntry = annotations[1];
      expect(secondCommentEntry[1].type).toBe(Comment);
      expect(secondCommentEntry[1].value).toBe("Second comment");

      expect(firstCommentEntry[0]).toBe(secondCommentEntry[0]);
    });

    it("should allow different annotation types on same ref", () => {
      const titleRef = ref(handle, "title");

      annotationSet.add(titleRef, Comment("A comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      const annotations = [...annotationSet];

      expect(annotations).toHaveLength(2);

      const firstEntry = annotations[0];
      expect(firstEntry[1].type).toBe(Comment);
      expect(firstEntry[1].value).toBe("A comment");

      const secondEntry = annotations[1];
      expect(secondEntry[1].type).toBe(Highlight);
      expect(secondEntry[1].value).toEqual({ color: "yellow" });

      expect(firstEntry[0]).toBe(secondEntry[0]);
    });

    it("should emit 'added' event when annotation is added", () => {
      const titleRef = ref(handle, "title");
      const callback = vi.fn();
      annotationSet.on("added", callback);

      annotationSet.add(titleRef, Comment("A comment"));

      expect(callback).toHaveBeenCalledTimes(1);

      const firstCall = callback.mock.calls[0];

      const addedAnnotations = [...firstCall[0]];
      expect(addedAnnotations).toHaveLength(1);

      const firstEntry = addedAnnotations[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1].value).toBe("A comment");
    });
  });

  describe("remove", () => {
    it("should remove all annotations of a specific type", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(itemRef, Comment("Item comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      annotationSet.remove(Comment);

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(1);

      const firstEntry = annotations[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1]).toEqual(Highlight({ color: "yellow" }));
    });

    it("should remove all annotations for a ref", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));
      annotationSet.add(itemRef, Comment("Item comment"));

      annotationSet.remove(titleRef);

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(1);

      const firstEntry = annotations[0];
      expect(firstEntry[0]).toBe(itemRef);
      expect(firstEntry[1]).toEqual(Comment("Item comment"));
    });

    it("should remove annotations of specific type for a ref", () => {
      const titleRef = ref(handle, "title");

      annotationSet.add(titleRef, Comment("A comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      annotationSet.remove(titleRef, Comment);

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(1);

      const firstEntry = annotations[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1]).toEqual(Highlight({ color: "yellow" }));
    });

    it("should emit 'removed' event when annotations are removed", () => {
      const titleRef = ref(handle, "title");
      const callback = vi.fn();
      annotationSet.on("removed", callback);

      annotationSet.add(titleRef, Comment("A comment"));
      annotationSet.remove(titleRef);

      expect(callback).toHaveBeenCalledTimes(1);

      const firstCall = callback.mock.calls[0];
      const removedAnnotations = [...firstCall[0]];

      expect(removedAnnotations).toHaveLength(1);

      const firstEntry = removedAnnotations[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1]).toEqual(Comment("A comment"));
    });
  });

  describe("ofType", () => {
    it("should filter annotations by type", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(itemRef, Comment("Item comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      const comments = annotationSet.ofType(Comment);
      const commentList = [...comments];

      expect(commentList).toHaveLength(2);
      for (const [, annotation] of commentList) {
        expect(annotation.type).toBe(Comment);
      }
    });

    it("should return empty view for non-existent type", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("A comment"));

      const tags = annotationSet.ofType(Tag);
      expect([...tags]).toHaveLength(0);
    });

    it("should allow lookup by ref", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("A comment"));

      const comments = annotationSet.ofType(Comment);
      const value = comments.lookup(titleRef);

      expect(value).toBe("A comment");
    });
  });

  describe("onRef", () => {
    it("should filter annotations on a specific ref", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));
      annotationSet.add(itemRef, Comment("Item comment"));

      const titleAnnotations = annotationSet.onRef(titleRef);
      const annotationList = [...titleAnnotations];

      expect(annotationList).toHaveLength(2);
      for (const [r] of annotationList) {
        expect(r).toBe(titleRef);
      }
    });

    it("should return empty view for ref with no annotations", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("A comment"));

      const itemAnnotations = annotationSet.onRef(itemRef);
      expect([...itemAnnotations]).toHaveLength(0);
    });

    it("should allow lookup by type", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("A comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      const titleAnnotations = annotationSet.onRef(titleRef);
      const comment = titleAnnotations.lookup(Comment);
      const highlight = titleAnnotations.lookup(Highlight);

      expect(comment).toBe("A comment");
      expect(highlight).toEqual({ color: "yellow" });
    });
  });

  describe("onChildrenOf", () => {
    it("should filter annotations on children of an array ref", () => {
      const itemsRef = ref(handle, "items") as any; // type widening for test
      const firstItemRef = ref(handle, "items", 0);
      const secondItemRef = ref(handle, "items", 1);
      const titleRef = ref(handle, "title");

      annotationSet.add(firstItemRef, Comment("First item"));
      annotationSet.add(secondItemRef, Comment("Second item"));
      annotationSet.add(titleRef, Comment("Title"));

      const childAnnotations = annotationSet.onChildrenOf(itemsRef);
      const annotationList = [...childAnnotations];

      expect(annotationList).toHaveLength(2);

      const firstEntry = annotationList[0];
      expect(firstEntry[0]).toBe(firstItemRef);
      expect(firstEntry[1].value).toBe("First item");

      const secondEntry = annotationList[1];
      expect(secondEntry[0]).toBe(secondItemRef);
      expect(secondEntry[1].value).toBe("Second item");
    });
  });

  describe("iterator", () => {
    it("should iterate over all annotations", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));
      annotationSet.add(itemRef, Comment("Item comment"));

      const annotations = [...annotationSet];
      expect(annotations).toHaveLength(3);

      const titleCommentEntry = annotations.find(
        ([ref, annotation]) => ref === titleRef && annotation.type === Comment
      )!;
      expect(titleCommentEntry[0].toString()).toBe(titleRef.toString());
      expect(titleCommentEntry[1]).toEqual(Comment("Title comment"));

      const titleHighlightEntry = annotations.find(
        ([ref, annotation]) => ref === titleRef && annotation.type === Highlight
      )!;
      expect(titleHighlightEntry[0].toString()).toBe(titleRef.toString());
      expect(titleHighlightEntry[1]).toEqual(Highlight({ color: "yellow" }));

      const itemCommentEntry = annotations.find(
        ([ref, annotation]) => ref === itemRef && annotation.type === Comment
      )!;
      expect(itemCommentEntry[0].toString()).toBe(itemRef.toString());
      expect(itemCommentEntry[1]).toEqual(Comment("Item comment"));
    });

    it("should be iterable with for...of", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("A comment"));

      let count = 0;
      for (const [r, annotation] of annotationSet) {
        expect(r).toBe(titleRef);
        expect(annotation.value).toBe("A comment");
        count++;
      }
      expect(count).toBe(1);
    });
  });

  describe("observable behavior", () => {
    it("should notify subscribers when annotations change", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      annotationSet.subscribe(subscriber);
      annotationSet.add(titleRef, Comment("A comment"));

      expect(subscriber).toHaveBeenCalled();
    });

    it("should stop notifying after unsubscribe", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      const unsubscribe = annotationSet.subscribe(subscriber);
      annotationSet.add(titleRef, Comment("First"));
      const callsBeforeUnsubscribe = subscriber.mock.calls.length;

      unsubscribe();
      annotationSet.add(titleRef, Comment("Second"));

      // Should not have received any new calls after unsubscribe
      expect(subscriber).toHaveBeenCalledTimes(callsBeforeUnsubscribe);
    });
  });

  describe("subsets", () => {
    let subSet: AnnotationSet;

    beforeEach(() => {
      subSet = new AnnotationSet();
    });

    describe("adding subsets", () => {
      it("should include subset annotations in iteration", () => {
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        subSet.add(titleRef, Comment("Subset comment"));
        annotationSet.add(itemRef, Comment("Main comment"));
        annotationSet.add(subSet);

        const annotations = [...annotationSet];
        expect(annotations).toHaveLength(2);
      });

      it("should emit added event for existing subset annotations", () => {
        const titleRef = ref(handle, "title");
        const handler = vi.fn();

        subSet.add(titleRef, Comment("Preset comment"));
        annotationSet.on("added", handler);
        annotationSet.add(subSet);

        expect(handler).toHaveBeenCalledTimes(1);
        const addedAnnotations = [...handler.mock.calls[0][0]];
        expect(addedAnnotations).toHaveLength(1);
        expect(addedAnnotations[0][1].value).toBe("Preset comment");
      });

      it("should include subset annotations in lookup", () => {
        const titleRef = ref(handle, "title");

        subSet.add(titleRef, Comment("Subset comment"));
        annotationSet.add(subSet);

        const value = annotationSet.lookup(titleRef, Comment);
        expect(value).toBe("Subset comment");
      });

      it("should include subset annotations in lookupAll", () => {
        const titleRef = ref(handle, "title");

        annotationSet.add(titleRef, Comment("Main comment"));
        subSet.add(titleRef, Comment("Subset comment"));
        annotationSet.add(subSet);

        const values = annotationSet.lookupAll(titleRef, Comment);
        expect(values).toHaveLength(2);
        expect(values).toContain("Main comment");
        expect(values).toContain("Subset comment");
      });
    });

    describe("event forwarding from subsets", () => {
      it("should forward added events from subset", () => {
        const titleRef = ref(handle, "title");
        const handler = vi.fn();

        annotationSet.add(subSet);
        annotationSet.on("added", handler);

        subSet.add(titleRef, Comment("New comment"));

        expect(handler).toHaveBeenCalledTimes(1);
        const addedAnnotations = [...handler.mock.calls[0][0]];
        expect(addedAnnotations).toHaveLength(1);
        expect(addedAnnotations[0][1].value).toBe("New comment");
      });

      it("should forward removed events from subset", () => {
        const titleRef = ref(handle, "title");
        const handler = vi.fn();

        subSet.add(titleRef, Comment("To remove"));
        annotationSet.add(subSet);
        annotationSet.on("removed", handler);

        subSet.remove(titleRef);

        expect(handler).toHaveBeenCalledTimes(1);
        const removedAnnotations = [...handler.mock.calls[0][0]];
        expect(removedAnnotations).toHaveLength(1);
        expect(removedAnnotations[0][1].value).toBe("To remove");
      });

      it("should notify subscribers when subset changes", () => {
        const titleRef = ref(handle, "title");
        const subscriber = vi.fn();

        annotationSet.add(subSet);
        annotationSet.subscribe(subscriber);

        subSet.add(titleRef, Comment("New comment"));

        expect(subscriber).toHaveBeenCalled();
      });

      it("should forward events from deeply nested subsets", () => {
        const titleRef = ref(handle, "title");
        const handler = vi.fn();
        const nestedSubSet = new AnnotationSet();

        subSet.add(nestedSubSet);
        annotationSet.add(subSet);
        annotationSet.on("added", handler);

        nestedSubSet.add(titleRef, Comment("Deeply nested"));

        expect(handler).toHaveBeenCalledTimes(1);
        const addedAnnotations = [...handler.mock.calls[0][0]];
        expect(addedAnnotations[0][1].value).toBe("Deeply nested");
      });
    });

    describe("cascading removal to subsets", () => {
      it("should remove annotation from subset when removing by ref", () => {
        const titleRef = ref(handle, "title");

        subSet.add(titleRef, Comment("Subset comment"));
        annotationSet.add(titleRef, Comment("Main comment"));
        annotationSet.add(subSet);

        expect([...annotationSet]).toHaveLength(2);

        annotationSet.remove(titleRef);

        expect([...annotationSet]).toHaveLength(0);
        expect([...subSet]).toHaveLength(0);
      });

      it("should remove annotation from subset when removing by type", () => {
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        subSet.add(titleRef, Comment("Subset comment"));
        subSet.add(itemRef, Highlight({ color: "yellow" }));
        annotationSet.add(titleRef, Comment("Main comment"));
        annotationSet.add(subSet);

        expect([...annotationSet]).toHaveLength(3);

        annotationSet.remove(Comment);

        expect([...annotationSet]).toHaveLength(1);
        // Only the Highlight should remain in the subset
        expect([...subSet]).toHaveLength(1);
        expect([...subSet][0][1].type).toBe(Highlight);
      });

      it("should remove annotation from subset when removing by ref and type", () => {
        const titleRef = ref(handle, "title");

        subSet.add(titleRef, Comment("Subset comment"));
        subSet.add(titleRef, Highlight({ color: "yellow" }));
        annotationSet.add(titleRef, Comment("Main comment"));
        annotationSet.add(subSet);

        expect([...annotationSet]).toHaveLength(3);

        annotationSet.remove(titleRef, Comment);

        expect([...annotationSet]).toHaveLength(1);
        // Only the Highlight should remain in the subset
        expect([...subSet]).toHaveLength(1);
        expect([...subSet][0][1].type).toBe(Highlight);
      });

      it("should emit removed events from subset during cascade", () => {
        const titleRef = ref(handle, "title");
        const mainRemovedHandler = vi.fn();
        const subsetRemovedHandler = vi.fn();

        subSet.add(titleRef, Comment("Subset comment"));
        annotationSet.add(titleRef, Comment("Main comment"));
        annotationSet.add(subSet);

        annotationSet.on("removed", mainRemovedHandler);
        subSet.on("removed", subsetRemovedHandler);

        annotationSet.remove(titleRef);

        // Main set should emit for its own annotation
        expect(mainRemovedHandler).toHaveBeenCalled();
        // Subset should also emit (which will be forwarded to main)
        expect(subsetRemovedHandler).toHaveBeenCalled();
      });

      it("should cascade removal to deeply nested subsets", () => {
        const titleRef = ref(handle, "title");
        const nestedSubSet = new AnnotationSet();

        nestedSubSet.add(titleRef, Comment("Deeply nested"));
        subSet.add(titleRef, Comment("Subset comment"));
        subSet.add(nestedSubSet);
        annotationSet.add(titleRef, Comment("Main comment"));
        annotationSet.add(subSet);

        expect([...annotationSet]).toHaveLength(3);

        annotationSet.remove(titleRef);

        expect([...annotationSet]).toHaveLength(0);
        expect([...subSet]).toHaveLength(0);
        expect([...nestedSubSet]).toHaveLength(0);
      });

      it("should handle removal when annotation only exists in subset", () => {
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        subSet.add(titleRef, Comment("Subset only"));
        annotationSet.add(itemRef, Comment("Main only"));
        annotationSet.add(subSet);

        annotationSet.remove(titleRef);

        expect([...annotationSet]).toHaveLength(1);
        expect([...subSet]).toHaveLength(0);
      });
    });
  });
});
