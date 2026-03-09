import { describe, it, expect, vi, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";

import { AnnotationSet } from "../../src/annotation-set";
import { defineAnnotationType } from "../../src/annotation-type";

describe("AnnotationsOfType", () => {
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

  it("should filter annotations by type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));
    annotations.add(titleRef, Highlight({ color: "yellow" }));

    const comments = annotations.ofType(Comment);
    expect([...comments]).toHaveLength(1);
    expect([...comments][0][1].value).toBe("A comment");
  });

  it("should lookup value by ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));

    const comments = annotations.ofType(Comment);
    expect(comments.lookup(titleRef)).toBe("A comment");
  });

  it("should return undefined for lookup if ref has no annotation of that type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    const comments = annotations.ofType(Comment);
    expect(comments.lookup(titleRef)).toBeUndefined();
  });

  it("should lookupAll values by ref", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("First"));
    annotations.add(titleRef, Comment("Second"));

    const comments = annotations.ofType(Comment);
    const values = comments.lookupAll(titleRef);
    expect(values).toHaveLength(2);
    expect(values).toContain("First");
    expect(values).toContain("Second");
  });

  it("should return empty array for lookupAll if no annotations", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    const comments = annotations.ofType(Comment);
    expect(comments.lookupAll(titleRef)).toHaveLength(0);
  });

  it("should be reactive to changes of that type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const changeHandler = vi.fn();

    const comments = annotations.ofType(Comment);
    comments.on("change", changeHandler);

    annotations.add(titleRef, Comment("A comment"));

    expect(changeHandler).toHaveBeenCalled();
    const change = changeHandler.mock.calls[0][0];
    expect(change.added).toHaveLength(1);
  });

  it("should not emit for changes of different type", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const changeHandler = vi.fn();

    const comments = annotations.ofType(Comment);
    comments.on("change", changeHandler);

    annotations.add(titleRef, Highlight({ color: "yellow" }));

    expect(changeHandler).not.toHaveBeenCalled();
  });

  it("should support subscribe for Observable interface", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const subscriber = vi.fn();

    const comments = annotations.ofType(Comment);
    comments.subscribe(subscriber);

    annotations.add(titleRef, Comment("A comment"));

    expect(subscriber).toHaveBeenCalledWith(comments);
  });

  it("should iterate over refs", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);

    annotations.add(titleRef, Comment("Title comment"));
    annotations.add(itemRef, Comment("Item comment"));

    const comments = annotations.ofType(Comment);
    const refs = [...comments.refs];
    expect(refs).toHaveLength(2);
    expect(refs).toContain(titleRef);
    expect(refs).toContain(itemRef);
  });

  it("should deduplicate refs with multiple annotations", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("First"));
    annotations.add(titleRef, Comment("Second"));

    const comments = annotations.ofType(Comment);
    const refs = [...comments.refs];
    expect(refs).toHaveLength(1);
  });

  it("should support entriesOfType (only matching type)", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const Highlight = defineAnnotationType<{ color: string }>("test/highlight");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");

    annotations.add(titleRef, Comment("A comment"));

    const comments = annotations.ofType(Comment);

    // Should yield entries for the same type
    expect([...comments.entriesOfType(Comment)]).toHaveLength(1);

    // Should not yield entries for different type
    expect([...comments.entriesOfType(Highlight)]).toHaveLength(0);
  });

  it("should support entriesOnRef", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotations = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);

    annotations.add(titleRef, Comment("Title comment"));
    annotations.add(itemRef, Comment("Item comment"));

    const comments = annotations.ofType(Comment);
    const titleEntries = [...comments.entriesOnRef(titleRef)];
    expect(titleEntries).toHaveLength(1);
    expect(titleEntries[0][1].value).toBe("Title comment");
  });

  it("should work with annotations from sub-sources", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const parent = new AnnotationSet();
    const child = new AnnotationSet();
    const titleRef = handle.ref("title");
    const itemRef = handle.ref("items", 0);

    parent.add(titleRef, Comment("Parent comment"));
    child.add(itemRef, Comment("Child comment"));
    parent.add(child);

    const comments = parent.ofType(Comment);
    expect([...comments]).toHaveLength(2);
  });
});
