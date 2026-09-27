import { expect, test } from 'vitest';
import { chromium, firefox, webkit } from '@playwright/test';
import { createGuardedContext, FIXTURE_ORIGIN, observeDocumentWebSockets } from '../helpers/browser-network.ts';

// Retain the original protected red: attribution implementation is still pending.
test('N1 attributes an unexpected request even when the caller handles navigation', async () => {
  const browser = await chromium.launch({ headless: true });
  const guard = await createGuardedContext(browser, [{ id: 'home', path: '/', method: 'GET', resource: 'document', body: '<h1>protected positive control</h1>' }]);
  try {
    const page = await guard.context.newPage();
    await page.goto(`${FIXTURE_ORIGIN}/`);
    expect(await page.locator('h1').textContent()).toBe('protected positive control');
    await page.goto(`${FIXTURE_ORIGIN}/unexpected`).catch(() => undefined);
    await expect(guard.finish(), 'N1 positive local response verified; unexpected local request must be attributed at teardown').rejects.toThrow('N1_UNEXPECTED_REQUEST');
  } finally {
    await guard.context.close();
    await browser.close();
  }
}, 30000);

for (const engine of [chromium, firefox, webkit]) {
  test(`N1 public observer detects page WebSocket override in ${engine.name()}`, async () => {
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    let contextRoutes = 0;
    let pageRoutes = 0;
    let nativeObserved = 0;
    let observedHttp = 0;
    context.on('request', () => { observedHttp++; });
    context.on('page', page => page.on('websocket', () => { nativeObserved++; }));
    try {
      await context.route('**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>local websocket control</h1>' }));
      await context.routeWebSocket('**/*', socket => {
        contextRoutes++;
        socket.onMessage(() => socket.send('context-local'));
      });
      const observer = await observeDocumentWebSockets(context);
      const page = await context.newPage();
      await page.routeWebSocket('**/*', socket => {
        pageRoutes++;
        socket.onMessage(() => socket.send('page-local'));
      });
      await page.goto(`${FIXTURE_ORIGIN}/`);
      expect(await page.locator('h1').textContent()).toBe('local websocket control');
      const reply = await page.evaluate(() => new Promise<string>((resolve, reject) => {
        const socket = new WebSocket('wss://fcd-fixture.invalid/socket');
        const deadline = setTimeout(() => { socket.close(); reject(new Error('local WebSocket control timed out')); }, 3000);
        socket.onopen = () => socket.send('local');
        socket.onmessage = event => { clearTimeout(deadline); socket.close(); resolve(String(event.data)); };
        socket.onerror = () => { clearTimeout(deadline); reject(new Error('local WebSocket control failed')); };
      }));
      expect(reply).toBe('page-local');
      expect(pageRoutes).toBe(1);
      expect(contextRoutes).toBe(0);
      expect(observedHttp).toBe(1);
      // Preserve characterization of the native blind spot. The independent
      // document observer, not the policy/page route counter, must now see it.
      expect(nativeObserved).toBe(0);
      await expect.poll(() => observer.count(), { timeout: 3000, message: `N1_PUBLIC_OBSERVER_GAP ${engine.name()}: local override exchange succeeded but independent document observation missing` }).toBe(1);
      expect(await page.evaluate(() => WebSocket.OPEN)).toBe(1);
    } finally {
      await context.close();
      await browser.close();
    }
  }, 30000);
}
