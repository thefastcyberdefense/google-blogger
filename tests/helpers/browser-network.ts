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
