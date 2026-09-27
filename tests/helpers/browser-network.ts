import type { Browser, BrowserContext, BrowserContextOptions } from '@playwright/test';

export const FIXTURE_ORIGIN = 'https://fcd-fixture.invalid';
export interface FixtureRule {
  id: string;
  path: string;
  method: string;
  resource: string;
  body?: string;
  action?: 'fulfill' | 'deny';
  count?: number;
  query?: string;
  status?: number;
  headers?: Record<string, string>;
}
export interface GuardedContext {
  context: BrowserContext;
  finish(): Promise<void>;
}

/** Runnable test-first policy placeholders. N0 remains mandatory. */
export function validateFixtureRules(_rules: FixtureRule[]): void {}
export function validateContextOptions(_options: BrowserContextOptions): void {}

/** Local-only checkpoint; deliberately lacks policy attribution. */
export async function createGuardedContext(browser: Browser, rules: FixtureRule[]): Promise<GuardedContext> {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const rule = rules.find(item => url.origin === FIXTURE_ORIGIN && url.pathname === item.path);
    await route.fulfill({ status: 200, contentType: 'text/html', body: rule?.body ?? 'unattributed local checkpoint' });
  });
  return { context, async finish() { await context.close(); } };
}

/** Public-API observation experiment. Final lifecycle attribution pending. */
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
        void report();
        return Reflect.construct(target, args, newTarget);
      },
    });
    globalThis.WebSocket = Wrapped;
  });
  return { count: () => attempts };
}
