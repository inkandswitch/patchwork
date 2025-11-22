import { describe, it, expect, beforeEach } from "vitest";
import { Cursor, splice } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "../ref";
import { at } from "../at";

describe("Ref", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
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
      expect(handle.doc().user.settings.theme).toBe("dark");
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

  describe("ObjectId stability", () => {
    it("should still resolve after reordering when using ObjectId", () => {
      handle.change((d) => {
        d.todos = [{ title: "First" }, { title: "Second" }];
      });

      const ref = new Ref(handle, ["todos", 1, "title"]);
      expect(ref.value()).toBe("Second");

      // Move items around
      handle.change((d) => {
        d.todos.deleteAt(0);
      });

      // Should still resolve to "Second" even though it moved to end
      expect(ref.value()).toBe("Second");
    });
  });

  describe("dynamic vs stable refs", () => {
    it("should auto-stabilize numeric indices to ObjectIds by default", () => {
      handle.change((d) => {
        d.todos = [{ title: "A" }, { title: "B" }, { title: "C" }];
      });

      // Numeric index should be stabilized to ObjectId
      const ref = new Ref(handle, ["todos", 1]);

      expect(ref.value().title).toBe("B");
    });

    it("should keep refs stable after reordering (auto-stabilized)", () => {
      handle.change((d) => {
        d.todos = [{ title: "A" }, { title: "B" }, { title: "C" }];
      });

      // Create ref to middle item (auto-stabilizes to ObjectId)
      const ref = new Ref(handle, ["todos", 1, "title"]);
      expect(ref.value()).toBe("B");

      handle.change((d) => {
        d.todos.deleteAt(0);
      });

      // Ref should still point to "B" even though it moved
      expect(ref.value()).toBe("B");
    });

    it("should keep dynamic refs with at() pointing to position", () => {
      handle.change((d) => {
        d.todos = [{ title: "A" }, { title: "B" }, { title: "C" }];
      });

      // Using at() keeps it dynamic (positional)
      const dynamicRef = new Ref(handle, ["todos", at(1), "title"]);
      expect(dynamicRef.path[1]).toEqual(1);
      expect(dynamicRef.value()).toBe("B");

      // Remove first item - position 1 now has "C"
      handle.change((d) => {
        d.todos.deleteAt(0);
      });

      // Dynamic ref now points to position 1 (which is "C")
      expect(dynamicRef.value()).toBe("C");
    });

    it("should auto-stabilize where clauses to ObjectIds", () => {
      handle.change((d) => {
        d.items = [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
        ];
      });

      // Where clause should be stabilized to ObjectId
      const ref = new Ref(handle, ["items", { id: "b" }, "value"]);

      expect(ref.value()).toBe(2);
    });

    it("should demonstrate stable vs dynamic behavior side-by-side", () => {
      handle.change((d) => {
        d.todos = [{ title: "A" }, { title: "B" }, { title: "C" }];
      });

      // Stable ref (auto-stabilized to ObjectId)
      const stableRef = new Ref(handle, ["todos", 1, "title"]);
      // Dynamic ref (explicitly marked with at())
      const dynamicRef = new Ref(handle, ["todos", at(1), "title"]);

      // Both point to "B" initially
      expect(stableRef.value()).toBe("B");
      expect(dynamicRef.value()).toBe("B");

      // Remove first item
      handle.change((d) => {
        d.todos.deleteAt(0);
      });

      // Stable ref still points to "B" (tracked by ObjectId)
      expect(stableRef.value()).toBe("B");
      // Dynamic ref now points to position 1, which is "C"
      expect(dynamicRef.value()).toBe("C");
    });

    it("should not stabilize primitives (no ObjectId)", () => {
      handle.change((d) => {
        d.numbers = [1, 2, 3];
      });

      // Primitives don't have ObjectIds, so stays numeric
      const ref = new Ref(handle, ["numbers", 1]);
      expect(ref.path).toEqual(["numbers", 1]);
      expect(ref.value()).toBe(2);
    });

    it("should keep where clauses dynamic with at()", () => {
      handle.change((d) => {
        d.items = [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
        ];
      });

      // Using at() with where clause keeps it dynamic
      const dynamicRef = new Ref(handle, ["items", at({ id: "b" })]);
      expect(dynamicRef.path[1]).toEqual({ id: "b" });
      expect(dynamicRef.value()).toEqual({ id: "b", value: 2 });
    });

    it("should auto-stabilize ranges to cursors", () => {
      handle.change((d) => {
        d.note = "Hello World";
      });

      // Numeric range should be stabilized to cursors
      const ref = new Ref(handle, ["note", [0, 5]]);

      // Path should contain cursor-based range
      const range = ref.path[1] as [Cursor, Cursor];
      console.log(range);
      expect(Array.isArray(range)).toBe(true);
      expect(typeof range[0]).toBe("string"); // Cursor
      expect(typeof range[1]).toBe("string"); // Cursor

      expect(ref.value()).toBe("Hello");
    });

    it("should keep ranges dynamic with at()", () => {
      handle.change((d) => {
        d.text = "Hello World";
      });

      // Using at() keeps range as numeric
      const dynamicRef = new Ref(handle, ["text", at([0, 5])]);
      expect(dynamicRef.path[1]).toEqual(at([0, 5]));
      expect(dynamicRef.value()).toBe("Hello");

      // Insert at beginning
      handle.change((d) => {
        splice(d, ["text"], 0, 0, ">> ");
      });

      // Dynamic range still at positions 0-5 (now "> Hel")
      expect(dynamicRef.value()).toBe(">> He");
    });
  });

  describe("change callback behavior", () => {
    it("should pass current value to callback", () => {
      handle.change((d) => {
        d.counter = 5;
      });

      const ref = new Ref<number>(handle, ["counter"]);

      let receivedValue: number | undefined;
      ref.change((val) => {
        receivedValue = val;
      });

      expect(receivedValue).toBe(5);
    });

    it("should not update if callback returns void", () => {
      handle.change((d) => {
        d.data = { value: 10 };
      });

      const ref = new Ref(handle, ["data", "value"]);

      ref.change((val) => {
        // Return void - no update
      });

      expect(ref.value()).toBe(10);
    });

    it("should update when callback returns a value", () => {
      handle.change((d) => {
        d.counter = 0;
      });

      const ref = new Ref<number>(handle, ["counter"]);

      ref.change((val) => val + 10);
      expect(ref.value()).toBe(10);

      ref.change((val) => val * 2);
      expect(ref.value()).toBe(20);
    });

    it("should allow mutations on objects", () => {
      handle.change((d) => {
        d.config = { enabled: false, count: 0 };
      });

      const ref = new Ref(handle, ["config"]);

      ref.change((config) => {
        config.enabled = true;
        config.count = 5;
        // Return void - mutations applied
      });

      expect(ref.value()).toEqual({ enabled: true, count: 5 });
    });

    it("should allow replacing entire objects", () => {
      handle.change((d) => {
        d.settings = { theme: "light" };
      });

      const ref = new Ref(handle, ["settings"]);

      ref.change(() => {
        return { theme: "dark", fontSize: 14 };
      });

      expect(ref.value()).toEqual({ theme: "dark", fontSize: 14 });
    });

    it("should work with nested paths", () => {
      handle.change((d) => {
        d.user = {
          profile: {
            name: "Alice",
            age: 25,
          },
        };
      });

      const ageRef = new Ref<number>(handle, ["user", "profile", "age"]);

      ageRef.change((age) => age + 1);
      expect(ageRef.value()).toBe(26);
      expect(handle.doc().user.profile.age).toBe(26);
    });

    it("should handle undefined values gracefully", () => {
      handle.change((d) => {
        d.data = {};
      });

      const ref = new Ref(handle, ["data", "missing"]);

      let receivedValue: any;
      ref.change((val) => {
        receivedValue = val;
        return "now exists";
      });

      expect(receivedValue).toBeUndefined();
      expect(ref.value()).toBe("now exists");
    });

    it("should allow conditional updates", () => {
      handle.change((d) => {
        d.counter = 5;
      });

      const ref = new Ref<number>(handle, ["counter"]);

      // Only update if > 10
      ref.change((val) => {
        if (val > 10) return 0;
        // Return undefined = no change
      });

      expect(ref.value()).toBe(5);

      // Update to trigger condition
      ref.change(() => 15);
      ref.change((val) => {
        if (val > 10) return 0;
      });

      expect(ref.value()).toBe(0);
    });
  });

  describe("on('change') event listening", () => {
    it("should fire when the referenced value changes", async () => {
      handle.change((d) => {
        d.counter = 0;
      });

      const ref = new Ref<number>(handle, ["counter"]);

      const changePromise = new Promise<void>((resolve) => {
        ref.on("change", () => {
          expect(ref.value()).toBe(1);
          resolve();
        });
      });

      handle.change((d) => {
        d.counter = 1;
      });

      await changePromise;
    });

    it("should NOT fire when unrelated values change", async () => {
      handle.change((d) => {
        d.counter = 0;
        d.other = "initial";
      });

      const ref = new Ref<number>(handle, ["counter"]);
      let callCount = 0;

      ref.on("change", () => {
        callCount++;
      });

      // Change unrelated value
      handle.change((d) => {
        d.other = "changed";
      });

      // Wait a bit and verify callback wasn't called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callCount).toBe(0);
    });

    it("should fire when nested value changes", async () => {
      handle.change((d) => {
        d.user = { profile: { name: "Alice" } };
      });

      const nameRef = new Ref<string>(handle, ["user", "profile", "name"]);

      const changePromise = new Promise<void>((resolve) => {
        nameRef.on("change", () => {
          expect(nameRef.value()).toBe("Bob");
          resolve();
        });
      });

      handle.change((d) => {
        d.user.profile.name = "Bob";
      });

      await changePromise;
    });

    it("should NOT fire when parent's sibling changes", async () => {
      handle.change((d) => {
        d.user = { profile: { name: "Alice", age: 30 } };
      });

      const nameRef = new Ref<string>(handle, ["user", "profile", "name"]);
      let callCount = 0;

      nameRef.on("change", () => {
        callCount++;
      });

      // Change sibling property
      handle.change((d) => {
        d.user.profile.age = 31;
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callCount).toBe(0);
    });

    it("should fire for array element changes with ObjectId refs", async () => {
      handle.change((d) => {
        d.todos = [
          { title: "First", done: false },
          { title: "Second", done: false },
        ];
      });

      // This ref will be stabilized to ObjectId
      const todoRef = new Ref(handle, ["todos", 0]);

      const changePromise = new Promise<void>((resolve) => {
        todoRef.on("change", () => {
          expect(todoRef.value()?.done).toBe(true);
          resolve();
        });
      });

      handle.change((d) => {
        d.todos[0].done = true;
      });

      await changePromise;
    });

    it("should fire for dynamic refs at the correct position", async () => {
      handle.change((d) => {
        d.items = ["a", "b", "c"];
      });

      const dynamicRef = new Ref(handle, ["items", at(1)]);

      const changePromise = new Promise<void>((resolve) => {
        dynamicRef.on("change", () => {
          expect(dynamicRef.value()).toBe("modified");
          resolve();
        });
      });

      // Change position 1
      handle.change((d) => {
        d.items[1] = "modified";
      });

      await changePromise;
    });

    it("should provide patches in callback", async () => {
      handle.change((d) => {
        d.data = { value: 10 };
      });

      const ref = new Ref(handle, ["data", "value"]);

      const changePromise = new Promise<void>((resolve) => {
        ref.on("change", ({ patches }) => {
          expect(patches).toBeDefined();
          expect(Array.isArray(patches)).toBe(true);
          expect(patches.length).toBeGreaterThan(0);
          resolve();
        });
      });

      handle.change((d) => {
        d.data.value = 20;
      });

      await changePromise;
    });

    it("should allow unsubscribing from changes", async () => {
      handle.change((d) => {
        d.counter = 0;
      });

      const ref = new Ref<number>(handle, ["counter"]);
      let callCount = 0;

      const unsubscribe = ref.on("change", () => {
        callCount++;
      });

      // Make one change
      handle.change((d) => {
        d.counter = 1;
      });

      // Wait for the change to propagate
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Unsubscribe
      unsubscribe();

      // Make another change
      handle.change((d) => {
        d.counter = 2;
      });

      // Verify only the first change was detected
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(callCount).toBe(1);
    });

    it.skip("should fire for text range changes", async () => {
      handle.change((d) => {
        d.note = "Hello World";
      });

      const rangeRef = new Ref(handle, ["note", [0, 5]]);

      const changePromise = new Promise<void>((resolve) => {
        rangeRef.on("change", () => {
          // Range should have shifted due to cursor stabilization
          expect(rangeRef.value()).toBe("Hello");
          resolve();
        });
      });

      // Insert text before the range
      handle.change((d) => {
        splice(d, ["note"], 0, 0, ">>> ");
      });

      await changePromise;
    });

    it("should fire for where clause refs when matched item changes", async () => {
      handle.change((d) => {
        d.items = [
          { id: "a", value: 1 },
          { id: "b", value: 2 },
        ];
      });

      // Where clause will be stabilized to ObjectId
      const ref = new Ref(handle, ["items", { id: "b" }, "value"]);

      const changePromise = new Promise<void>((resolve) => {
        ref.on("change", () => {
          expect(ref.value()).toBe(20);
          resolve();
        });
      });

      handle.change((d) => {
        d.items[1].value = 20;
      });

      await changePromise;
    });
  });
});
