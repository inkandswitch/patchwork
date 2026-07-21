import { expect, test } from "@playwright/test";
import {
  createDoc,
  findDocField,
  waitForRepoReady,
  waitForServiceWorkerActive,
} from "./helpers";

/**
 * IndexedDB persistence across reloads.
 *
 * A doc created in a tab is synced to the SW, which persists it to
 * IndexedDB (Subduction storage). After a reload — even though the tab's
 * in-memory Repo is gone — the doc must still be retrievable, proving the
 * persistence layer works without any network.
 */
test("a doc survives a page reload via IndexedDB", async ({ page }) => {
  await page.goto("/");
  await waitForServiceWorkerActive(page);
  await waitForRepoReady(page);

  const url = await createDoc(page, { note: "persist-me" });

  // Give the SW a beat to receive + persist the doc before reloading.
  await expect
    .poll(async () => findDocField<string>(page, url, "note"), {
      timeout: 15_000,
    })
    .toBe("persist-me");

  await page.reload();
  await waitForRepoReady(page);

  const value = await findDocField<string>(page, url, "note");
  expect(value).toBe("persist-me");
});
