import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Browser HTML parsing with page scripts and all resource requests disabled. Not a full staging suite. */
export async function inspectDeploymentHtml(html: string, expected: string, base: string): Promise<void> {
  if (Buffer.byteLength(html) > 2000000) throw new Error('Staging HTML exceeds inspection budget');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block' });
    await context.route('**/*', route => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const result = await page.evaluate(({ expected, base }) => {
      const stamps = document.querySelectorAll('head meta[name="theme-build"]');
      if (stamps.length !== 1 || stamps[0].getAttribute('content') !== expected) return 'STALE: exact unique theme-build metadata not found';
      const visible = (el: Element | null): el is HTMLElement => {
        if (!(el instanceof HTMLElement) || el.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
        for (let parent: HTMLElement | null = el; parent; parent = parent.parentElement) {
          const css = getComputedStyle(parent);
          if (css.display === 'none' || css.visibility === 'hidden' || css.visibility === 'collapse' || Number(css.opacity) === 0) return false;
        }
        return el.getClientRects().length > 0;
      };
      const text = (el: Element | null) => {
        if (!el) return '';
        const copy = el.cloneNode(true) as Element;
        copy.querySelectorAll('style,script,template,noscript').forEach(node => node.remove());
        return (copy.textContent || '').trim();
      };
      const main = document.querySelector('main#content');
      if (!visible(main)) return 'No visible main content landmark';
      if (document.querySelector('input[type="password"]')) return 'Authentication page is not a publication';
      const body = main.querySelector('article.article-view #article-body');
      const heading = main.querySelector('article.article-view h1.post-title');
      if (body) return visible(body) && text(body) && visible(heading) && text(heading) ? '' : 'Article body or title is empty/hidden';
      const links = Array.from(main.querySelectorAll('article.post-card h2.post-title a[href]'));
      const usable = links.some(link => {
        if (!visible(link) || !text(link)) return false;
        try {
          const href = link.getAttribute('href') || '';
          const url = new URL(href, base);
          return !href.startsWith('#') && url.protocol === 'https:' && url.origin === new URL(base).origin && !url.username && !url.password && url.pathname !== '/';
        } catch { return false; }
      });
      return usable ? '' : 'No visible populated catalog articles with usable same-origin links; empty staging requires seeding, not a passing render claim';
    }, { expected, base });
    if (result) throw new Error(result);
  } finally { await browser.close(); }
}

export async function checkDeployment(): Promise<void> {
  const url = process.env.STAGING_URL;
  const expected = process.env.EXPECTED_THEME_BUILD;
  if (!url || !expected) throw new Error('BLOCKED: STAGING_URL and EXPECTED_THEME_BUILD are required');
  if (!/^0\.1\.0\+[a-f0-9]{40}$/i.test(expected)) throw new Error('Expected build must contain the complete source SHA');
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.username || target.password) throw new Error('Credential-free HTTPS staging URL required');
  const response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
  if (!response.ok || response.redirected || response.status >= 300 || response.url && new URL(response.url).href !== target.href) throw new Error(`Unexpected staging response/destination: HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > 2000000) throw new Error('Staging response too large');
  const reader = response.body?.getReader(); if (!reader) throw new Error('Staging returned no body');
  const chunks: Uint8Array[] = []; let total = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    total += value.length;
    if (total > 2000000) { await reader.cancel(); throw new Error('Staging response too large'); }
    chunks.push(value);
  }
  await inspectDeploymentHtml(Buffer.concat(chunks).toString('utf8'), expected, target.href);
  console.log('PASS: exact build stamp and visible populated publication DOM. Full Blogger import/page-type/a11y acceptance is still a separate gate.');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await checkDeployment(); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
}
