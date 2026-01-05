import { describe, it, expect } from "vitest";
import { defineAnnotationType } from "../src/annotation-type";

describe("defineAnnotationType", () => {
  it("should create an annotation type with a unique id", () => {
    const Comment = defineAnnotationType<string>("test/comment");

    expect(Comment.id).toBe("test/comment");
  });

  it("should create annotation values when called", () => {
    const Comment = defineAnnotationType<string>("test/comment");
    const annotation = Comment("Hello world");

    expect(annotation.type).toBe(Comment);
    expect(annotation.value).toBe("Hello world");
  });

  it("should allow multiple types with same id to be interoperable", () => {
    // This simulates two tools defining the same annotation type
    const CommentA = defineAnnotationType<string>("patchwork/comment");
    const CommentB = defineAnnotationType<string>("patchwork/comment");

    expect(CommentA.id).toBe(CommentB.id);
  });
});
