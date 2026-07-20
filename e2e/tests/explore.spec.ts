import { expect, test } from "@playwright/test";
import {
  createDoc,
  findDocField,
  waitForRepoReady,
  waitForServiceWorkerActive,
} from "./helpers";

test("probe offline reload failure", async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await waitForServiceWorkerActive(page);
  await waitForRepoReady(page);
  await page.reload();
  await waitForRepoReady(page);

  const url = await createDoc(page, { note: "x" });
  await expect
    .poll(async () => findDocField<string>(page, url, "note"), {
      timeout: 30_000,
    })
    .toBe("x");

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const urls = [
            location.href,
            new URL("/automerge.wasm", location.origin).href,
            new URL("/subduction.wasm", location.origin).href,
          ];
          const matches = await Promise.all(urls.map((u) => caches.match(u)));
          return matches.filter((m) => !m).length;
        }),
      { timeout: 30_000 },
    )
    .toBe(0);

  const failures: string[] = [];
  const logs: string[] = [];
  page.on("requestfailed", (r) =>
    failures.push(`${r.url().slice(-70)} :: ${r.failure()?.errorText}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400)
      failures.push(`${r.url().slice(-70)} :: HTTP ${r.status()}`);
  });
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type()))
      logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => logs.push(`[pageerror] ${String(e).slice(0, 250)}`));

  await context.setOffline(true);
  await page.reload();
  await page.waitForTimeout(35_000);
  const state = await page.evaluate(() => ({
    repo: typeof (window as any).repo,
    controlled: !!navigator.serviceWorker.controller,
  }));
  console.log("STATE:", JSON.stringify(state));
  console.log("FAILURES:\n" + failures.slice(0, 25).join("\n"));
  console.log("LOGS:\n" + logs.slice(0, 25).join("\n"));
});
