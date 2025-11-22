import { describe, it, expect, beforeEach } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import type { DocHandle } from "@automerge/automerge-repo";
import { ref } from "../ref";

describe("RefContext", () => {
  let repo: Repo;
  let handle: DocHandle<any>;

  beforeEach(() => {
    repo = new Repo();
    handle = repo.create();
  });

  describe("splice", () => {
    it("should splice text using context", () => {
      handle.change((d) => {
        d.content = "hello world";
      });

      const textRef = ref<string>(handle, "content");

      textRef.change((text, ctx) => {
        ctx.splice(0, 5, "goodbye");
      });

      expect(textRef.value()).toBe("goodbye world");
    });

    it("should work with nested paths", () => {
      handle.change((d) => {
        d.doc = { title: "hello" };
      });

      const titleRef = ref<string>(handle, "doc", "title");

      titleRef.change((text, ctx) => {
        ctx.splice(0, 0, "say ");
      });

      expect(titleRef.value()).toBe("say hello");
    });

    it("should work with array paths", () => {
      handle.change((d) => {
        d.items = [{ text: "first" }];
      });

      const itemRef = ref<string>(handle, "items", 0, "text");

      itemRef.change((text, ctx) => {
        ctx.splice(5, 0, " item");
      });

      expect(itemRef.value()).toBe("first item");
    });
  });

  describe("updateText", () => {
    it("should update entire text using context", () => {
      handle.change((d) => {
        d.content = "hello";
      });

      const textRef = ref<string>(handle, "content");

      textRef.change((text, ctx) => {
        ctx.updateText("goodbye");
      });

      expect(textRef.value()).toBe("goodbye");
    });

    it("should work with nested paths", () => {
      handle.change((d) => {
        d.doc = { title: "old title" };
      });

      const titleRef = ref<string>(handle, "doc", "title");

      titleRef.change((text, ctx) => {
        ctx.updateText("new title");
      });

      expect(titleRef.value()).toBe("new title");
    });
  });

  describe("context with stable refs", () => {
    it("should work with ObjectId refs", () => {
      handle.change((d) => {
        d.todos = [
          { title: "first", done: false },
          { title: "second", done: false },
        ];
      });

      // Get stable ref to first todo's title
      const titleRef = ref<string>(handle, "todos", 0, "title");

      // Swap first two elements by inserting second at index 0 and deleting old second
      handle.change((d) => {
        d.todos.insertAt(0, { title: "second", done: false });
        d.todos.deleteAt(2); // Delete old second (now at index 2)
      });

      // Mutation should still work on the original first item (now at index 1)
      titleRef.change((text, ctx) => {
        ctx.updateText("updated first");
      });

      const todos = handle.doc()?.todos;
      expect(todos[1].title).toBe("updated first");
      expect(todos[0].title).toBe("second");
    });

    it("should work with where clause refs", () => {
      handle.change((d) => {
        d.users = [
          { id: "user1", name: "Alice" },
          { id: "user2", name: "Bob" },
        ];
      });

      const aliceRef = ref<string>(handle, "users", { id: "user1" }, "name");

      aliceRef.change((name, ctx) => {
        ctx.updateText("Alice Smith");
      });

      const users = handle.doc()?.users;
      expect(users[0].name).toBe("Alice Smith");
    });
  });

  describe("regular mutation alongside context", () => {
    it("should allow regular mutation for objects", () => {
      handle.change((d) => {
        d.item = { title: "test", count: 0 };
      });

      const itemRef = ref(handle, "item");

      itemRef.change((item, ctx) => {
        item.count++;
        item.done = true;
      });

      const item = handle.doc()?.item;
      expect(item.count).toBe(1);
      expect(item.done).toBe(true);
    });

    it("should allow returning new value for primitives", () => {
      handle.change((d) => {
        d.count = 5;
      });

      const countRef = ref<number>(handle, "count");

      countRef.change((count, ctx) => {
        return count + 1;
      });

      expect(handle.doc()?.count).toBe(6);
    });
  });
});
