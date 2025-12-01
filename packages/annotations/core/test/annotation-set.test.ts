import { describe, it, expect, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { Ref } from "@patchwork/refs";
import { defineAnnotationType, AnnotationSet } from "../src/index";

describe("AnnotationSet", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
  });

  describe("add and get", () => {
    it("should add and retrieve annotations", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1" }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();
      const todoRef = new Ref(handle, ["todos", 0]);

      annotations.add(todoRef, Comment("This is a comment"));

      const comment = annotations.get(Comment, todoRef);
      expect(comment).toBe("This is a comment");
    });

    it("should return undefined for non-existent annotations", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1" }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();
      const todoRef = new Ref(handle, ["todos", 0]);

      const comment = annotations.get(Comment, todoRef);
      expect(comment).toBeUndefined();
    });

    it("should replace existing annotations of the same type", () => {
      handle.change((d) => {
        d.item = { value: 42 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();
      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("First comment"));
      expect(annotations.get(Comment, itemRef)).toBe("First comment");

      // Replace with new comment
      annotations.add(itemRef, Comment("Second comment"));
      expect(annotations.get(Comment, itemRef)).toBe("Second comment");
    });

    it("should allow multiple annotation types on same ref", () => {
      handle.change((d) => {
        d.item = { value: 42 };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: "added" | "deleted" }>();
      const annotations = new AnnotationSet();
      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("A comment"));
      annotations.add(itemRef, Diff({ type: "added" }));

      expect(annotations.get(Comment, itemRef)).toBe("A comment");
      expect(annotations.get(Diff, itemRef)).toEqual({ type: "added" });
    });

    it("should work with Ref toString() for identity", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task" }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      // Create two separate refs pointing to the same location
      const ref1 = new Ref(handle, ["todos", 0]);
      const ref2 = new Ref(handle, ["todos", 0]);

      annotations.add(ref1, Comment("Comment"));

      // Should be retrievable with different ref instance
      expect(annotations.get(Comment, ref2)).toBe("Comment");
    });

    it("should handle refs to primitives", () => {
      handle.change((d) => {
        d.count = 42;
        d.message = "Hello";
        d.active = true;
      });

      const Note = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const countRef = new Ref(handle, ["count"]);
      const messageRef = new Ref(handle, ["message"]);
      const activeRef = new Ref(handle, ["active"]);

      annotations.add(countRef, Note("Number annotation"));
      annotations.add(messageRef, Note("String annotation"));
      annotations.add(activeRef, Note("Boolean annotation"));

      expect(annotations.get(Note, countRef)).toBe("Number annotation");
      expect(annotations.get(Note, messageRef)).toBe("String annotation");
      expect(annotations.get(Note, activeRef)).toBe("Boolean annotation");
    });

    it("should work with text ranges", () => {
      handle.change((d) => {
        d.document = "This is a sample document for testing.";
      });

      const Highlight = defineAnnotationType<{ color: string }>();
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const range1 = new Ref(handle, ["document", [0, 4]]);
      const range2 = new Ref(handle, ["document", [10, 16]]);

      annotations.add(range1, Highlight({ color: "yellow" }));
      annotations.add(range2, Comment("Needs revision"));

      expect(annotations.get(Highlight, range1)).toEqual({ color: "yellow" });
      expect(annotations.get(Comment, range2)).toBe("Needs revision");
    });
  });

  describe("merge", () => {
    it("should merge two annotation sets", () => {
      handle.change((d) => {
        d.item1 = { value: 1 };
        d.item2 = { value: 2 };
      });

      const Comment = defineAnnotationType<string>();
      const set1 = new AnnotationSet();
      const set2 = new AnnotationSet();

      const ref1 = new Ref(handle, ["item1"]);
      const ref2 = new Ref(handle, ["item2"]);

      set1.add(ref1, Comment("Comment 1"));
      set2.add(ref2, Comment("Comment 2"));

      const merged = set1.merge(set2);

      expect(merged.get(Comment, ref1)).toBe("Comment 1");
      expect(merged.get(Comment, ref2)).toBe("Comment 2");
    });

    it("should give precedence to 'other' set in merge conflicts", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const set1 = new AnnotationSet();
      const set2 = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      set1.add(itemRef, Comment("From set1"));
      set2.add(itemRef, Comment("From set2"));

      const merged = set1.merge(set2);

      // set2's annotation should win
      expect(merged.get(Comment, itemRef)).toBe("From set2");
    });

    it("should not modify original sets", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const set1 = new AnnotationSet();
      const set2 = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      set1.add(itemRef, Comment("Original"));
      set2.add(itemRef, Comment("Override"));

      const merged = set1.merge(set2);

      // Original sets should be unchanged
      expect(set1.get(Comment, itemRef)).toBe("Original");
      expect(set2.get(Comment, itemRef)).toBe("Override");
      expect(merged.get(Comment, itemRef)).toBe("Override");
    });

    it("should merge different annotation types", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const set1 = new AnnotationSet();
      const set2 = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      set1.add(itemRef, Comment("Comment"));
      set2.add(itemRef, Diff({ type: "added" }));

      const merged = set1.merge(set2);

      expect(merged.get(Comment, itemRef)).toBe("Comment");
      expect(merged.get(Diff, itemRef)).toEqual({ type: "added" });
    });

    it("should handle empty sets", () => {
      const set1 = new AnnotationSet();
      const set2 = new AnnotationSet();

      const merged = set1.merge(set2);

      // Should not throw and should be empty
      expect(merged).toBeDefined();
    });
  });

  describe("ofType", () => {
    it("should filter annotations by type", () => {
      handle.change((d) => {
        d.todos = [
          { title: "Task 1" },
          { title: "Task 2" },
          { title: "Task 3" },
        ];
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const annotations = new AnnotationSet();

      const ref1 = new Ref(handle, ["todos", 0]);
      const ref2 = new Ref(handle, ["todos", 1]);
      const ref3 = new Ref(handle, ["todos", 2]);

      annotations.add(ref1, Comment("Comment 1"));
      annotations.add(ref2, Diff({ type: "added" }));
      annotations.add(ref3, Comment("Comment 3"));

      const comments = [...annotations.ofType(Comment)];

      expect(comments).toHaveLength(2);
      expect(comments[0][1]).toBe("Comment 1");
      expect(comments[1][1]).toBe("Comment 3");
    });

    it("should return empty view for non-existent type", () => {
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const comments = [...annotations.ofType(Comment)];
      expect(comments).toHaveLength(0);
    });

    it("should be iterable", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref1 = new Ref(handle, ["items", 0]);
      const ref2 = new Ref(handle, ["items", 1]);

      annotations.add(ref1, Comment("First"));
      annotations.add(ref2, Comment("Second"));

      const view = annotations.ofType(Comment);
      const results: Array<[Ref<any>, string]> = [];

      for (const [ref, value] of view) {
        results.push([ref, value]);
      }

      expect(results).toHaveLength(2);
      expect(results[0][1]).toBe("First");
      expect(results[1][1]).toBe("Second");
    });

    it("should convert to array", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref1 = new Ref(handle, ["items", 0]);
      const ref2 = new Ref(handle, ["items", 1]);

      annotations.add(ref1, Comment("First"));
      annotations.add(ref2, Comment("Second"));

      const array = annotations.ofType(Comment).toArray();

      expect(array).toHaveLength(2);
      expect(array[0][0]).toBeInstanceOf(Ref);
      expect(array[0][1]).toBe("First");
    });
  });

  describe("on", () => {
    it("should filter annotations on a specific ref", () => {
      handle.change((d) => {
        d.item1 = { value: 1 };
        d.item2 = { value: 2 };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const annotations = new AnnotationSet();

      const ref1 = new Ref(handle, ["item1"]);
      const ref2 = new Ref(handle, ["item2"]);

      annotations.add(ref1, Comment("Comment on item1"));
      annotations.add(ref1, Diff({ type: "added" }));
      annotations.add(ref2, Comment("Comment on item2"));

      const item1Annotations = [...annotations.on(ref1)];

      expect(item1Annotations).toHaveLength(2);
    });

    it("should return empty view if ref has no annotations", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const annotations = new AnnotationSet();
      const ref = new Ref(handle, ["item"]);

      const results = [...annotations.on(ref)];
      expect(results).toHaveLength(0);
    });
  });

  describe("onChildrenOf", () => {
    it("should find annotations on direct children of an array", () => {
      handle.change((d) => {
        d.todos = [
          { title: "Task 1" },
          { title: "Task 2" },
          { title: "Task 3" },
        ];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const todosRef = new Ref(handle, ["todos"]);
      const todo0Ref = new Ref(handle, ["todos", 0]);
      const todo1Ref = new Ref(handle, ["todos", 1]);

      annotations.add(todo0Ref, Comment("Comment on task 1"));
      annotations.add(todo1Ref, Comment("Comment on task 2"));

      const elements = [...annotations.onChildrenOf(todosRef)];

      expect(elements).toHaveLength(2);
    });

    it("should not include annotations on grandchildren", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1", subtasks: [{ name: "Subtask" }] }];
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const todosRef = new Ref(handle, ["todos"]);
      const todoRef = new Ref(handle, ["todos", 0]);
      const subtaskRef = new Ref(handle, ["todos", 0, "subtasks", 0]);

      annotations.add(todoRef, Comment("On todo"));
      annotations.add(subtaskRef, Comment("On subtask"));

      const elements = [...annotations.onChildrenOf(todosRef)];

      // Should only include direct child (todoRef)
      expect(elements).toHaveLength(1);
      expect(elements[0][1]).toBe("On todo");
    });

    it("should return empty view if no element annotations exist", () => {
      handle.change((d) => {
        d.todos = [{ title: "Task 1" }];
      });

      const annotations = new AnnotationSet();
      const todosRef = new Ref(handle, ["todos"]);

      const elements = [...annotations.onChildrenOf(todosRef)];
      expect(elements).toHaveLength(0);
    });
  });

  describe("onPartOf", () => {
    it("should find annotations anywhere in subtree", () => {
      handle.change((d) => {
        d.user = {
          profile: {
            name: "Alice",
            email: "alice@example.com",
          },
        };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const userRef = new Ref(handle, ["user"]);
      const profileRef = new Ref(handle, ["user", "profile"]);
      const nameRef = new Ref(handle, ["user", "profile", "name"]);

      annotations.add(profileRef, Comment("On profile"));
      annotations.add(nameRef, Comment("On name"));

      const subtree = [...annotations.onPartOf(userRef)];

      expect(subtree).toHaveLength(2);
    });

    it("should include annotation on the ref itself", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("On item"));

      const subtree = [...annotations.onPartOf(itemRef)];

      expect(subtree).toHaveLength(1);
      expect(subtree[0][1]).toBe("On item");
    });

    it("should not include annotations outside subtree", () => {
      handle.change((d) => {
        d.item1 = { value: 1 };
        d.item2 = { value: 2 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const item1Ref = new Ref(handle, ["item1"]);
      const item2Ref = new Ref(handle, ["item2"]);

      annotations.add(item1Ref, Comment("On item1"));
      annotations.add(item2Ref, Comment("On item2"));

      const subtree = [...annotations.onPartOf(item1Ref)];

      expect(subtree).toHaveLength(1);
      expect(subtree[0][1]).toBe("On item1");
    });

    it("should work with nested arrays", () => {
      handle.change((d) => {
        d.data = {
          items: [
            { id: 1, subitems: [{ value: "a" }, { value: "b" }] },
            { id: 2, subitems: [{ value: "c" }] },
          ],
        };
      });

      const Tag = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const dataRef = new Ref(handle, ["data"]);
      const item0Ref = new Ref(handle, ["data", "items", 0]);
      const subitem0Ref = new Ref(handle, ["data", "items", 0, "subitems", 0]);

      annotations.add(item0Ref, Tag("item"));
      annotations.add(subitem0Ref, Tag("subitem"));

      const subtree = [...annotations.onPartOf(dataRef)];

      expect(subtree).toHaveLength(2);
    });
  });

  describe("iteration", () => {
    it("should iterate over all annotations", () => {
      handle.change((d) => {
        d.item1 = { value: 1 };
        d.item2 = { value: 2 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const ref1 = new Ref(handle, ["item1"]);
      const ref2 = new Ref(handle, ["item2"]);

      annotations.add(ref1, Comment("Comment 1"));
      annotations.add(ref2, Comment("Comment 2"));

      const results: Array<[Ref<any>, unknown]> = [];
      for (const [ref, value] of annotations) {
        results.push([ref, value]);
      }

      expect(results).toHaveLength(2);
    });

    it("should work with for...of loop", () => {
      handle.change((d) => {
        d.items = [{ value: 1 }, { value: 2 }, { value: 3 }];
      });

      const Tag = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      for (let i = 0; i < 3; i++) {
        const ref = new Ref(handle, ["items", i]);
        annotations.add(ref, Tag(`tag-${i}`));
      }

      const tags: string[] = [];
      for (const [, value] of annotations) {
        tags.push(value as string);
      }

      expect(tags).toHaveLength(3);
      expect(tags).toContain("tag-0");
      expect(tags).toContain("tag-1");
      expect(tags).toContain("tag-2");
    });

    it("should handle multiple annotation types during iteration", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const Diff = defineAnnotationType<{ type: string }>();
      const Priority = defineAnnotationType<number>();
      const annotations = new AnnotationSet();

      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("A comment"));
      annotations.add(itemRef, Diff({ type: "added" }));
      annotations.add(itemRef, Priority(5));

      const results: unknown[] = [];
      for (const [, value] of annotations) {
        results.push(value);
      }

      expect(results).toHaveLength(3);
      expect(results).toContainEqual("A comment");
      expect(results).toContainEqual({ type: "added" });
      expect(results).toContainEqual(5);
    });
  });

  describe("edge cases", () => {
    it("should handle refs that resolve to undefined", () => {
      handle.change((d) => {
        d.data = {};
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      // Ref to non-existent path
      const missingRef = new Ref(handle, ["data", "missing", "path"]);

      // Should still be able to add annotation
      annotations.add(missingRef, Comment("Comment on missing"));
      expect(annotations.get(Comment, missingRef)).toBe("Comment on missing");
    });

    it("should handle root document ref", () => {
      handle.change((d) => {
        d.title = "Root Document";
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const rootRef = new Ref(handle, []);

      annotations.add(rootRef, Comment("Root comment"));
      expect(annotations.get(Comment, rootRef)).toBe("Root comment");
    });

    it("should handle duplicate adds gracefully", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();
      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("First"));
      annotations.add(itemRef, Comment("Second"));
      annotations.add(itemRef, Comment("Third"));

      // Should only keep the last one
      expect(annotations.get(Comment, itemRef)).toBe("Third");

      const all = [...annotations.ofType(Comment)];
      expect(all).toHaveLength(1);
    });

    it("should handle empty annotation sets", () => {
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const results = [...annotations];
      expect(results).toHaveLength(0);

      const comments = [...annotations.ofType(Comment)];
      expect(comments).toHaveLength(0);
    });

    it("should handle annotations across different refs", () => {
      handle.change((d) => {
        d.doc = {
          title: "Document",
          sections: [
            { name: "Intro", content: "..." },
            { name: "Body", content: "..." },
          ],
        };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const titleRef = new Ref(handle, ["doc", "title"]);
      const section0Ref = new Ref(handle, ["doc", "sections", 0]);
      const section1Ref = new Ref(handle, ["doc", "sections", 1]);

      annotations.add(titleRef, Comment("Title comment"));
      annotations.add(section0Ref, Comment("Intro comment"));
      annotations.add(section1Ref, Comment("Body comment"));

      expect(annotations.get(Comment, titleRef)).toBe("Title comment");
      expect(annotations.get(Comment, section0Ref)).toBe("Intro comment");
      expect(annotations.get(Comment, section1Ref)).toBe("Body comment");
    });
  });

  describe("real-world scenarios", () => {
    it("should handle diff annotations on document changes", () => {
      handle.change((d) => {
        d.todos = [
          { id: "1", title: "Task 1", done: false },
          { id: "2", title: "Task 2", done: true },
        ];
      });

      type DiffType =
        | { type: "added" }
        | { type: "deleted" }
        | { type: "modified"; field: string };

      const Diff = defineAnnotationType<DiffType>();
      const annotations = new AnnotationSet();

      const todo1Ref = new Ref(handle, ["todos", 0]);
      const todo2Ref = new Ref(handle, ["todos", 1]);

      annotations.add(todo1Ref, Diff({ type: "added" }));
      annotations.add(todo2Ref, Diff({ type: "modified", field: "done" }));

      const todosRef = new Ref(handle, ["todos"]);
      const diffs = [...annotations.ofType(Diff).onChildrenOf(todosRef)];

      expect(diffs).toHaveLength(2);
    });

    it("should handle comment threads on document sections", () => {
      handle.change((d) => {
        d.document = {
          sections: [
            { id: "intro", text: "Introduction text" },
            { id: "body", text: "Main content" },
          ],
        };
      });

      interface CommentThread {
        author: string;
        comments: string[];
        resolved: boolean;
      }

      const Thread = defineAnnotationType<CommentThread>();
      const annotations = new AnnotationSet();

      const introRef = new Ref(handle, ["document", "sections", 0]);
      const bodyRef = new Ref(handle, ["document", "sections", 1]);

      annotations.add(
        introRef,
        Thread({
          author: "Alice",
          comments: ["Needs more detail"],
          resolved: false,
        })
      );

      annotations.add(
        bodyRef,
        Thread({
          author: "Bob",
          comments: ["Great section!", "Added some notes"],
          resolved: true,
        })
      );

      const docRef = new Ref(handle, ["document"]);
      const allThreads = [...annotations.ofType(Thread).onPartOf(docRef)];

      expect(allThreads).toHaveLength(2);
      expect(allThreads[0][1].resolved).toBe(false);
      expect(allThreads[1][1].resolved).toBe(true);
    });

    it("should support multiple annotation systems", () => {
      handle.change((d) => {
        d.code = "function hello() { return 'world'; }";
      });

      const Highlight = defineAnnotationType<{ color: string }>();
      const Comment = defineAnnotationType<string>();
      const Lint = defineAnnotationType<{
        severity: string;
        message: string;
      }>();

      const annotations = new AnnotationSet();

      const range1 = new Ref(handle, ["code", [9, 14]]);
      const range2 = new Ref(handle, ["code", [27, 34]]);

      annotations.add(range1, Highlight({ color: "blue" }));
      annotations.add(range1, Comment("Function name"));

      annotations.add(range2, Highlight({ color: "green" }));
      annotations.add(
        range2,
        Lint({
          severity: "warning",
          message: "String should use double quotes",
        })
      );

      expect(annotations.get(Highlight, range1)).toEqual({ color: "blue" });
      expect(annotations.get(Comment, range1)).toBe("Function name");
      expect(annotations.get(Lint, range2)).toBeDefined();
    });

    it("should merge annotation sets from different sources", () => {
      handle.change((d) => {
        d.doc = { title: "Collaborative Document" };
      });

      const Comment = defineAnnotationType<string>();

      // User A's annotations
      const userAAnnotations = new AnnotationSet();
      const titleRef = new Ref(handle, ["doc", "title"]);
      userAAnnotations.add(titleRef, Comment("User A: Great title!"));

      // User B's annotations
      const userBAnnotations = new AnnotationSet();
      userBAnnotations.add(titleRef, Comment("User B: Needs revision"));

      // Merge - User B's comment wins
      const merged = userAAnnotations.merge(userBAnnotations);
      expect(merged.get(Comment, titleRef)).toBe("User B: Needs revision");

      // Original sets unchanged
      expect(userAAnnotations.get(Comment, titleRef)).toBe(
        "User A: Great title!"
      );
      expect(userBAnnotations.get(Comment, titleRef)).toBe(
        "User B: Needs revision"
      );
    });
  });
});
