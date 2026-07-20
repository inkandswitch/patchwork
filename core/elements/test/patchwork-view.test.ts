import type { Repo } from "@automerge/automerge-repo";
import { getRegistry } from "@inkandswitch/patchwork-plugins";
import { beforeEach, describe, expect, it } from "vitest";

import {
  registerPatchworkViewElement,
  type ComponentDescription,
} from "../src/patchwork-view.js";

const registry = getRegistry<ComponentDescription>("patchwork:component");

type Counters = { mounts: number; cleanups: number };

function registerComponent(id: string): Counters {
  const counters: Counters = { mounts: 0, cleanups: 0 };
  const render = () => {
    counters.mounts++;
    return () => {
      counters.cleanups++;
    };
  };
  registry.register(
    {
      id,
      type: "patchwork:component",
      name: id,
      load: async () => render,
      module: render,
    } as never,
    `test://${id}`
  );
  return counters;
}

// Teardowns and renders settle across a few micro/macrotasks.
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

let seq = 0;

describe("patchwork-view (component mode)", () => {
  let a: HTMLElement;
  let b: HTMLElement;

  beforeEach(() => {
    registerPatchworkViewElement({ repo: {} as Repo });
    document.body.replaceChildren();
    a = document.createElement("div");
    b = document.createElement("div");
    document.body.append(a, b);
  });

  it("re-renders after a synchronous reparent", async () => {
    const id = `test-component-${++seq}`;
    const counters = registerComponent(id);

    const view = document.createElement("patchwork-view");
    view.setAttribute("component", id);
    a.append(view);
    await settle();
    expect(counters.mounts).toBe(1);

    // Remove-and-reinsert in the same task: disconnect starts an async
    // teardown, reconnect must not be swallowed by it.
    b.insertBefore(view, null);
    await settle();

    expect(counters.cleanups).toBe(1);
    expect(counters.mounts).toBe(2);
  });

  it("runs cleanups once when both observed attributes change in one tick", async () => {
    const first = `test-component-${++seq}`;
    const second = `test-component-${++seq}`;
    const firstCounters = registerComponent(first);
    const secondCounters = registerComponent(second);

    const view = document.createElement("patchwork-view");
    view.setAttribute("component", first);
    a.append(view);
    await settle();
    expect(firstCounters.mounts).toBe(1);

    let unmounts = 0;
    view.addEventListener("patchwork:unmounted", () => unmounts++);

    view.setAttribute("component", second);
    view.setAttribute("url", "automerge:2j9knpCbLzTXWFzLmvxSSicdMU7e");
    await settle();

    expect(firstCounters.cleanups).toBe(1);
    expect(unmounts).toBe(1);
    expect(secondCounters.mounts).toBe(1);
  });
});
