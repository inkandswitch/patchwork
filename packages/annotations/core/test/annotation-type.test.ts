import { describe, it, expect, beforeEach } from "vitest";
import { Repo, type DocHandle } from "@automerge/automerge-repo";
import { Ref } from "@patchwork/refs";
import { defineAnnotationType, AnnotationSet } from "../src/index";

describe("AnnotationType", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
  });

  describe("defineAnnotationType", () => {
    it("should create a unique annotation type", () => {
      const Type1 = defineAnnotationType<string>();
      const Type2 = defineAnnotationType<string>();

      // Each type should be unique
      expect(Type1).not.toBe(Type2);
    });

    it("should create annotation values", () => {
      const Comment = defineAnnotationType<string>();
      const annotation = Comment("This is a comment");

      expect(annotation).toHaveProperty("type");
      expect(annotation).toHaveProperty("value");
      expect(annotation.value).toBe("This is a comment");
      expect(annotation.type).toBe(Comment);
    });

    it("should be type-safe", () => {
      type DiffType = { type: "added" } | { type: "deleted" };
      const Diff = defineAnnotationType<DiffType>();

      const added = Diff({ type: "added" });
      const deleted = Diff({ type: "deleted" });

      expect(added.value.type).toBe("added");
      expect(deleted.value.type).toBe("deleted");
    });

    it("should work with complex types", () => {
      interface CommentData {
        author: string;
        text: string;
        timestamp: number;
      }
      const Comment = defineAnnotationType<CommentData>();

      const comment = Comment({
        author: "Alice",
        text: "Great work!",
        timestamp: Date.now(),
      });

      expect(comment.value.author).toBe("Alice");
      expect(comment.value.text).toBe("Great work!");
      expect(typeof comment.value.timestamp).toBe("number");
    });

    it("should have a from method", () => {
      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();

      const getComment = Comment.from(annotations);
      expect(typeof getComment).toBe("function");
    });

    it("should use Type.from() for lookups", () => {
      handle.change((d) => {
        d.item = { value: 1 };
      });

      const Comment = defineAnnotationType<string>();
      const annotations = new AnnotationSet();
      const itemRef = new Ref(handle, ["item"]);

      annotations.add(itemRef, Comment("Test"));

      const getComment = Comment.from(annotations);
      expect(getComment(itemRef)).toBe("Test");
    });
  });
});
