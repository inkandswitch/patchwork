import { describe, it, expect } from "vitest";
import { defineAnnotationType } from "../src/annotation-type";

describe("defineAnnotationType", () => {
  it("should create annotation values when called", () => {
    const Comment = defineAnnotationType<string>("patchwork/comment");
    const annotation = Comment("This is a comment");

    expect(annotation.type).toBe(Comment);
    expect(annotation.value).toBe("This is a comment");
  });

  it("should work with complex value types", () => {
    interface HighlightData {
      color: string;
      author: string;
    }

    const Highlight = defineAnnotationType<HighlightData>(
      "patchwork/highlight"
    );
    const annotation = Highlight({ color: "yellow", author: "Alice" });

    expect(annotation.type).toBe(Highlight);
    expect(annotation.value).toEqual({ color: "yellow", author: "Alice" });
  });

  it("should create distinct types for different calls", () => {
    const Comment = defineAnnotationType<string>("patchwork/comment");
    const Note = defineAnnotationType<string>("Note");

    expect(Comment).not.toBe(Note);
  });

  it("should preserve type identity across multiple calls", () => {
    const Comment = defineAnnotationType<string>("patchwork/comment");

    const annotation1 = Comment("First");
    const annotation2 = Comment("Second");

    expect(annotation1.type).toBe(annotation2.type);
    expect(annotation1.type).toBe(Comment);
  });
});
