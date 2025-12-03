import { describe, it, expect, beforeEach, vi } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { ref } from "@patchwork/refs";
import { AnnotationSet } from "../src/annotation-set";
import { defineAnnotationType } from "../src/annotation-type";

const Comment = defineAnnotationType<string>("patchwork/comment");
const Highlight = defineAnnotationType<{ color: string }>(
  "patchwork/highlight"
);

// Document type for proper type inference
type TestDoc = {
  title: string;
  items: { name: string }[];
};

describe("AnnotationsOfType", () => {
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

  describe("lookup", () => {
    it("should return first annotation value for a ref", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("First"));
      annotationSet.add(titleRef, Comment("Second"));

      const comments = annotationSet.ofType(Comment);
      const value = comments.lookup(titleRef);

      expect(value).toBeDefined();
      // Should return one of the comments (first one added)
      expect(value).toBe("First");
    });

    it("should return undefined for ref without annotations", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("A comment"));

      const comments = annotationSet.ofType(Comment);
      expect(comments.lookup(itemRef)).toBeUndefined();
    });
  });

  describe("lookupAll", () => {
    it("should return all annotation values for a ref", () => {
      const titleRef = ref(handle, "title");
      annotationSet.add(titleRef, Comment("First"));
      annotationSet.add(titleRef, Comment("Second"));

      const comments = annotationSet.ofType(Comment);
      const values = comments.lookupAll(titleRef);

      expect(values).toHaveLength(2);

      expect(values[0]).toBe("First");
      expect(values[1]).toBe("Second");
    });

    it("should return empty array for ref without annotations", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("A comment"));

      const comments = annotationSet.ofType(Comment);
      expect(comments.lookupAll(itemRef)).toEqual([]);
    });
  });

  describe("iterator", () => {
    it("should iterate over all annotations of the type", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotationSet.add(titleRef, Comment("Title comment"));
      annotationSet.add(itemRef, Comment("Item comment"));
      annotationSet.add(titleRef, Highlight({ color: "yellow" }));

      const comments = annotationSet.ofType(Comment);
      const annotations = [...comments];

      const firstEntry = annotations[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1]).toEqual(Comment("Title comment"));

      const secondEntry = annotations[1];
      expect(secondEntry[0]).toBe(itemRef);
      expect(secondEntry[1]).toEqual(Comment("Item comment"));

      expect(annotations).toHaveLength(2);
    });
  });

  describe("observable behavior", () => {
    it("should notify subscribers when relevant annotations are added", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      const comments = annotationSet.ofType(Comment);
      comments.subscribe(subscriber);

      annotationSet.add(titleRef, Comment("A comment"));

      expect(subscriber).toHaveBeenCalled();
    });

    it("should notify subscribers when relevant annotations are removed", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      annotationSet.add(titleRef, Comment("A comment"));

      const comments = annotationSet.ofType(Comment);
      comments.subscribe(subscriber);

      annotationSet.remove(titleRef, Comment);

      expect(subscriber).toHaveBeenCalled();
    });

    it.skip("should not notify subscribers when irrelevant annotations are added or removed", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      annotationSet.add(titleRef, Highlight({ color: "yellow" }));
      annotationSet.remove(titleRef, Highlight);

      const commentAnnotations = annotationSet.ofType(Comment);
      commentAnnotations.subscribe(subscriber);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});

describe("AnnotationsOnRef", () => {
  let repo: Repo;
  let handle: DocHandle<TestDoc>;
  let annotations: AnnotationSet;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create<TestDoc>();
    handle.change((d) => {
      d.title = "Test Document";
      d.items = [{ name: "Item 1" }, { name: "Item 2" }];
    });
    annotations = new AnnotationSet();
  });

  describe("lookup", () => {
    it("should return first annotation of a type", () => {
      const titleRef = ref(handle, "title");
      annotations.add(titleRef, Comment("First"));
      annotations.add(titleRef, Comment("Second"));

      const titleAnnotations = annotations.onRef(titleRef);
      const value = titleAnnotations.lookup(Comment);

      expect(value).toBeDefined();
    });

    it("should return undefined for type without annotations", () => {
      const titleRef = ref(handle, "title");
      annotations.add(titleRef, Comment("A comment"));

      const titleAnnotations = annotations.onRef(titleRef);

      expect(titleAnnotations.lookup(Highlight)).toBeUndefined();
    });
  });

  describe("lookupAll", () => {
    it("should return all annotations of a type", () => {
      const titleRef = ref(handle, "title");
      annotations.add(titleRef, Comment("First"));
      annotations.add(titleRef, Comment("Second"));

      const titleAnnotations = annotations.onRef(titleRef);
      const values = titleAnnotations.lookupAll(Comment);

      expect(values).toHaveLength(2);
    });

    it("should return empty array for type without annotations", () => {
      const titleRef = ref(handle, "title");
      annotations.add(titleRef, Comment("A comment"));

      const titleAnnotations = annotations.onRef(titleRef);
      expect(titleAnnotations.lookupAll(Highlight)).toEqual([]);
    });
  });

  describe("iterator", () => {
    it("should iterate over all annotations on the ref", () => {
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));
      annotations.add(titleRef, Highlight({ color: "yellow" }));

      const titleAnnotations = annotations.onRef(titleRef);
      const entries = [...titleAnnotations];

      expect(entries).toHaveLength(2);
      for (const [r] of entries) {
        expect(r).toBe(titleRef);
      }

      const firstEntry = entries[0];
      expect(firstEntry[0]).toBe(titleRef);
      expect(firstEntry[1]).toEqual(Comment("A comment"));

      const secondEntry = entries[1];
      expect(secondEntry[0]).toBe(titleRef);
      expect(secondEntry[1]).toEqual(Highlight({ color: "yellow" }));
    });
  });

  describe("observable behavior", () => {
    it.skip("should notify subscribers when annotations on this ref are added", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      const titleAnnotations = annotations.onRef(titleRef);
      titleAnnotations.subscribe(subscriber);

      annotations.add(titleRef, Comment("A comment"));

      expect(subscriber).toHaveBeenCalledOnce();
    });

    it.skip("should notify subscribers when annotations on this ref are removed", () => {
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      annotations.add(titleRef, Comment("A comment"));

      const titleAnnotations = annotations.onRef(titleRef);
      titleAnnotations.subscribe(subscriber);

      annotations.remove(titleRef);

      expect(subscriber).toHaveBeenCalledOnce();
    });

    it.skip("should not notify subscribers when irrelevant annotations are added or removed", () => {
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);
      const subscriber = vi.fn();

      const commentAnnotations = annotations.onRef(titleRef);
      commentAnnotations.subscribe(subscriber);

      annotations.add(itemRef, Highlight({ color: "yellow" }));
      annotations.remove(itemRef, Highlight);

      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});
