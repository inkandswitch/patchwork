import { test, expect } from '@playwright/test';

test('service worker installs and becomes ready', async ({ page }) => {
  await page.goto('/');

  // Wait for the app to load
  await expect(page.locator('text=My Documents')).toBeVisible();

  // Wait for service worker to be ready
  const serviceWorkerReady = await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      return {
        hasRegistration: !!registration,
        state: registration.active?.state,
        isControlling: !!navigator.serviceWorker.controller,
        scriptURL: registration.active?.scriptURL
      };
    }
    return { hasRegistration: false };
  });

  // Verify service worker is properly installed and active
  expect(serviceWorkerReady.hasRegistration).toBe(true);
  expect(serviceWorkerReady.state).toBe('activated');
  expect(serviceWorkerReady.isControlling).toBe(true);

  // Check what service workers are available
  const allServiceWorkers = await page.context().serviceWorkers();

  // Wait a bit for service worker to fully initialize
  await page.waitForTimeout(1000);

  // Check that we can access service worker internal state
  const [serviceWorker] = allServiceWorkers;
  expect(serviceWorker).toBeTruthy();

  const swInternalState = await serviceWorker.evaluate(() => {
    return {
      hasRepo: !!self.repo,
      hasAutomerge: !!self.Automerge,
      repoType: typeof self.repo,
      repoMethods: self.repo ? Object.getOwnPropertyNames(self.repo).slice(0, 5) : []
    };
  });

  // Verify key service worker functionality is working
  expect(swInternalState.hasRepo).toBe(true);
  expect(swInternalState.hasAutomerge).toBe(true);
  expect(swInternalState.repoType).toBe('object');
  expect(swInternalState.repoMethods.length).toBeGreaterThan(0);
});



test('Service worker serves Automerge text document content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=My Documents')).toBeVisible();

  // Wait for service worker to be ready
  const [serviceWorker] = await page.context().serviceWorkers();
  await serviceWorker.evaluate(() => self.repoReady || Promise.resolve());

  // Create a test document in the service worker
  const documentId = await serviceWorker.evaluate(async () => {
    // Ensure repo is ready
    if (!self.repo) await self.repoReady;

    // Create document with FileDoc structure
    const handle = self.repo.create({
      name: "test.txt",
      extension: "txt",
      mimeType: "text/plain",
      content: "Hello World"
    });

    // Wait for document to be ready
    await handle.whenReady();

    // Return the document ID for the test to use
    return handle.documentId;
  });

  // Make a request to the created document
  const response = await page.evaluate(async (docId) => {
    const resp = await fetch(`/automerge/${docId}`);
    return {
      status: resp.status,
      contentType: resp.headers.get('content-type'),
      text: await resp.text()
    };
  }, documentId);

  // Verify the response
  expect(response.status).toBe(200);
  expect(response.contentType).toBe('text/plain');
  expect(response.text).toBe('Hello World');
});

test('Service worker serves binary file content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=My Documents')).toBeVisible();

  // Wait for service worker to be ready
  const [serviceWorker] = await page.context().serviceWorkers();
  await serviceWorker.evaluate(() => self.repoReady || Promise.resolve());

  // Create a test binary document in the service worker
  const documentId = await serviceWorker.evaluate(async () => {
    // Ensure repo is ready
    if (!self.repo) await self.repoReady;

    // Create a simple binary file
    const binaryBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);

    // Create document with binary FileDoc structure
    const handle = self.repo.create({
      name: "test.bin",
      extension: "bin",
      mimeType: "application/octet-stream",
      content: binaryBytes
    });

    // Wait for document to be ready
    await handle.whenReady();

    // Return the document ID for the test to use
    return handle.documentId;
  });

  // Make a request to the created document
  const response = await page.evaluate(async (docId) => {
    const resp = await fetch(`/automerge/${docId}`);
    const arrayBuffer = await resp.arrayBuffer();
    return {
      status: resp.status,
      contentType: resp.headers.get('content-type'),
      byteLength: arrayBuffer.byteLength,
      bytes: Array.from(new Uint8Array(arrayBuffer))
    };
  }, documentId);

  // Verify the response
  expect(response.status).toBe(200);
  expect(response.contentType).toBe('application/octet-stream');
  expect(response.byteLength).toBe(4); // Binary file size
  expect(response.bytes).toEqual([0x01, 0x02, 0x03, 0x04]); // Full byte array
});

test('Service worker resolves nested file paths', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=My Documents')).toBeVisible();

  // Wait for service worker to be ready
  const [serviceWorker] = await page.context().serviceWorkers();
  await serviceWorker.evaluate(() => self.repoReady || Promise.resolve());

  // Create a test document with nested structure in the service worker
  const documentId = await serviceWorker.evaluate(async () => {
    // Ensure repo is ready
    if (!self.repo) await self.repoReady;

    // Create document with nested structure (not a file at root)
    const handle = self.repo.create({
      foo: "some value",
      bar: 42,
      nested: {
        name: "nested.txt",
        extension: "txt",
        mimeType: "text/plain",
        content: "Nested file content"
      }
    });

    // Wait for document to be ready
    await handle.whenReady();

    // Return the document ID for the test to use
    return handle.documentId;
  });

  // Test accessing the nested file
  const nestedResponse = await page.evaluate(async (docId) => {
    const resp = await fetch(`/automerge/${docId}/nested`);
    return {
      status: resp.status,
      contentType: resp.headers.get('content-type'),
      text: await resp.text()
    };
  }, documentId);

  // Verify the nested file response
  expect(nestedResponse.status).toBe(200);
  expect(nestedResponse.contentType).toBe('text/plain');
  expect(nestedResponse.text).toBe('Nested file content');
});

