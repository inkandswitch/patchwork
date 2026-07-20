import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * Full-boot cross-profile sync: the whole product loop, not just the relay.
 *
 * Two Playwright contexts are two browser profiles: separate Service
 * Workers, IndexedDBs, and accounts. The only path between them is the real
 * Subduction sync server, so unlike the rest of the suite these tests need
 * the network (module bundle from netlify, sync via
 * wss://subduction.sync.inkandswitch.com).
 *
 * Profile A boots to the threepane frame, creates a Markdown doc through
 * the create-new menu, and types into the CodeMirror editor. Profile B
 * opens the doc's URL cold, must receive A's edit, and replies; A must see
 * the reply.
 *
 * The second test runs the same loop against the deployed
 * https://patchwork.inkandswitch.com instead of the local build.
 */

const LIVE_ORIGIN = "https://patchwork.inkandswitch.com";

async function bootToFrame(page: Page, origin: string, path = "/") {
  await page.goto(origin + path);
  await page.waitForSelector(".threepane-sidebar", { timeout: 90_000 });
}

function editor(page: Page) {
  return page.locator(".cm-content").first();
}

async function typeAtEnd(page: Page, text: string) {
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+End");
  await page.keyboard.type(text);
}

async function crossProfileMarkdownSync(browser: Browser, origin: string) {
  const profileA = await browser.newContext();
  const profileB = await browser.newContext();
  try {
    const pageA = await profileA.newPage();
    await bootToFrame(pageA, origin);

    await pageA.getByRole("button", { name: "create new" }).click();
    await pageA
      .locator(".popmenu__item", { hasText: "Markdown" })
      .first()
      .click();
    await expect(editor(pageA)).toBeVisible({ timeout: 30_000 });
    await expect(pageA).toHaveURL(/doc=automerge:/, { timeout: 30_000 });

    await typeAtEnd(pageA, "\nhello from profile A");
    await expect(editor(pageA)).toContainText("hello from profile A");

    const docHash = new URL(pageA.url()).hash;

    const pageB = await profileB.newPage();
    await bootToFrame(pageB, origin, `/${docHash}`);
    await expect(editor(pageB)).toContainText("hello from profile A", {
      timeout: 90_000,
    });

    await typeAtEnd(pageB, "\nhello back from profile B");

    await expect(editor(pageA)).toContainText("hello back from profile B", {
      timeout: 90_000,
    });
    await expect(editor(pageA)).toContainText("hello from profile A");
  } finally {
    await profileA.close();
    await profileB.close();
  }
}

// Playwright's Firefox build fails any cors fetch made from inside a service
// worker (plain pages are fine), so the module bundle never loads and the
// frame can't render. Real Firefox is unaffected as far as we can tell.
test("a markdown doc round-trips between two profiles via the sync server", async ({
  browser,
  browserName,
}) => {
  test.skip(browserName === "firefox", "cors fetches fail in playwright-firefox service workers");
  test.setTimeout(300_000);
  await crossProfileMarkdownSync(browser, "");
});

test("the same round-trip works on the live patchwork.inkandswitch.com", async ({
  browser,
  browserName,
}) => {
  test.skip(browserName === "firefox", "cors fetches fail in playwright-firefox service workers");
  test.setTimeout(300_000);
  await crossProfileMarkdownSync(browser, LIVE_ORIGIN);
});
