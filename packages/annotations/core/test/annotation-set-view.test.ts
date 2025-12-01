import { describe, it, expect, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { Ref } from "@patchwork/refs";
import { defineAnnotationType, AnnotationSet } from "../src/index";

describe("AnnotationSetView", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
  });

  describe("chaining filters", () => {
    it("should chain ofType and on", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const annotations = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("A comment"));
      annotations.add(itemRef, Diff({ type: "added" }));

      const result = [...annotations.ofType(Comment).on(itemRef)];

      expect(result).toHaveLength(1);
      expect(result[0][1]).toBe("A comment");
    });

    it("should chain ofType and onChildrenOf", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1" }, { title: "Task 2" }];
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const annotations = new AnnotationSet();

      const todosRef = new Ref(handle, ["todos"]);
      const todo0Ref = new Ref(handle, ["todos", 0]);
      const todo1Ref = new Ref(handle, ["todos", 1]);

      annotations.add(todo0Ref, Comment("Comment on task 1"));
      annotations.add(todo1Ref, Diff({ type: "added" }));

      const comments = [...annotations.ofType(Comment).onChildrenOf(todosRef)];

      expect(comments).toHaveLength(1);
      expect(comments[0][1]).toBe("Comment on task 1");
    });

    it("should chain ofType and onPartOf", () => {
      handle.change((d) => {
        d.user = {
          profile: { name: "Alice" },
        };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const annotations = new AnnotationSet();

      const userRef = new Ref(handle, ["user"]);
      const profileRef = new Ref(handle, ["user", "profile"]);
      const nameRef = new Ref(handle, ["user", "profile", "name"]);

      annotations.add(profileRef, Comment("Profile comment"));
      annotations.add(nameRef, Diff({ type: "modified" }));

      const comments = [...annotations.ofType(Comment).onPartOf(userRef)];

      expect(comments).toHaveLength(1);
      expect(comments[0][1]).toBe("Profile comment");
    });

    it("should chain multiple filters together", () => {
      handle.change((d) => {
        d.sections = [
          { title: "Section 1", items: [{ value: "A" }, { value: "B" }] },
          { title: "Section 2", items: [{ value: "C" }] },
        ];
      });

      const Tag = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const sectionsRef = new Ref(handle, ["sections"]);
      const section0Ref = new Ref(handle, ["sections", 0]);
      const item0Ref = new Ref(handle, ["sections", 0, "items", 0]);

      annotations.add(section0Ref, Tag("section-tag"));
      annotations.add(item0Ref, Tag("item-tag"));

      // Get all tags in sections subtree
      const allTags = [...annotations.ofType(Tag).onPartOf(sectionsRef)];
      expect(allTags).toHaveLength(2);

      // Get only tags on direct section elements
      const sectionTags = [
        ...annotations.ofType(Tag).onChildrenOf(sectionsRef),
      ];
      expect(sectionTags).toHaveLength(1);
      expect(sectionTags[0][1]).toBe("section-tag");
    });

    it("should allow chaining on view results", () => {
      handle.change((d) => {
        d.doc = {
          sections: [
            { id: "intro", paragraphs: [{ text: "P1" }, { text: "P2" }] },
            { id: "body", paragraphs: [{ text: "P3" }] },
          ],
        };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const docRef = new Ref(handle, ["doc"]);
      const sectionsRef = new Ref(handle, ["doc", "sections"]);
      const section0Ref = new Ref(handle, ["doc", "sections", 0]);
      const para0Ref = new Ref(handle, ["doc", "sections", 0, "paragraphs", 0]);

      annotations.add(section0Ref, Comment("Section comment"));
      annotations.add(para0Ref, Comment("Paragraph comment"));

      // Get all comments in doc, then filter to sections subtree
      const comments = [...annotations.ofType(Comment).onPartOf(sectionsRef)];

      expect(comments).toHaveLength(2);
    });
  });

  describe("toArray", () => {
    it("should convert view to array", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }, { value: 3 }];
      });

      const Tag = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref0 = new Ref(handle, ["items", 0]);
      const ref1 = new Ref(handle, ["items", 1]);
      const ref2 = new Ref(handle, ["items", 2]);

      annotations.add(ref0, Tag("tag-0"));
      annotations.add(ref1, Tag("tag-1"));
      annotations.add(ref2, Tag("tag-2"));

      const array = annotations.ofType(Tag).toArray();

      expect(array).toHaveLength(3);
      expect(array[0][0]).toBeInstanceOf(Ref);
      expect(array[0][1]).toBe("tag-0");
      expect(array[1][1]).toBe("tag-1");
      expect(array[2][1]).toBe("tag-2");
    });

    it("should convert filtered view to array", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1" }, { title: "Task 2" }];
      });

      const Comment = defineAnnotationType<string>();
      const Priority = defineAnnotationType<number>();
      const annotations = new AnnotationSet();

      const todosRef = new Ref(handle, ["todos"]);
      const todo0Ref = new Ref(handle, ["todos", 0]);
      const todo1Ref = new Ref(handle, ["todos", 1]);

      annotations.add(todo0Ref, Comment("Comment 1"));
      annotations.add(todo0Ref, Priority(5));
      annotations.add(todo1Ref, Comment("Comment 2"));

      const comments = annotations
        .ofType(Comment)
        .onChildrenOf(todosRef)
        .toArray();

      expect(comments).toHaveLength(2);
      expect(comments[0][1]).toBe("Comment 1");
      expect(comments[1][1]).toBe("Comment 2");
    });

    it("should return empty array for empty view", () => {
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const array = annotations.ofType(Comment).toArray();
      expect(array).toEqual([]);
    });
  });

  describe("iteration", () => {
    it("should iterate over filtered results", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }, { value: 3 }];
      });

      const Tag = defineAnnotationType<string>();
      const Label = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref0 = new Ref(handle, ["items", 0]);
      const ref1 = new Ref(handle, ["items", 1]);
      const ref2 = new Ref(handle, ["items", 2]);

      annotations.add(ref0, Tag("tag-0"));
      annotations.add(ref1, Label("label-1"));
      annotations.add(ref2, Tag("tag-2"));

      const tags: string[] = [];
      for (const [, value] of annotations.ofType(Tag)) {
        tags.push(value);
      }

      expect(tags).toHaveLength(2);
      expect(tags).toContain("tag-0");
      expect(tags).toContain("tag-2");
      expect(tags).not.toContain("label-1");
    });

    it("should iterate over chained filter results", () => {
      handle.change((d) => {
        d.doc = {
          sections: [
            { title: "Intro" },
            { title: "Body" },
            { title: "Conclusion" },
          ],
        };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const docRef = new Ref(handle, ["doc"]);
      const sectionsRef = new Ref(handle, ["doc", "sections"]);
      const section0Ref = new Ref(handle, ["doc", "sections", 0]);
      const section1Ref = new Ref(handle, ["doc", "sections", 1]);

      annotations.add(docRef, Comment("Doc comment"));
      annotations.add(section0Ref, Comment("Intro comment"));
      annotations.add(section1Ref, Comment("Body comment"));

      const sectionComments: string[] = [];
      for (const [, value] of annotations
        .ofType(Comment)
        .onChildrenOf(sectionsRef)) {
        sectionComments.push(value);
      }

      expect(sectionComments).toHaveLength(2);
      expect(sectionComments).toContain("Intro comment");
      expect(sectionComments).toContain("Body comment");
      expect(sectionComments).not.toContain("Doc comment");
    });

    it("should support destructuring in for...of loops", () => {
      handle.change((d) => {
        d.items = [{ id: "a" }, { id: "b" }];
      });

      const Note = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref0 = new Ref(handle, ["items", 0]);
      const ref1 = new Ref(handle, ["items", 1]);

      annotations.add(ref0, Note("Note A"));
      annotations.add(ref1, Note("Note B"));

      const pairs: Array<[Ref<any>, string]> = [];
      for (const [ref, note] of annotations.ofType(Note)) {
        pairs.push([ref, note]);
      }

      expect(pairs).toHaveLength(2);
      expect(pairs[0][0]).toBeInstanceOf(Ref);
      expect(pairs[0][1]).toBe("Note A");
    });
  });

  describe("edge cases", () => {
    it("should handle empty views", () => {
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const view = annotations.ofType(Comment);
      const results = [...view];

      expect(results).toHaveLength(0);
    });

    it("should handle filtering with no matches", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const nonExistentRef = new Ref(handle, ["items", 999]);
      const filtered = [...annotations.ofType(Comment).on(nonExistentRef)];

      expect(filtered).toHaveLength(0);
    });

    it("should handle multiple filter chains with no results", () => {
      handle.change((d) => {
        d.doc = { title: "Test" };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const titleRef = new Ref(handle, ["doc", "title"]);
      annotations.add(titleRef, Comment("Title comment"));

      // Try to filter by a different type that doesn't exist
      const Tag = defineAnnotationType<string>();
      const docRef = new Ref(handle, ["doc"]);
      const results = [...annotations.ofType(Tag).onPartOf(docRef)];

      expect(results).toHaveLength(0);
    });
  });
});
