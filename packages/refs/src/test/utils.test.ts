import { describe, it, expect, beforeEach } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import { isCursor, at, isDynamic } from "../utils";
import { ref } from "../ref";

describe("utils", () => {
  describe("isCursor", () => {
    it("should return true for valid cursor strings", () => {
      expect(isCursor("2@fe74e7d3d9d2f00bf7096f6a1eb64afb")).toBe(true);
      expect(isCursor("0@abc123def456")).toBe(true);
      expect(isCursor("123@deadbeef00112233")).toBe(true);
    });

    it("should return false for invalid formats", () => {
      expect(isCursor("not-a-cursor")).toBe(false);
      expect(isCursor("@abc123")).toBe(false); // missing number
      expect(isCursor("123@")).toBe(false); // missing hash
      expect(isCursor("abc@123")).toBe(false); // starts with letters
      expect(isCursor("123")).toBe(false); // no @ symbol
      expect(isCursor("")).toBe(false);
    });

    it("should return false for non-strings", () => {
      expect(isCursor(123)).toBe(false);
      expect(isCursor(null)).toBe(false);
      expect(isCursor(undefined)).toBe(false);
      expect(isCursor({})).toBe(false);
      expect(isCursor([])).toBe(false);
    });

    it("should reject cursors with special characters", () => {
      expect(isCursor("2@abc-def")).toBe(false); // hyphen not allowed
      expect(isCursor("2@abc def")).toBe(false); // space not allowed
      expect(isCursor("2@abc_def")).toBe(false); // underscore not allowed
    });
  });

  describe("at", () => {
    it("should wrap a value in a dynamic segment", () => {
      const dynamic = at(0);
      expect(dynamic).toEqual({ __dynamic: true, value: 0 });
    });

    it("should work with numbers", () => {
      const dynamic = at(5);
      expect(dynamic.__dynamic).toBe(true);
      expect(dynamic.value).toBe(5);
    });

    it("should work with objects", () => {
      const whereClause = { id: "abc" };
      const dynamic = at(whereClause);
      expect(dynamic.__dynamic).toBe(true);
      expect(dynamic.value).toEqual(whereClause);
    });

    it("should work with arrays", () => {
      const range = [0, 10];
      const dynamic = at(range);
      expect(dynamic.__dynamic).toBe(true);
      expect(dynamic.value).toEqual(range);
    });
  });

  describe("isDynamic", () => {
    it("should return true for dynamic segments", () => {
      const dynamic = at(0);
      expect(isDynamic(dynamic)).toBe(true);
    });

    it("should return false for regular values", () => {
      expect(isDynamic(0)).toBe(false);
      expect(isDynamic("string")).toBe(false);
      expect(isDynamic({ id: "abc" })).toBe(false);
      expect(isDynamic([0, 10])).toBe(false);
    });

    it("should return false for objects without __dynamic", () => {
      expect(isDynamic({ value: 0 })).toBe(false);
      expect(isDynamic({ __dynamic: false, value: 0 })).toBe(false);
    });

    it("should return false for null and undefined", () => {
      expect(isDynamic(null)).toBe(false);
      expect(isDynamic(undefined)).toBe(false);
    });

    it("should return false for primitives", () => {
      expect(isDynamic(true)).toBe(false);
      expect(isDynamic(false)).toBe(false);
      expect(isDynamic(123)).toBe(false);
    });
  });

  describe("ref", () => {
    let repo: Repo;
    let handle: DocHandle<any>;

    beforeEach(() => {
      repo = new Repo();
      handle = repo.create();
    });

    it("should create a ref with variadic arguments", () => {
      handle.change((d) => {
        d.user = { name: "Alice" };
      });

      const nameRef = ref(handle, "user", "name");
      expect(nameRef.value()).toBe("Alice");
    });

    it("should work with numeric indices", () => {
      handle.change((d) => {
        d.items = ["a", "b", "c"];
      });

      const itemRef = ref(handle, "items", 1);
      expect(itemRef.value()).toBe("b");
    });

    it("should work with where clauses", () => {
      handle.change((d) => {
        d.todos = [
          { id: "a", title: "First" },
          { id: "b", title: "Second" },
        ];
      });

      const todoRef = ref(handle, "todos", { id: "b" }, "title");
      expect(todoRef.value()).toBe("Second");
    });

    it("should work with at() for dynamic refs", () => {
      handle.change((d) => {
        d.items = [{ name: "A" }, { name: "B" }];
      });

      const dynamicRef = ref(handle, "items", at(0), "name");
      expect(dynamicRef.value()).toBe("A");
    });

    it("should handle deep paths", () => {
      handle.change((d) => {
        d.app = {
          settings: {
            theme: {
              color: "blue",
            },
          },
        };
      });

      const colorRef = ref(handle, "app", "settings", "theme", "color");
      expect(colorRef.value()).toBe("blue");
    });
  });
});

