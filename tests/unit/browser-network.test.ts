import { expect, test } from 'vitest';
import { chromium } from '@playwright/test';
import { createGuardedContext, FIXTURE_ORIGIN } from '../helpers/browser-network.ts';

// All browsers and descendants execute under the unchanged N0 namespace.
// The positive response proves this is behavioral red, not missing setup.
test('N1 attributes an unexpected request even when the caller handles navigation', async () => {
  const browser = await chromium.launch({ headless: true });
  const guard = await createGuardedContext(browser, [{ id: 'home', path: '/', method: 'GET', resource: 'document', body: '<h1>protected positive control</h1>' }]);
  try {
    const page = await guard.context.newPage();
    await page.goto(`${FIXTURE_ORIGIN}/`);
    expect(await page.locator('h1').textContent()).toBe('protected positive control');
    console.log('::notice title=N1 positive control::local response rendered inside N0');
    await page.goto(`${FIXTURE_ORIGIN}/unexpected`).catch(() => undefined);
    await expect(guard.finish()).rejects.toThrow('N1_UNEXPECTED_REQUEST');
  } finally {
    await guard.context.close();
    await browser.close();
  }
}, 30000);
