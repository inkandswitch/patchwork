import { describe, it, expect, vi, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { ref } from "@patchwork/refs";
import { AnnotationSet } from "../src/annotation-set";
import { defineAnnotationType } from "../src/annotation-type";

describe("AnnotationSet", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
    handle.change((d: any) => {
      d.title = "Test Document";
      d.items = [{ name: "Item 1" }, { name: "Item 2" }, { name: "Item 3" }];
      d.content = "Hello world, this is some content.";
    });
  });

  describe("adding annotations", () => {
    it("should add a single annotation to a ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));

      const all = [...annotations];
      expect(all).toHaveLength(1);

      const entry = all[0];
      expect(entry[0]).toBe(titleRef);
      expect(entry[1].value).toBe("A comment");
      expect(entry[1].type.id).toBe("test/comment");
    });

    it("should add multiple annotations to the same ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, [Comment("First"), Comment("Second")]);

      const all = [...annotations];
      expect(all).toHaveLength(2);

      const first = all[0];
      expect(first[0]).toBe(titleRef);
      expect(first[1].value).toBe("First");

      const second = all[1];
      expect(second[0]).toBe(titleRef);
      expect(second[1].value).toBe("Second");
    });

    it("should add multiple annotations of different types to the same ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, [
        Comment("A comment"),
        Highlight({ color: "yellow" }),
      ]);

      const all = [...annotations];
      expect(all).toHaveLength(2);

      const commentEntry = all[0];
      expect(commentEntry[0]).toBe(titleRef);
      expect(commentEntry[1].value).toBe("A comment");
      expect(commentEntry[1].type.id).toBe("test/comment");

      const highlightEntry = all[1];
      expect(highlightEntry[0]).toBe(titleRef);
      expect(highlightEntry[1].value).toEqual({ color: "yellow" });
      expect(highlightEntry[1].type.id).toBe("test/highlight");
    });

    it("should add an annotation source as a sub-source", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");

      child.add(titleRef, Comment("Child comment"));
      parent.add(child);

      const all = [...parent];
      expect(all).toHaveLength(1);

      const entry = all[0];
      expect(entry[0]).toBe(titleRef);
      expect(entry[1].value).toBe("Child comment");
    });

    it("should emit change event when adding annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      annotations.on("change", changeHandler);
      annotations.add(titleRef, Comment("A comment"));

      expect(changeHandler).toHaveBeenCalledOnce();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);
      expect(change.removed).toHaveLength(0);

      const added = change.added[0];
      expect(added[0]).toBe(titleRef);
      expect(added[1].value).toBe("A comment");
      expect(added[1].type.id).toBe("test/comment");
    });

    it("should forward change events from added sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      parent.add(child);
      parent.on("change", changeHandler);

      child.add(titleRef, Comment("New comment"));

      expect(changeHandler).toHaveBeenCalled();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);

      const added = change.added[0];
      expect(added[0]).toBe(titleRef);
      expect(added[1].value).toBe("New comment");
    });
  });

  describe("removing annotations", () => {
    it("should remove all annotations of a specific type", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));
      annotations.add(titleRef, Highlight({ color: "yellow" }));

      annotations.remove(Comment);

      const all = [...annotations];
      expect(all).toHaveLength(1);

      const remaining = all[0];
      expect(remaining[0]).toBe(titleRef);
      expect(remaining[1].type.id).toBe("test/highlight");
      expect(remaining[1].value).toEqual({ color: "yellow" });
    });

    it("should remove all annotations for a ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotations.add(titleRef, Comment("Title comment"));
      annotations.add(itemRef, Comment("Item comment"));

      annotations.remove(titleRef);

      const all = [...annotations];
      expect(all).toHaveLength(1);

      const remaining = all[0];
      expect(remaining[0]).toBe(itemRef);
      expect(remaining[1].value).toBe("Item comment");
    });

    it("should remove annotations of a specific type for a ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));
      annotations.add(titleRef, Highlight({ color: "yellow" }));

      annotations.remove(titleRef, Comment);

      const all = [...annotations];
      expect(all).toHaveLength(1);

      const remaining = all[0];
      expect(remaining[0]).toBe(titleRef);
      expect(remaining[1].type.id).toBe("test/highlight");
      expect(remaining[1].value).toEqual({ color: "yellow" });
    });

    it("should remove an annotation source", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");

      child.add(titleRef, Comment("Child comment"));
      parent.add(child);

      const before = [...parent];
      expect(before).toHaveLength(1);

      const entry = before[0];
      expect(entry[1].value).toBe("Child comment");

      parent.remove(child);

      expect([...parent]).toHaveLength(0);
    });

    it("should stop forwarding events after source is removed", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      parent.add(child);
      parent.remove(child);
      parent.on("change", changeHandler);

      child.add(titleRef, Comment("Should not appear"));

      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("should emit change event when removing annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      annotations.add(titleRef, Comment("A comment"));
      annotations.on("change", changeHandler);
      annotations.remove(titleRef);

      expect(changeHandler).toHaveBeenCalled();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(0);
      expect(change.removed).toHaveLength(1);

      const removed = change.removed[0];
      expect(removed[0]).toBe(titleRef);
      expect(removed[1].value).toBe("A comment");
    });
  });

  describe("clear", () => {
    it("should remove all annotations and sub-sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotations.add(titleRef, Comment("Direct comment"));
      child.add(itemRef, Comment("Child comment"));
      annotations.add(child);

      const before = [...annotations];
      expect(before).toHaveLength(2);

      const first = before[0];
      expect(first[1].value).toBe("Direct comment");

      const second = before[1];
      expect(second[1].value).toBe("Child comment");

      annotations.clear();

      expect([...annotations]).toHaveLength(0);
    });

    it("should emit change event with all removed annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      annotations.add(titleRef, Comment("First"));
      annotations.add(titleRef, Comment("Second"));
      annotations.on("change", changeHandler);
      annotations.clear();

      expect(changeHandler).toHaveBeenCalled();

      const change = changeHandler.mock.calls[0][0];
      expect(change.removed).toHaveLength(2);

      const removed1 = change.removed[0];
      expect(removed1[0]).toBe(titleRef);
      expect(removed1[1].value).toBe("First");

      const removed2 = change.removed[1];
      expect(removed2[0]).toBe(titleRef);
      expect(removed2[1].value).toBe("Second");
    });
  });

  describe("lookup and lookupAll", () => {
    it("should lookup a single value by ref and type", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));

      const value = annotations.lookup(titleRef, Comment);
      expect(value).toBe("A comment");
    });

    it("should return undefined if no annotation exists", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      const value = annotations.lookup(titleRef, Comment);
      expect(value).toBeUndefined();
    });

    it("should lookupAll values by ref and type", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("First"));
      annotations.add(titleRef, Comment("Second"));

      const values = annotations.lookupAll(titleRef, Comment);
      expect(values).toHaveLength(2);
      expect(values[0]).toBe("First");
      expect(values[1]).toBe("Second");
    });
  });

  describe("iteration", () => {
    it("should iterate over all annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotations.add(titleRef, Comment("Title comment"));
      annotations.add(itemRef, Comment("Item comment"));

      const all = [...annotations];
      expect(all).toHaveLength(2);

      const titleEntry = all[0];
      expect(titleEntry[0]).toBe(titleRef);
      expect(titleEntry[1].value).toBe("Title comment");

      const itemEntry = all[1];
      expect(itemEntry[0]).toBe(itemRef);
      expect(itemEntry[1].value).toBe("Item comment");
    });

    it("should iterate over refs", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotations.add(titleRef, Comment("Title comment"));
      annotations.add(itemRef, Comment("Item comment"));

      const refs = [...annotations.refs];
      expect(refs).toHaveLength(2);
      expect(refs[0]).toBe(titleRef);
      expect(refs[1]).toBe(itemRef);
    });

    it("should deduplicate refs with multiple annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("First"));
      annotations.add(titleRef, Comment("Second"));

      const refs = [...annotations.refs];
      expect(refs).toHaveLength(1);
      expect(refs[0]).toBe(titleRef);
    });

    it("should iterate over annotations from sub-sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      parent.add(titleRef, Comment("Parent comment"));
      child.add(itemRef, Comment("Child comment"));
      parent.add(child);

      const all = [...parent];
      expect(all).toHaveLength(2);

      const parentEntry = all[0];
      expect(parentEntry[0]).toBe(titleRef);
      expect(parentEntry[1].value).toBe("Parent comment");

      const childEntry = all[1];
      expect(childEntry[0]).toBe(itemRef);
      expect(childEntry[1].value).toBe("Child comment");
    });

    it("should iterate refs from sub-sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      parent.add(titleRef, Comment("Parent comment"));
      child.add(itemRef, Comment("Child comment"));
      parent.add(child);

      const refs = [...parent.refs];
      expect(refs).toHaveLength(2);
      expect(refs[0]).toBe(titleRef);
      expect(refs[1]).toBe(itemRef);
    });

    it("should use entriesOfType to iterate by type", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("A comment"));
      annotations.add(titleRef, Highlight({ color: "yellow" }));

      const comments = [...annotations.entriesOfType(Comment)];
      expect(comments).toHaveLength(1);

      const commentEntry = comments[0];
      expect(commentEntry[0]).toBe(titleRef);
      expect(commentEntry[1].value).toBe("A comment");
      expect(commentEntry[1].type.id).toBe("test/comment");
    });

    it("should use entriesOnRef to iterate by ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      annotations.add(titleRef, Comment("Title comment"));
      annotations.add(titleRef, Highlight({ color: "yellow" }));
      annotations.add(itemRef, Comment("Item comment"));

      const titleEntries = [...annotations.entriesOnRef(titleRef)];
      expect(titleEntries).toHaveLength(2);

      const titleComment = titleEntries[0];
      expect(titleComment[0]).toBe(titleRef);
      expect(titleComment[1].value).toBe("Title comment");

      const titleHighlight = titleEntries[1];
      expect(titleHighlight[0]).toBe(titleRef);
      expect(titleHighlight[1].value).toEqual({ color: "yellow" });
    });
  });

  describe("batching with change()", () => {
    it("should batch multiple operations into one event", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);
      const changeHandler = vi.fn();

      annotations.on("change", changeHandler);

      annotations.change(() => {
        annotations.add(titleRef, Comment("First"));
        annotations.add(itemRef, Comment("Second"));
      });

      expect(changeHandler).toHaveBeenCalledOnce();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(2);

      const added1 = change.added[0];
      expect(added1[0]).toBe(titleRef);
      expect(added1[1].value).toBe("First");

      const added2 = change.added[1];
      expect(added2[0]).toBe(itemRef);
      expect(added2[1].value).toBe("Second");
    });

    it("should batch adds and removes", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      annotations.add(titleRef, Comment("Original"));
      annotations.on("change", changeHandler);

      annotations.change(() => {
        annotations.remove(titleRef);
        annotations.add(titleRef, Comment("Replacement"));
      });

      expect(changeHandler).toHaveBeenCalledOnce();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);
      expect(change.removed).toHaveLength(1);

      const added = change.added[0];
      expect(added[0]).toBe(titleRef);
      expect(added[1].value).toBe("Replacement");

      const removed = change.removed[0];
      expect(removed[0]).toBe(titleRef);
      expect(removed[1].value).toBe("Original");
    });

    it("should not emit if no changes made in batch", () => {
      const annotations = new AnnotationSet();
      const changeHandler = vi.fn();

      annotations.on("change", changeHandler);

      annotations.change(() => {
        // Do nothing
      });

      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("should throw on nested changes", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");

      expect(() => {
        annotations.change(() => {
          annotations.change(() => {
            annotations.add(titleRef, Comment("Nested"));
          });
        });
      }).toThrow("Nested changes are not allowed");
    });
  });

  describe("subscription", () => {
    it("should support subscribe for Observable interface", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      annotations.subscribe(subscriber);
      annotations.add(titleRef, Comment("A comment"));

      expect(subscriber).toHaveBeenCalledWith(annotations);
    });

    it("should support unsubscribing", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const subscriber = vi.fn();

      const unsubscribe = annotations.subscribe(subscriber);
      unsubscribe();
      annotations.add(titleRef, Comment("A comment"));

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("complex scenarios", () => {
    it("should handle deeply nested annotation sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const root = new AnnotationSet();
      const level1 = new AnnotationSet();
      const level2 = new AnnotationSet();
      const titleRef = ref(handle, "title");

      level2.add(titleRef, Comment("Deep comment"));
      level1.add(level2);
      root.add(level1);

      const all = [...root];
      expect(all).toHaveLength(1);

      const entry = all[0];
      expect(entry[0]).toBe(titleRef);
      expect(entry[1].value).toBe("Deep comment");
      expect(entry[1].type.id).toBe("test/comment");
    });

    it("should propagate events through nested sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const root = new AnnotationSet();
      const level1 = new AnnotationSet();
      const level2 = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      level1.add(level2);
      root.add(level1);
      root.on("change", changeHandler);

      level2.add(titleRef, Comment("Deep comment"));

      expect(changeHandler).toHaveBeenCalled();

      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);

      const added = change.added[0];
      expect(added[0]).toBe(titleRef);
      expect(added[1].value).toBe("Deep comment");
      expect(added[1].type.id).toBe("test/comment");
    });

    it("should maintain annotation integrity across multiple sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const root = new AnnotationSet();
      const source1 = new AnnotationSet();
      const source2 = new AnnotationSet();
      const titleRef = ref(handle, "title");
      const itemRef = ref(handle, "items", 0);

      root.add(titleRef, Comment("Root comment"));
      source1.add(titleRef, Highlight({ color: "yellow" }));
      source1.add(itemRef, Comment("Source1 item comment"));
      source2.add(itemRef, Highlight({ color: "blue" }));

      root.add(source1);
      root.add(source2);

      const all = [...root];
      expect(all).toHaveLength(4);

      expect(root.lookup(titleRef, Comment)).toBe("Root comment");
      expect(root.lookup(titleRef, Highlight)).toEqual({ color: "yellow" });
      expect(root.lookup(itemRef, Comment)).toBe("Source1 item comment");
      expect(root.lookup(itemRef, Highlight)).toEqual({ color: "blue" });
    });
  });
});
