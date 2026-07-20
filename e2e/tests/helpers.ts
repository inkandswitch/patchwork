import type { Page } from "@playwright/test";

/**
 * Shared helpers for driving the Patchwork boot path from a Playwright page.
 *
 * Boot signals (see core/bootloader/src/site.ts):
 *  - `window.repo` is set in `installDevConsoleGlobals`, immediately after
 *    the SW repo channel connects — BEFORE account resolution. It is the
 *    server-independent "sync infrastructure is live" signal we rely on in
 *    B1 (account resolution needs the prod Subduction server).
 *  - `window.patchwork` is set only after the full boot incl. account
 *    resolution, so it is NOT reliable offline. B1 deliberately avoids it.
 */

declare global {
  interface Window {
    // Minimal shape we touch from tests; the app types it more fully.
    repo: {
      create: <T>(initial?: T) => { url: string; change: (fn: (d: any) => void) => void };
      find: <T>(
        url: string,
      ) => Promise<{ doc: () => T; change: (fn: (d: any) => void) => void }>;
    };
  }
}

export async function waitForRepoReady(page: Page, timeoutMs = 30_000): Promise<void> {
  await page.waitForFunction(() => typeof window.repo?.create === "function", null, {
    timeout: timeoutMs,
  });
}

export async function waitForServiceWorkerActive(
  page: Page,
  timeoutMs = 30_000,
): Promise<void> {
  await page.waitForFunction(
    () =>
      "serviceWorker" in navigator &&
      navigator.serviceWorker.controller != null,
    null,
    { timeout: timeoutMs },
  );
}

export async function createDoc(
  page: Page,
  value: Record<string, unknown>,
): Promise<string> {
  return page.evaluate((val) => {
    const handle = window.repo.create<Record<string, unknown>>();
    handle.change((d) => {
      Object.assign(d, val);
    });
    return handle.url;
  }, value);
}

export async function setDocField(
  page: Page,
  url: string,
  field: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    async ([u, f, v]) => {
      const handle = await window.repo.find<Record<string, unknown>>(u as string);
      handle.change((d) => {
        d[f as string] = v;
      });
    },
    [url, field, value] as const,
  );
}

export async function findDocField<T = unknown>(
  page: Page,
  url: string,
  field: string,
): Promise<T> {
  return page.evaluate(
    async ([u, f]) => {
      const handle = await window.repo.find<Record<string, unknown>>(u);
      return handle.doc()[f] as T;
    },
    [url, field] as const,
  );
}
