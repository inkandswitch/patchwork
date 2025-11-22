import { describe, it, expect, beforeEach } from "vitest";
import * as Automerge from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import { ref } from "../factory";
import { at } from "../at";

describe("ref() factory", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo({ network: [] });
    handle = repo.create();
  });

  describe("basic path creation", () => {
    it("should create a ref with a simple property path", () => {
      handle.change((d) => {
        d.title = "Test";
      });

      const titleRef = ref(handle, "title");
      expect(titleRef.value()).toBe("Test");
    });

    it("should create a ref with nested properties", () => {
      handle.change((d) => {
        d.user = { name: "Alice", age: 30 };
      });

      const nameRef = ref(handle, "user", "name");
      expect(nameRef.value()).toBe("Alice");
    });

    it("should create a ref with array access", () => {
      handle.change((d) => {
        d.items = ["a", "b", "c"];
      });

      const itemRef = ref(handle, "items", 1);
      expect(itemRef.value()).toBe("b");
    });
  });

  describe("stabilization - numeric indices", () => {
    it("should stabilize numeric index to ObjectId", () => {
      handle.change((d) => {
        d.todos = [
          { title: "First", done: false },
          { title: "Second", done: true },
        ];
      });

      const firstRef = ref(handle, "todos", 0);
      const doc = handle.doc()!;
      const firstTodo = doc.todos[0];
      const objectId = Automerge.getObjectId(firstTodo);

      // Path should contain ObjectId, not numeric index
      expect(firstRef.path).toEqual(["todos", { $id: objectId }]);
      expect(firstRef.value()).toEqual({ title: "First", done: false });
    });

    it("should survive array reordering with stable refs", () => {
      handle.change((d) => {
        d.todos = [
          { title: "First", done: false },
          { title: "Second", done: true },
        ];
      });

      // Create ref to first item (gets stabilized to ObjectId)
      const firstRef = ref(handle, "todos", 0, "title");
      expect(firstRef.value()).toBe("First");

      // Move the first item to the end by deleting and re-adding
      handle.change((d) => {
        const firstItem = { title: d.todos[0].title, done: d.todos[0].done };
        d.todos.deleteAt(0);
        d.todos.push(firstItem);
      });

      // Ref should still point to the same item, even though it moved
      expect(firstRef.value()).toBe("First");
    });

    it("should handle primitives in arrays (no ObjectId)", () => {
      handle.change((d) => {
        d.numbers = [1, 2, 3];
      });

      const numRef = ref(handle, "numbers", 1);
      // Since primitives don't have ObjectIds, path stays numeric
      expect(numRef.path).toEqual(["numbers", 1]);
      expect(numRef.value()).toBe(2);
    });
  });

  describe("stabilization - where clauses", () => {
    it("should stabilize where clause to ObjectId", () => {
      handle.change((d) => {
        d.todos = [
          { id: "a", title: "First" },
          { id: "b", title: "Second" },
        ];
      });

      const todoRef = ref(handle, "todos", { id: "b" });
      const doc = handle.doc()!;
      const secondTodo = doc.todos[1];
      const objectId = Automerge.getObjectId(secondTodo);

      // Where clause should be resolved to ObjectId
      expect(todoRef.path).toEqual(["todos", { $id: objectId }]);
      expect(todoRef.value()).toEqual({ id: "b", title: "Second" });
    });

    it("should survive reordering with where clause refs", () => {
      handle.change((d) => {
        d.items = [
          { id: "a", name: "Alpha" },
          { id: "b", name: "Beta" },
          { id: "c", name: "Gamma" },
        ];
      });

      const betaRef = ref(handle, "items", { id: "b" }, "name");
      expect(betaRef.value()).toBe("Beta");

      // Move Beta to the end
      handle.change((d) => {
        const beta = { id: d.items[1].id, name: d.items[1].name };
        d.items.deleteAt(1);
        d.items.push(beta);
      });

      // Should still find Beta
      expect(betaRef.value()).toBe("Beta");
    });

    it("should handle multi-field where clauses", () => {
      handle.change((d) => {
        d.tasks = [
          { type: "bug", priority: "high", title: "Fix crash" },
          { type: "feature", priority: "high", title: "Add login" },
          { type: "bug", priority: "low", title: "Typo" },
        ];
      });

      const taskRef = ref(handle, "tasks", { type: "bug", priority: "high" });
      expect(taskRef.value()?.title).toBe("Fix crash");
    });
  });

  describe("stabilization - ranges", () => {
    it("should stabilize numeric range to cursors", () => {
      handle.change((d) => {
        d.note = { content: "Hello World" };
      });

      const rangeRef = ref(handle, "note", "content", [0, 5]);

      // Path should be: ["note", {$id: ...}, "content", [cursor, cursor]]
      expect(rangeRef.path[0]).toEqual("note");
      expect(rangeRef.path[1]).toHaveProperty("$id"); // note object's ID
      expect(rangeRef.path[2]).toEqual("content");
      expect(Array.isArray(rangeRef.path[3])).toBe(true);

      const range = rangeRef.path[3] as [any, any];
      // Cursors are objects
      expect(typeof range[0]).toBe("object");
      expect(typeof range[1]).toBe("object");

      expect(rangeRef.value()).toBe("Hello");
    });

    it("should survive text edits with cursor-based ranges", () => {
      handle.change((d) => {
        d.note = "Hello World";
      });

      // Create range ref to "World" (positions 6-11)
      const worldRef = ref(handle, "note", [6, 11]);
      expect(worldRef.value()).toBe("World");

      // Insert text before the range
      handle.change((d) => {
        Automerge.splice(d, ["note"], 0, 0, "Hi! ");
      });

      // Range should still point to "World"
      expect(worldRef.value()).toBe("World");
    });
  });

  describe("dynamic refs with at()", () => {
    it("should keep numeric index dynamic with at()", () => {
      handle.change((d) => {
        d.items = [{ a: 1 }, { b: 2 }, { c: 3 }];
      });

      const dynamicRef = ref(handle, "items", at(0));

      // Path should have numeric index, not ObjectId
      expect(dynamicRef.path).toEqual(["items", 0]);
      expect(dynamicRef.value()).toEqual({ a: 1 });
    });

    it("should always point to positional element with at()", () => {
      handle.change((d) => {
        d.todos = [{ title: "First" }, { title: "Second" }, { title: "Third" }];
      });

      // Dynamic ref to position 1
      const dynamicRef = ref(handle, "todos", at(1), "title");
      expect(dynamicRef.value()).toBe("Second");

      // Remove first item
      handle.change((d) => {
        d.todos.shift();
      });

      // Now dynamicRef points to what's at position 1 (was "Third")
      expect(dynamicRef.value()).toBe("Third");
    });

    it("should keep where clause dynamic with at()", () => {
      handle.change((d) => {
        d.items = [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
        ];
      });

      const dynamicRef = ref(handle, "items", at({ id: "b" }));

      // Path should have where clause, not ObjectId
      expect(dynamicRef.path).toEqual(["items", { id: "b" }]);
    });

    it("should keep range dynamic with at()", () => {
      handle.change((d) => {
        d.text = "Hello World";
      });

      const dynamicRef = ref(handle, "text", at([0, 5]));

      // Path should have numeric range, not cursors
      expect(dynamicRef.path).toEqual(["text", [0, 5]]);
      expect(dynamicRef.value()).toBe("Hello");

      // Insert at beginning
      handle.change((d) => {
        Automerge.splice(d, ["text"], 0, 0, ">> ");
      });

      // Dynamic range still points to positions 0-5 (now "> Hel")
      expect(dynamicRef.value()).toBe(">> He");
    });
  });

  describe("object references", () => {
    it("should accept direct object references", () => {
      handle.change((d) => {
        d.todos = [{ title: "First" }, { title: "Second" }];
      });

      const doc = handle.doc()!;
      const secondTodo = doc.todos[1];

      const todoRef = ref(handle, "todos", secondTodo, "title");
      expect(todoRef.value()).toBe("Second");

      // Should have ObjectId in path
      const objectId = Automerge.getObjectId(secondTodo);
      expect(todoRef.path).toEqual(["todos", { $id: objectId }, "title"]);
    });
  });

  describe("deep composition", () => {
    it("should handle mixed stable and dynamic segments", () => {
      handle.change((d) => {
        d.boards = [
          {
            id: "board1",
            columns: [
              { name: "Todo", cards: [{ title: "A" }, { title: "B" }] },
              { name: "Done", cards: [{ title: "C" }] },
            ],
          },
        ];
      });

      // board: stable by where clause
      // column: stable by index
      // card: dynamic by at()
      const cardRef = ref(
        handle,
        "boards",
        { id: "board1" },
        "columns",
        0,
        "cards",
        at(1),
        "title"
      );

      expect(cardRef.value()).toBe("B");

      // Add a card at the beginning
      handle.change((d) => {
        d.boards[0].columns[0].cards.unshift({ title: "NEW" });
      });

      // Dynamic ref now points to "A" (was at position 1, now position 2 but ref still looks at pos 1)
      expect(cardRef.value()).toBe("A");
    });
  });

  describe("error handling", () => {
    it("should handle when document is not yet ready", () => {
      // Create a handle but don't initialize the document
      const uninitializedHandle = repo.create();

      // The ref factory should work, but value() might return undefined
      const testRef = ref(uninitializedHandle, "test");
      expect(testRef).toBeDefined();
    });

    it("should handle out of bounds indices gracefully", () => {
      handle.change((d) => {
        d.items = ["a", "b"];
      });

      const outOfBoundsRef = ref(handle, "items", 99);
      expect(outOfBoundsRef.value()).toBeUndefined();
    });

    it("should handle non-existent where clause matches", () => {
      handle.change((d) => {
        d.items = [{ id: "a" }, { id: "b" }];
      });

      const noMatchRef = ref(handle, "items", { id: "nonexistent" });
      expect(noMatchRef.value()).toBeUndefined();
    });
  });
});
