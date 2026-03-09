import { describe, it, expect, vi, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";

import { AnnotationSet } from "../../src/annotation-set";
import { defineAnnotationType } from "../../src/annotation-type";

describe("AnnotationsOnRef", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
    handle.change((d: any) => {
      d.title = "Test Document";
      d.items = [{ name: "Item 1" }, { name: "Item 2" }, { name: "Item 3" }];
    });
  });

  it("should filter annotations by ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);

    annotations.add(titleRef, Comment("Title comment"));
    annotations.add(itemRef, Comment("Item comment"));

    const titleAnnotations = annotations.onRef(titleRef);
    expect([...titleAnnotations]).toHaveLength(1);
    expect([...titleAnnotations][0][1].value).toBe("Title comment");
  });

  it("should lookup value by type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));
    annotations.add(titleRef, Highlight({ color: "yellow" }));

    const titleAnnotations = annotations.onRef(titleRef);
    expect(titleAnnotations.lookup(Comment)).toBe("A comment");
    expect(titleAnnotations.lookup(Highlight)).toEqual({ color: "yellow" });
  });

  it("should return undefined for lookup if type not present", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));

    const titleAnnotations = annotations.onRef(titleRef);
    expect(titleAnnotations.lookup(Highlight)).toBeUndefined();
  });

  it("should lookupAll values by type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("First"));
    annotations.add(titleRef, Comment("Second"));

    const titleAnnotations = annotations.onRef(titleRef);
    const values = titleAnnotations.lookupAll(Comment);
    expect(values).toHaveLength(2);
    expect(values).toContain("First");
    expect(values).toContain("Second");
  });

  it("should return empty array for lookupAll if type not present", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));

    const titleAnnotations = annotations.onRef(titleRef);
    expect(titleAnnotations.lookupAll(Highlight)).toHaveLength(0);
  });

  it("should be reactive to changes on that ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const changeHandler = vi.fn();

    const titleAnnotations = annotations.onRef(titleRef);
    titleAnnotations.on("change", changeHandler);

    annotations.add(titleRef, Comment("A comment"));

    expect(changeHandler).toHaveBeenCalled();
    const change = changeHandler.mock.calls[0][0];
    expect(change.added).toHaveLength(1);
  });

  it("should not emit for changes on different ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);
    const changeHandler = vi.fn();

    const titleAnnotations = annotations.onRef(titleRef);
    titleAnnotations.on("change", changeHandler);

    annotations.add(itemRef, Comment("Item comment"));

    expect(changeHandler).not.toHaveBeenCalled();
  });

  it("should support subscribe for Observable interface", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const subscriber = vi.fn();

    const titleAnnotations = annotations.onRef(titleRef);
    titleAnnotations.subscribe(subscriber);

    annotations.add(titleRef, Comment("A comment"));

    expect(subscriber).toHaveBeenCalledWith(titleAnnotations);
  });

  it("should iterate over refs (only the filtered ref)", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));

    const titleAnnotations = annotations.onRef(titleRef);
    const refs = [...titleAnnotations.refs];
    expect(refs).toHaveLength(1);
    expect(refs[0]).toBe(titleRef);
  });

  it("should support entriesOfType", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));
    annotations.add(titleRef, Highlight({ color: "yellow" }));

    const titleAnnotations = annotations.onRef(titleRef);

    expect([...titleAnnotations.entriesOfType(Comment)]).toHaveLength(1);
    expect([...titleAnnotations.entriesOfType(Highlight)]).toHaveLength(1);
  });

  it("should support entriesOnRef (only yields for matching ref)", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);

    annotations.add(titleRef, Comment("Title comment"));

    const titleAnnotations = annotations.onRef(titleRef);

    // Should yield for the same ref
    expect([...titleAnnotations.entriesOnRef(titleRef)]).toHaveLength(1);

    // Should not yield for different ref
    expect([...titleAnnotations.entriesOnRef(itemRef)]).toHaveLength(0);
  });

  it("should work with annotations from sub-sources", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const parent = new AnnotationSet();
    const child = new AnnotationSet();
    const titleRef = handle.ref("title");

    parent.add(titleRef, Comment("Parent comment"));
    child.add(titleRef, Comment("Child comment"));
    parent.add(child);

    const titleAnnotations = parent.onRef(titleRef);
    expect([...titleAnnotations]).toHaveLength(2);
  });

  it("should handle multiple annotation types on same ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const Tag = defineAnnotationType<string>("test/tag");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));
    annotations.add(titleRef, Highlight({ color: "yellow" }));
    annotations.add(titleRef, Tag("important"));

    const titleAnnotations = annotations.onRef(titleRef);
    expect([...titleAnnotations]).toHaveLength(3);
  });

  describe("equivalent ref support", () => {
    it("should find annotations when onRef uses equivalent ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();

      handle.change((d: any) => {
        d.todos = [
          { id: "abc", title: "First" },
          { id: "def", title: "Second" },
        ];
      });

      // Add annotation using pattern-based ref
      const patternRef = handle.ref("todos", { id: "abc" });
      annotations.add(patternRef, Comment("Comment on first"));

      // Create view using index-based ref
      const indexRef = handle.ref("todos", 0);
      const view = annotations.onRef(indexRef);

      expect([...view]).toHaveLength(1);
      expect(view.lookup(Comment)).toBe("Comment on first");
    });

    it("should emit change events for equivalent refs", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const changeHandler = vi.fn();

      handle.change((d: any) => {
        d.todos = [{ id: "abc", title: "First" }];
      });

      // Create view with index-based ref
      const indexRef = handle.ref("todos", 0);
      const view = annotations.onRef(indexRef);
      view.on("change", changeHandler);

      // Add annotation with pattern-based ref (equivalent)
      const patternRef = handle.ref("todos", { id: "abc" });
      annotations.add(patternRef, Comment("New comment"));

      expect(changeHandler).toHaveBeenCalled();
      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);
    });

    it("should not emit change events for non-equivalent refs", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const changeHandler = vi.fn();

      handle.change((d: any) => {
        d.todos = [
          { id: "abc", title: "First" },
          { id: "def", title: "Second" },
        ];
      });

      // Create view for first item
      const firstRef = handle.ref("todos", 0);
      const view = annotations.onRef(firstRef);
      view.on("change", changeHandler);

      // Add annotation to second item
      const secondRef = handle.ref("todos", { id: "def" });
      annotations.add(secondRef, Comment("Comment on second"));

      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("should support entriesOnRef with equivalent refs", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();

      handle.change((d: any) => {
        d.todos = [{ id: "abc", title: "First" }];
      });

      const patternRef = handle.ref("todos", { id: "abc" });
      annotations.add(patternRef, Comment("A comment"));

      const indexRef = handle.ref("todos", 0);
      const view = annotations.onRef(indexRef);

      // entriesOnRef with the same ref should work
      expect([...view.entriesOnRef(indexRef)]).toHaveLength(1);

      // entriesOnRef with an equivalent ref should also work
      expect([...view.entriesOnRef(patternRef)]).toHaveLength(1);
    });
  });
});
