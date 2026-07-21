import { expect, test } from "@playwright/test";
import { waitForRepoReady, waitForServiceWorkerActive } from "./helpers.js";

/**
 * Cold-boot: a fresh visit registers the Service Worker, initialises Wasm,
 * and brings up the tab Repo + SW relay within a tight budget.
 *
 * This asserts the *infrastructure* boot (window.repo), not full UI render:
 * rendering the default frame needs the prod Subduction server to fetch the
 * default-modules doc, which B1 does not depend on. Full-render assertions
 * arrive in B3 against a local sync server.
 */
test("cold boot brings up the service worker and tab repo", async ({ page }) => {
  await page.goto("/");

  await waitForServiceWorkerActive(page);

  // The tab Repo must be constructed and its SW relay connected. This is
  // the core sync path; if it regresses, instant sync breaks.
  await waitForRepoReady(page);

  const hasRepo = await page.evaluate(
    () => typeof window.repo?.create === "function",
  );
  expect(hasRepo).toBe(true);
});

test("a second load reuses the already-active service worker quickly", async ({
  page,
}) => {
  await page.goto("/");
  await waitForServiceWorkerActive(page);
  await waitForRepoReady(page);

  // Second load should come up against the already-active SW well within
  // budget (no fresh install). A regression here is a first-load slowdown.
  const start = Date.now();
  await page.reload();
  await waitForRepoReady(page, 15_000);
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(15_000);
});
