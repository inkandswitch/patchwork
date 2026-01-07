import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { ref } from "@inkandswitch/patchwork-refs";
import { AnnotationSet } from "../../core/src/annotation-set";
import { defineAnnotationType } from "../../core/src/annotation-type";

// We need to test the module in isolation, so we'll manually manage window state

describe("annotations context", () => {
  // Store original window.annotationContext
  let originalAnnotationContext: any;

  beforeEach(() => {
    // Save original state
    originalAnnotationContext = (window as any).annotationContext;
    // Clear it for fresh tests
    delete (window as any).annotationContext;
  });

  afterEach(() => {
    // Restore original state
    if (originalAnnotationContext) {
      (window as any).annotationContext = originalAnnotationContext;
    } else {
      delete (window as any).annotationContext;
    }
    // Clear module cache to re-import fresh
    vi.resetModules();
  });

  describe("initialization", () => {
    it("should create a new AnnotationSet if window.annotationContext does not exist", async () => {
      // Ensure window.annotationContext is not set
      expect((window as any).annotationContext).toBeUndefined();

      // Import the module
      const { annotations } = await import("../src/index");

      expect(annotations).toBeDefined();
      expect((window as any).annotationContext).toBe(annotations);
    });

    it("should reuse existing window.annotationContext if it exists", async () => {
      // Set up an existing annotation context
      const existingContext = new AnnotationSet();
      (window as any).annotationContext = existingContext;

      // Import the module
      const { annotations } = await import("../src/index");

      expect(annotations).toBe(existingContext);
    });

    it("should share the same context across multiple imports", async () => {
      // First import
      const module1 = await import("../src/index");

      // Simulate another import (would be the same in practice due to module caching)
      const module2 = await import("../src/index");

      expect(module1.annotations).toBe(module2.annotations);
      expect(module1.annotations).toBe((window as any).annotationContext);
    });
  });

  describe("AnnotationContext interface", () => {
    let annotations: Awaited<typeof import("../src/index")>["annotations"];
    let repo: Repo;
    let handle: DocHandle<any>;

    beforeEach(async () => {
      delete (window as any).annotationContext;
      vi.resetModules();
      const module = await import("../src/index");
      annotations = module.annotations;

      repo = new Repo();
      handle = repo.create();
      handle.change((d: any) => {
        d.title = "Test Document";
        d.items = [{ name: "Item 1" }, { name: "Item 2" }];
      });
    });

    describe("add (source)", () => {
      it("should add an AnnotationSource to the context", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));

        annotations.add(source);

        // Verify annotation is accessible through context
        const allAnnotations = [...annotations];
        expect(allAnnotations).toHaveLength(1);
        expect(allAnnotations[0][1].value).toBe("A comment");
      });

      it("should forward events from added sources", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const changeHandler = vi.fn();

        const source = new AnnotationSet();
        annotations.add(source);
        annotations.on("change", changeHandler);

        source.add(titleRef, Comment("New comment"));

        expect(changeHandler).toHaveBeenCalled();
        const change = changeHandler.mock.calls[0][0];
        expect(change.added).toHaveLength(1);
      });
    });

    describe("remove (source)", () => {
      it("should remove an AnnotationSource from the context", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));
        annotations.add(source);

        expect([...annotations]).toHaveLength(1);

        annotations.remove(source);

        expect([...annotations]).toHaveLength(0);
      });

      it("should stop forwarding events after source is removed", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const changeHandler = vi.fn();

        const source = new AnnotationSet();
        annotations.add(source);
        annotations.remove(source);
        annotations.on("change", changeHandler);

        source.add(titleRef, Comment("Should not appear"));

        expect(changeHandler).not.toHaveBeenCalled();
      });
    });

    describe("query methods (inherited from AnnotationSet)", () => {
      it("should support ofType queries", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const Highlight = defineAnnotationType<{ color: string }>(
          "test/highlight"
        );
        const titleRef = ref(handle, "title");

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));
        source.add(titleRef, Highlight({ color: "yellow" }));
        annotations.add(source);

        const comments = annotations.ofType(Comment);
        expect([...comments]).toHaveLength(1);
      });

      it("should support onRef queries", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        const source = new AnnotationSet();
        source.add(titleRef, Comment("Title comment"));
        source.add(itemRef, Comment("Item comment"));
        annotations.add(source);

        const titleAnnotations = annotations.onRef(titleRef);
        expect([...titleAnnotations]).toHaveLength(1);
      });

      it("should support lookup", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));
        annotations.add(source);

        const value = annotations.lookup(titleRef, Comment);
        expect(value).toBe("A comment");
      });

      it("should support lookupAll", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");

        const source = new AnnotationSet();
        source.add(titleRef, Comment("First"));
        source.add(titleRef, Comment("Second"));
        annotations.add(source);

        const values = annotations.lookupAll(titleRef, Comment);
        expect(values).toHaveLength(2);
        expect(values).toContain("First");
        expect(values).toContain("Second");
      });
    });

    describe("iteration", () => {
      it("should iterate over all annotations from all sources", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        const source1 = new AnnotationSet();
        source1.add(titleRef, Comment("Source 1 comment"));

        const source2 = new AnnotationSet();
        source2.add(itemRef, Comment("Source 2 comment"));

        annotations.add(source1);
        annotations.add(source2);

        const allAnnotations = [...annotations];
        expect(allAnnotations).toHaveLength(2);
      });

      it("should iterate over refs from all sources", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const itemRef = ref(handle, "items", 0);

        const source1 = new AnnotationSet();
        source1.add(titleRef, Comment("Source 1 comment"));

        const source2 = new AnnotationSet();
        source2.add(itemRef, Comment("Source 2 comment"));

        annotations.add(source1);
        annotations.add(source2);

        const refs = [...annotations.refs];
        expect(refs).toHaveLength(2);
      });
    });

    describe("subscription", () => {
      it("should support subscribing to changes", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const subscriber = vi.fn();

        annotations.subscribe(subscriber);

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));
        annotations.add(source);

        expect(subscriber).toHaveBeenCalled();
      });

      it("should support unsubscribing from changes", () => {
        const Comment = defineAnnotationType<string>("test/comment");
        const titleRef = ref(handle, "title");
        const subscriber = vi.fn();

        const unsubscribe = annotations.subscribe(subscriber);
        unsubscribe();

        const source = new AnnotationSet();
        source.add(titleRef, Comment("A comment"));
        annotations.add(source);

        expect(subscriber).not.toHaveBeenCalled();
      });
    });
  });

  describe("multiple tools scenario", () => {
    it("should allow multiple tools to share the same context", async () => {
      const Comment = defineAnnotationType<string>("test/comment");

      // Simulate Tool A
      delete (window as any).annotationContext;
      vi.resetModules();

      const repo = new Repo();
      const handle = repo.create();
      handle.change((d: any) => {
        d.content = "Document content";
      });
      const contentRef = ref(handle, "content");

      // Tool A imports and adds annotations
      const moduleA = await import("../src/index");
      const toolASource = new AnnotationSet();
      toolASource.add(contentRef, Comment("Tool A comment"));
      moduleA.annotations.add(toolASource);

      // Tool B imports (simulated - same module in practice)
      const moduleB = await import("../src/index");
      const toolBSource = new AnnotationSet();
      toolBSource.add(contentRef, Comment("Tool B comment"));
      moduleB.annotations.add(toolBSource);

      // Both tools share the same context
      expect(moduleA.annotations).toBe(moduleB.annotations);

      // Both tools' annotations are visible
      const allAnnotations = [...moduleA.annotations];
      expect(allAnnotations).toHaveLength(2);
    });
  });
});
