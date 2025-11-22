import { describe, it, expect, beforeEach } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "./ref";

describe("Ref", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo({ network: [] });
    handle = repo.create();
  });

  describe("value resolution", () => {
    it("should resolve a simple property path", () => {
      handle.change((d) => {
        d.title = "Test Document";
      });

      const ref = new Ref(handle, ["title"]);
      expect(ref.value()).toBe("Test Document");
    });

    it("should resolve nested paths", () => {
      handle.change((d) => {
        d.user = { name: "Alice", age: 30 };
      });

      const nameRef = new Ref(handle, ["user", "name"]);
      expect(nameRef.value()).toBe("Alice");

      const ageRef = new Ref(handle, ["user", "age"]);
      expect(ageRef.value()).toBe(30);
    });

    it("should resolve array indices", () => {
      handle.change((d) => {
        d.todos = [
          { title: "First", done: false },
          { title: "Second", done: true },
        ];
      });

      const firstTodo = new Ref(handle, ["todos", 0]);
      expect(firstTodo.value()).toEqual({ title: "First", done: false });

      const secondTitle = new Ref(handle, ["todos", 1, "title"]);
      expect(secondTitle.value()).toBe("Second");
    });

    it("should return undefined for invalid paths", () => {
      handle.change((d) => {
        d.data = { foo: "bar" };
      });

      const invalidRef = new Ref(handle, ["nonexistent", "path"]);
      expect(invalidRef.value()).toBeUndefined();
    });

    it("should return undefined for out-of-bounds array access", () => {
      handle.change((d) => {
        d.items = ["a", "b", "c"];
      });

      const ref = new Ref(handle, ["items", 99]);
      expect(ref.value()).toBeUndefined();
    });
  });

  describe("change", () => {
    it("should mutate objects in place", () => {
      handle.change((d) => {
        d.todo = { title: "Buy milk", done: false };
      });

      const doneRef = new Ref(handle, ["todo", "done"]);
      doneRef.change((done) => {
        // This won't work for primitives, so we need to return
        return true;
      });

      expect(doneRef.value()).toBe(true);
    });

    it("should replace primitive values via return", () => {
      handle.change((d) => {
        d.counter = 0;
      });

      const counterRef = new Ref<number>(handle, ["counter"]);
      counterRef.change((n) => n + 1);
      expect(counterRef.value()).toBe(1);

      counterRef.change((n) => n * 2);
      expect(counterRef.value()).toBe(2);
    });

    it("should replace string values via return", () => {
      handle.change((d) => {
        d.greeting = "hello";
      });

      const ref = new Ref<string>(handle, ["greeting"]);
      ref.change((str) => str.toUpperCase());
      expect(ref.value()).toBe("HELLO");
    });

    it("should mutate nested objects", () => {
      handle.change((d) => {
        d.user = { name: "Alice", settings: { theme: "light" } };
      });

      const themeRef = new Ref(handle, ["user", "settings", "theme"]);
      themeRef.change((theme) => "dark");

      expect(themeRef.value()).toBe("dark");
      expect(handle.docSync()?.user.settings.theme).toBe("dark");
    });
  });

  describe("url generation", () => {
    it("should generate a basic URL", () => {
      handle.change((d) => {
        d.title = "Test";
      });

      const ref = new Ref(handle, ["title"]);
      const url = ref.url;

      expect(url).toContain("automerge:");
      expect(url).toContain(handle.documentId);
      expect(url).toContain("title");
    });

    it("should include nested paths in URL", () => {
      const ref = new Ref(handle, ["user", "name"]);
      const url = ref.url;

      expect(url).toContain("user");
      expect(url).toContain("name");
    });
  });

  describe("equality", () => {
    it("should consider refs equal if they have the same URL", () => {
      const ref1 = new Ref(handle, ["todos", 0]);
      const ref2 = new Ref(handle, ["todos", 0]);

      expect(ref1.equals(ref2)).toBe(true);
      expect(ref1.url).toBe(ref2.url);
    });

    it("should consider refs unequal if paths differ", () => {
      const ref1 = new Ref(handle, ["todos", 0]);
      const ref2 = new Ref(handle, ["todos", 1]);

      expect(ref1.equals(ref2)).toBe(false);
    });

    it("should support valueOf for == comparison", () => {
      const ref1 = new Ref(handle, ["title"]);
      const ref2 = new Ref(handle, ["title"]);

      expect(ref1.valueOf()).toBe(ref2.valueOf());
    });
  });

  describe("doc access", () => {
    it("should return the current document", () => {
      handle.change((d) => {
        d.title = "Test";
      });

      const ref = new Ref(handle, ["title"]);
      const doc = ref.doc();

      expect(doc).toBeDefined();
      expect(doc?.title).toBe("Test");
    });
  });

  describe("where clause resolution", () => {
    it("should find items by where clause", () => {
      handle.change((d) => {
        d.todos = [
          { id: "a", title: "First" },
          { id: "b", title: "Second" },
          { id: "c", title: "Third" },
        ];
      });

      const ref = new Ref(handle, ["todos", { id: "b" }]);
      expect(ref.value()).toEqual({ id: "b", title: "Second" });
    });

    it("should return undefined if no match found", () => {
      handle.change((d) => {
        d.todos = [{ id: "a", title: "First" }];
      });

      const ref = new Ref(handle, ["todos", { id: "nonexistent" }]);
      expect(ref.value()).toBeUndefined();
    });

    it("should match multiple fields in where clause", () => {
      handle.change((d) => {
        d.items = [
          { type: "task", status: "done", title: "A" },
          { type: "task", status: "pending", title: "B" },
          { type: "note", status: "done", title: "C" },
        ];
      });

      const ref = new Ref(handle, ["items", { type: "task", status: "done" }]);
      expect(ref.value()).toEqual({ type: "task", status: "done", title: "A" });
    });
  });
});
