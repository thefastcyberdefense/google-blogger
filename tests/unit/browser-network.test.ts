import { expect, test } from 'vitest';
import { chromium, firefox, webkit } from '@playwright/test';
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
    await page.goto(`${FIXTURE_ORIGIN}/unexpected`).catch(() => undefined);
    await expect(guard.finish(), 'N1 positive local response verified; unexpected local request must be attributed at teardown').rejects.toThrow('N1_UNEXPECTED_REQUEST');
  } finally {
    await guard.context.close();
    await browser.close();
  }
}, 30000);

// Feasibility gate for independent public observation, not a connectivity test.
// A later page WebSocket route overrides the context route, entirely locally.
// Without an independent observation this could falsely report a zero-request
// guarded context. Do not replace this assertion with a route-handler counter.
for (const engine of [chromium, firefox, webkit]) {
  test(`N1 public observer detects page WebSocket override in ${engine.name()}`, async () => {
    const browser = await engine.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: 'block' });
    let contextRoutes = 0;
    let pageRoutes = 0;
    let observedWebSockets = 0;
    let observedHttp = 0;
    context.on('request', () => { observedHttp++; });
    context.on('page', page => page.on('websocket', () => { observedWebSockets++; }));
    try {
      await context.route('**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>local websocket control</h1>' }));
      await context.routeWebSocket('**/*', socket => {
        contextRoutes++;
        socket.onMessage(() => socket.send('context-local'));
      });
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
      await context.close();
      expect(pageRoutes).toBe(1);
      expect(contextRoutes).toBe(0);
      expect(observedHttp).toBe(1);
      expect(observedWebSockets, `N1_PUBLIC_OBSERVER_GAP ${engine.name()}: local exchange succeeded; pageRoutes=${pageRoutes}; contextRoutes=${contextRoutes}; HTTP=${observedHttp}; observedWebSockets=${observedWebSockets}`).toBe(1);
    } finally {
      await context.close();
      await browser.close();
    }
  }, 30000);
}
