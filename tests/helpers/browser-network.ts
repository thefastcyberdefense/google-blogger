import type { Browser, BrowserContext } from '@playwright/test';

export const FIXTURE_ORIGIN = 'https://fcd-fixture.invalid';
export interface FixtureRule {
  id: string;
  path: string;
  method: string;
  resource: string;
  body: string;
}
export interface GuardedContext {
  context: BrowserContext;
  finish(): Promise<void>;
}

/** Test-first checkpoint: local-only responses, deliberately no attribution yet.
 * N0 remains mandatory. This is not the accepted N1 implementation.
 */
export async function createGuardedContext(browser: Browser, rules: FixtureRule[]): Promise<GuardedContext> {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const rule = rules.find(item => url.origin === FIXTURE_ORIGIN && url.pathname === item.path);
    await route.fulfill({ status: 200, contentType: 'text/html', body: rule?.body ?? 'unattributed local checkpoint' });
  });
  return { context, async finish() { await context.close(); } };
}

/** Approved feasibility experiment, not production guard or worker coverage.
 * Uses public APIs only. Reports count, not URLs, credentials or payloads.
 * Call after context routing, before pages. Init-script ordering is deliberately
 * tested, not assumed guaranteed by the Playwright API.
 */
export async function observeDocumentWebSockets(context: BrowserContext): Promise<{ count(): number }> {
  let attempts = 0;
  await context.exposeBinding('__fcdN1WebSocketAttempt', () => {
    attempts++;
    if (attempts > 64) throw new Error('N1_OBSERVATION_LIMIT');
  });
  await context.addInitScript(() => {
    const Original = globalThis.WebSocket;
    const report = (globalThis as unknown as { __fcdN1WebSocketAttempt: () => Promise<void> }).__fcdN1WebSocketAttempt;
    const Wrapped = new Proxy(Original, {
      construct(target, args, newTarget) {
        // No URL conversion or message access: preserve constructor behavior.
        // A failed binding remains an unhandled failure, not a swallowed success.
        void report();
        return Reflect.construct(target, args, newTarget);
      },
    });
    globalThis.WebSocket = Wrapped;
  });
  return { count: () => attempts };
}
