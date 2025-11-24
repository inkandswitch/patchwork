import { describe, it, expect, beforeEach } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import * as Automerge from "@automerge/automerge";
import { at } from "../utils";
import { ref, findRef, Ref, AutomergeRefUrl } from "../index";
import { KIND } from "../types";

describe("utils", () => {
  describe("at", () => {
    it("should create an index segment", () => {
      const segment = at(0);
      expect(segment[KIND]).toBe("index");
      expect((segment as any).index).toBe(0);
    });

    it("should work with numbers", () => {
      const segment = at(5);
      expect(segment[KIND]).toBe("index");
      expect((segment as any).index).toBe(5);
    });

    it("should work with objects", () => {
      const idPattern = { id: "abc" };
      const segment = at(idPattern);
      expect(segment[KIND]).toBe("query");
      expect((segment as any).idPattern).toEqual(idPattern);
    });

    it("should work with arrays", () => {
      const range: [number, number] = [0, 10];
      const segment = at(range);
      expect(segment[KIND]).toBe("range");
      expect((segment as any).start).toBe(0);
      expect((segment as any).end).toBe(10);
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

  describe("findRef", () => {
    let repo: Repo;
    let handle: DocHandle<any>;

    beforeEach(() => {
      repo = new Repo();
      handle = repo.create();
    });

    it("should reconstruct a ref from its URL", async () => {
      handle.change((d: any) => {
        d.user = { name: "Alice", age: 30 };
      });

      const nameRef = ref(handle, "user", "name");
      const url = nameRef.url;

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe("Alice");
      expect(foundRef.url).toBe(url);
    });

    it("should handle nested paths", async () => {
      handle.change((d: any) => {
        d.app = {
          settings: {
            theme: { color: "blue" },
          },
        };
      });

      const colorRef = ref(handle, "app", "settings", "theme", "color");
      const url = colorRef.url;

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe("blue");
    });

    it("should handle array indices (ObjectId refs)", async () => {
      handle.change((d: any) => {
        d.todos = [
          { title: "first", done: false },
          { title: "second", done: true },
        ];
      });

      const titleRef = ref(handle, "todos", 0, "title");
      const url = titleRef.url;

      // Reorder array
      handle.change((d: any) => {
        d.todos.insertAt(0, { title: "second", done: true });
        d.todos.deleteAt(2);
      });

      // Found ref should still point to original first item (now at index 1)
      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe("first");
    });

    it("should handle where clauses", async () => {
      handle.change((d: any) => {
        d.users = [
          { id: "user1", name: "Alice" },
          { id: "user2", name: "Bob" },
        ];
      });

      const aliceRef = ref(handle, "users", { id: "user1" }, "name");
      const url = aliceRef.url;

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe("Alice");
    });

    it("should handle numeric ranges", async () => {
      handle.change((d: any) => {
        d.text = "hello world";
      });

      const rangeRef = ref(handle, "text", at([0, 5]));
      const url = rangeRef.url;

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe("hello");
    });

    it("should handle refs with heads", async () => {
      handle.change((d: any) => {
        d.counter = 1;
      });

      // Get heads using Automerge.getHeads (hex format) not handle.heads() (base58)
      const heads1 = Automerge.getHeads(handle.doc());

      handle.change((d: any) => {
        d.counter = 2;
      });

      const counterRef = new Ref(handle, ["counter"], { heads: heads1 });
      const url = counterRef.url;

      // Verify URL format: automerge:docId/path#head1,head2
      expect(url).toMatch(/^automerge:[^/]+\/counter#.+$/);
      expect(counterRef.value()).toBe(1); // Should see old value

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toBe(1); // Should see old value
      expect(foundRef.url).toBe(url);
    });

    it("should throw on invalid URL format", async () => {
      await expect(
        findRef(repo, "not-a-valid-url" as AutomergeRefUrl)
      ).rejects.toThrow("Invalid Automerge ref URL");
      await expect(
        findRef(repo, "wrong:abc/path" as AutomergeRefUrl)
      ).rejects.toThrow("Invalid Automerge ref URL");
    });

    it("should handle root path (document ref)", async () => {
      handle.change((d: any) => {
        d.value = 42;
      });

      const rootRef = ref(handle);
      const url = rootRef.url;

      const foundRef = await findRef(repo, url);
      expect(foundRef.value()).toEqual({ value: 42 });
    });
  });
});
