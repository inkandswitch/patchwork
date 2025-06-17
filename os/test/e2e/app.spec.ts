import { test, expect } from '@playwright/test';

test('app loads and shows basic UI', async ({ page }) => {
  await page.goto('/');

  // Wait for the app to load and show the "My Documents" text in the sidebar
  await expect(page.locator('text=My Documents')).toBeVisible();

  // Check that the "No document selected" state is shown initially
  await expect(page.locator('text=No document selected')).toBeVisible();
});

test('create essay, type text, reload and verify persistence', async ({ page }) => {
  await page.goto('/');

  // Wait for app to load and show "No document selected" state
  await expect(page.locator('text=My Documents')).toBeVisible();
  await expect(page.locator('text=No document selected')).toBeVisible();

  // Click the "Create new document" button in the main area
  await page.getByTestId('create-new-document-btn').click();

  // Wait for essay editor to load
  await expect(page.getByTestId('essay-editor')).toBeVisible();

  // Wait for CodeMirror editor to be ready and type some text
  const editorLocator = page.locator('.cm-editor .cm-content');
  await expect(editorLocator).toBeVisible();
  
  // Type some test content
  const testText = 'This is my test essay content. It should persist after reload.';
  await editorLocator.click();
  await editorLocator.fill(testText);

  // Wait a moment for autosave
  await page.waitForTimeout(2000);

  // Reload the page
  await page.reload();

  // Wait for app to load again
  await expect(page.locator('text=My Documents')).toBeVisible();

  // The essay should be selected and the text should still be there
  await expect(editorLocator).toBeVisible();
  // The editor includes a default "# Untitled" title, so check that our text is contained
  await expect(editorLocator).toContainText(testText);
});