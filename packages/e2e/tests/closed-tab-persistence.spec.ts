import { expect, test } from "@playwright/test";
import {
  createDoc,
  findDocField,
  waitForRepoReady,
  waitForServiceWorkerActive,
} from "./helpers";

/**
 * The SW, not the tab, is the source of truth.
 *
 * A doc created in a tab must outlive that tab: once synced to the SW and
 * persisted to IndexedDB, closing the originating tab loses nothing. A tab
 * opened later finds the doc with all its structure intact.
 */

test("a doc outlives the tab that created it", async ({ context }) => {
  const tabA = await context.newPage();
  await tabA.goto("/");
  await waitForServiceWorkerActive(tabA);
  await waitForRepoReady(tabA);

  const url = await createDoc(tabA, {
    title: "orphaned-but-fine",
    meta: { tags: ["one", "two"], nested: { depth: 2 } },
  });

  // Confirm the SW has the doc before killing its origin: a round-trip
  // find from a second tab proves it left tab A's memory.
  const tabB = await context.newPage();
  await tabB.goto("/");
  await waitForRepoReady(tabB);
  await expect
    .poll(async () => findDocField<string>(tabB, url, "title"), {
      timeout: 15_000,
    })
    .toBe("orphaned-but-fine");

  await tabA.close();

  const tabC = await context.newPage();
  await tabC.goto("/");
  await waitForRepoReady(tabC);

  const doc = await tabC.evaluate(async (u) => {
    const handle = await window.repo.find<Record<string, unknown>>(u);
    return handle.doc();
  }, url);

  expect(doc).toEqual({
    title: "orphaned-but-fine",
    meta: { tags: ["one", "two"], nested: { depth: 2 } },
  });
});
