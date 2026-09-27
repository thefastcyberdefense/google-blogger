import { expect, test } from 'vitest';
import { chromium, firefox, webkit } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createGuardedContext, FIXTURE_ORIGIN, observeDocumentWebSockets, validateFixtureRules, validateContextOptions, type FixtureRule } from '../helpers/browser-network.ts';
import { validateSnapshot } from '../../tools/finalize-browser-network.ts';

// Preserve the original positive control and owning-test HTTP-attribution red.
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

// Native-event blind spot is still independently characterized in every engine.
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
      expect(nativeObserved).toBe(0);
      await expect.poll(() => observer.count(), { timeout: 3000, message: `N1_PUBLIC_OBSERVER_GAP ${engine.name()}` }).toBe(1);
      expect(await page.evaluate(() => WebSocket.OPEN)).toBe(1);
    } finally {
      await context.close();
      await browser.close();
    }
  }, 30000);
}

const localRule: FixtureRule = { id: 'home', path: '/', method: 'GET', resource: 'document', body: '<h1>local</h1>' };
test('N1 accepts a precise local positive policy', () => expect(() => validateFixtureRules([localRule])).not.toThrow());
for (const [name, rule] of [
  ['wildcard path', { ...localRule, path: '/**' }],
  ['redirect status', { ...localRule, status: 302 }],
  ['redirect header', { ...localRule, headers: { location: 'https://elsewhere.invalid/' } }],
  ['denial without exact count', { ...localRule, action: 'deny' as const }],
  ['unbounded count', { ...localRule, action: 'deny' as const, count: 1000000 }],
  ['invalid method', { ...localRule, method: '*' }],
] as const) {
  test(`N1 rejects ${name}`, () => expect(() => validateFixtureRules([rule])).toThrow('N1_POLICY'));
}
test('N1 rejects duplicate policy identities', () => expect(() => validateFixtureRules([localRule, localRule])).toThrow('N1_POLICY'));
test('N1 rejects service-worker override', () => expect(() => validateContextOptions({ serviceWorkers: 'allow' })).toThrow('N1_OPTIONS'));
test('N1 rejects caller proxy', () => expect(() => validateContextOptions({ proxy: { server: 'http://127.0.0.1:1' } })).toThrow('N1_OPTIONS'));

test('N1 rejects absent evidence rather than publishing acceptance', () => expect(validateSnapshot({})).toContain('N1_MISSING_MANIFEST'));
test('N1 rejects unsupported manifest schema', () => expect(validateSnapshot({ manifest: { schema: 999 } })).toContain('N1_MANIFEST'));
test('N1 rejects zero scoped discovery', () => expect(validateSnapshot({ manifest: { schema: 1, policy: 'n1-v1', source: 'a'.repeat(40), run: '1', attempt: '1', kind: 'manifest' }, records: [], discovery: { tests: [] } })).toContain('N1_DISCOVERY'));
test('N1 CLI has a real nonzero missing-evidence path', () => {
  const cli = fileURLToPath(new URL('../../tools/finalize-browser-network.ts', import.meta.url));
  const result = spawnSync(process.execPath, [cli, 'finalize', '/nonexistent-fcd-evidence'], { encoding: 'utf8', timeout: 10000 });
  expect(result.error).toBeUndefined();
  expect(result.status, 'N1_FINALIZER_FALSE_GREEN').toBe(1);
  expect(result.stderr).toContain('N1_');
});
