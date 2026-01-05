import { describe, it, expect, vi, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { ref } from "@patchwork/refs";
import { AnnotationSet } from "../../src/annotation-set";
import { defineAnnotationType } from "../../src/annotation-type";

describe("FilteredAnnotationView", () => {
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

  describe("onChildrenOf", () => {
    it("should filter annotations on direct children of an array ref", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);
      const nestedRef = ref(handle, "items", 0, "name");

      annotations.add(item0Ref, Comment("Item 0 comment"));
      annotations.add(item1Ref, Comment("Item 1 comment"));
      annotations.add(nestedRef, Comment("Nested comment"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const all = [...childAnnotations];

      expect(all).toHaveLength(2);
      expect(all.map((a) => a[1].value)).toContain("Item 0 comment");
      expect(all.map((a) => a[1].value)).toContain("Item 1 comment");
    });

    it("should not include parent ref annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);

      annotations.add(itemsRef, Comment("Parent comment"));
      annotations.add(item0Ref, Comment("Child comment"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const all = [...childAnnotations];

      expect(all).toHaveLength(1);
      expect(all[0][1].value).toBe("Child comment");
    });
  });

  describe("onPartOf", () => {
    it("should filter annotations anywhere in subtree", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const nameRef = ref(handle, "items", 0, "name");
      const titleRef = ref(handle, "title");

      annotations.add(item0Ref, Comment("Item comment"));
      annotations.add(nameRef, Comment("Name comment"));
      annotations.add(titleRef, Comment("Title comment"));

      const subtreeAnnotations = annotations.onPartOf(itemsRef);
      const all = [...subtreeAnnotations];

      expect(all).toHaveLength(2);
      expect(all.map((a) => a[1].value)).toContain("Item comment");
      expect(all.map((a) => a[1].value)).toContain("Name comment");
    });

    it("should not include the parent ref itself", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);

      annotations.add(itemsRef, Comment("Parent comment"));
      annotations.add(item0Ref, Comment("Child comment"));

      const subtreeAnnotations = annotations.onPartOf(itemsRef);
      const all = [...subtreeAnnotations];

      expect(all).toHaveLength(1);
      expect(all[0][1].value).toBe("Child comment");
    });
  });

  describe("chaining filters", () => {
    it("should support chaining ofType after onChildrenOf", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment on item 0"));
      annotations.add(item0Ref, Highlight({ color: "yellow" }));
      annotations.add(item1Ref, Comment("Comment on item 1"));

      const childComments = annotations.onChildrenOf(itemsRef).ofType(Comment);
      expect([...childComments]).toHaveLength(2);
    });

    it("should support chaining onRef after onChildrenOf", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment on item 0"));
      annotations.add(item1Ref, Comment("Comment on item 1"));

      const item0Annotations = annotations
        .onChildrenOf(itemsRef)
        .onRef(item0Ref);
      expect([...item0Annotations]).toHaveLength(1);
      expect([...item0Annotations][0][1].value).toBe("Comment on item 0");
    });

    it("should support chaining onChildrenOf after onPartOf", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const nameRef = ref(handle, "items", 0, "name");

      annotations.add(item0Ref, Comment("Direct child"));
      annotations.add(nameRef, Comment("Nested child"));

      // This should find annotations on children of items,
      // then children of those (which would be name properties)
      const nestedChildren = annotations
        .onPartOf(itemsRef)
        .onChildrenOf(item0Ref);
      expect([...nestedChildren]).toHaveLength(1);
      expect([...nestedChildren][0][1].value).toBe("Nested child");
    });
  });

  describe("lookup methods", () => {
    it("should support lookup on filtered view", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);

      annotations.add(item0Ref, Comment("Comment on item 0"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const value = childAnnotations.lookup(item0Ref, Comment);
      expect(value).toBe("Comment on item 0");
    });

    it("should return undefined for lookup outside filter", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const titleRef = ref(handle, "title");

      annotations.add(titleRef, Comment("Title comment"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const value = childAnnotations.lookup(titleRef, Comment);
      expect(value).toBeUndefined();
    });

    it("should support lookupAll on filtered view", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);

      annotations.add(item0Ref, Comment("First"));
      annotations.add(item0Ref, Comment("Second"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const values = childAnnotations.lookupAll(item0Ref, Comment);
      expect(values).toHaveLength(2);
      expect(values).toContain("First");
      expect(values).toContain("Second");
    });
  });

  describe("reactivity", () => {
    it("should be reactive to changes matching filter", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const changeHandler = vi.fn();

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      childAnnotations.on("change", changeHandler);

      annotations.add(item0Ref, Comment("New comment"));

      expect(changeHandler).toHaveBeenCalled();
      const change = changeHandler.mock.calls[0][0];
      expect(change.added).toHaveLength(1);
    });

    it("should not emit for changes outside filter", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const titleRef = ref(handle, "title");
      const changeHandler = vi.fn();

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      childAnnotations.on("change", changeHandler);

      annotations.add(titleRef, Comment("Title comment"));

      expect(changeHandler).not.toHaveBeenCalled();
    });

    it("should support subscribe for Observable interface", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const subscriber = vi.fn();

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      childAnnotations.subscribe(subscriber);

      annotations.add(item0Ref, Comment("New comment"));

      expect(subscriber).toHaveBeenCalledWith(childAnnotations);
    });
  });

  describe("iteration", () => {
    it("should iterate over matching annotations", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment 0"));
      annotations.add(item1Ref, Comment("Comment 1"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      expect([...childAnnotations]).toHaveLength(2);
    });

    it("should iterate refs", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment 0"));
      annotations.add(item1Ref, Comment("Comment 1"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const refs = [...childAnnotations.refs];
      expect(refs).toHaveLength(2);
      expect(refs).toContain(item0Ref);
      expect(refs).toContain(item1Ref);
    });

    it("should support entriesOfType", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);

      annotations.add(item0Ref, Comment("A comment"));
      annotations.add(item0Ref, Highlight({ color: "yellow" }));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      expect([...childAnnotations.entriesOfType(Comment)]).toHaveLength(1);
      expect([...childAnnotations.entriesOfType(Highlight)]).toHaveLength(1);
    });

    it("should support entriesOnRef", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment 0"));
      annotations.add(item1Ref, Comment("Comment 1"));

      const childAnnotations = annotations.onChildrenOf(itemsRef);
      const item0Entries = [...childAnnotations.entriesOnRef(item0Ref)];
      expect(item0Entries).toHaveLength(1);
      expect(item0Entries[0][1].value).toBe("Comment 0");
    });
  });

  describe("complex filtering scenarios", () => {
    it("should combine multiple query filters", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const Highlight = defineAnnotationType<{ color: string }>(
        "test/highlight"
      );
      const annotations = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      annotations.add(item0Ref, Comment("Comment 0"));
      annotations.add(item0Ref, Highlight({ color: "yellow" }));
      annotations.add(item1Ref, Comment("Comment 1"));

      // Get only comments on children of items
      const childComments = annotations.onChildrenOf(itemsRef).ofType(Comment);
      expect([...childComments]).toHaveLength(2);

      // Get annotations on specific item through filtered view
      const item0Annotations = annotations
        .onChildrenOf(itemsRef)
        .onRef(item0Ref);
      expect([...item0Annotations]).toHaveLength(2);
    });

    it("should work with nested sub-sources", () => {
      const Comment = defineAnnotationType<string>("test/comment");
      const parent = new AnnotationSet();
      const child = new AnnotationSet();
      const itemsRef = ref(handle, "items");
      const item0Ref = ref(handle, "items", 0);
      const item1Ref = ref(handle, "items", 1);

      parent.add(item0Ref, Comment("Parent comment"));
      child.add(item1Ref, Comment("Child comment"));
      parent.add(child);

      const childAnnotations = parent.onChildrenOf(itemsRef);
      expect([...childAnnotations]).toHaveLength(2);
    });
  });
});
