// US-L5: Ledger's client script is ported with four risks FCD closes before any
// upload. Each case runs the real src/scripts/main.ts (bundled by esbuild) in
// Chromium against a routed fixture origin; nothing leaves the test.
//   1. Cached HTML restore: Ledger writes the Recent Posts markup to
//      localStorage and later restores it with innerHTML.
//   2. Feed-derived links and thumbnails are interpolated into innerHTML
//      templates unescaped, so a hostile URL can break out of the attribute
//      or carry a javascript: scheme.
//   3. The homepage catalog walks the whole feed with no page cap.
//   4. Mermaid is initialized with securityLevel 'loose'.
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ORIGIN = 'https://fcd.test';
const CATALOG_PAGE_CAP = 10;

let browser: Browser;
let bundle = '';

beforeAll(async () => {
  const out = await build({
    entryPoints: [fileURLToPath(new URL('../../src/scripts/main.ts', import.meta.url))],
    bundle: true,
    format: 'iife',
    globalName: 'FCD',
    target: 'es2022',
    write: false,
    logLevel: 'silent'
  });
  bundle = out.outputFiles[0]?.text ?? '';
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

type FeedEntry = Record<string, unknown>;

function entry(title: string, href: string, extra: FeedEntry = {}): FeedEntry {
  return {
    id: { $t: 'tag:fcd.test,post-' + title },
    title: { $t: title },
    link: [{ rel: 'alternate', href }],
    published: { $t: '2026-10-01T10:00:00Z' },
    category: [{ term: 'Threat Intel' }],
    summary: { $t: 'Summary of ' + title },
    author: [{ name: { $t: 'FCD Research' } }],
    ...extra
  };
}

const HOSTILE: FeedEntry[] = [
  entry('Safe post', ORIGIN + '/2026/10/safe-post.html'),
  entry('Script scheme post', 'javascript:window.__fcdPwned=1'),
  entry('Attribute break post', ORIGIN + '/2026/10/x.html" onmouseover="window.__fcdPwned=1" data-x="'),
  entry('Thumbnail break post', ORIGIN + '/2026/10/thumb.html', { media$thumbnail: { url: 'https://img.fcd.test/a.png" onerror="window.__fcdPwned=1' } })
];

async function open(body: string, feed: (url: URL) => unknown, before = ''): Promise<{ page: Page; requests: URL[] }> {
  const page = await browser.newPage();
  const requests: URL[] = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (url.origin !== ORIGIN) return route.abort();
    if (url.pathname === '/') {
      return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><script>${before}</script></head><body>${body}</body></html>` });
    }
    if (url.pathname === '/fcd.js') return route.fulfill({ contentType: 'text/javascript', body: bundle });
    if (url.pathname.startsWith('/feeds/')) return route.fulfill({ contentType: 'application/json', body: JSON.stringify(feed(url)) });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto(ORIGIN + '/');
  await page.addScriptTag({ url: ORIGIN + '/fcd.js' });
  return { page, requests };
}

// Anchors and images under a root, and whether any element grew an event handler attribute.
async function audit(page: Page, root: string): Promise<{ hrefs: string[]; srcs: string[]; handlers: string[]; pwned: unknown }> {
  return page.evaluate((sel) => {
    const scope = document.querySelector(sel);
    const all: Element[] = scope ? [scope, ...Array.from(scope.querySelectorAll('*'))] : [];
    return {
      hrefs: all.filter((el) => el instanceof HTMLAnchorElement).map((a) => a.getAttribute('href') ?? ''),
      srcs: all.filter((el) => el instanceof HTMLImageElement).map((img) => img.getAttribute('src') ?? ''),
      handlers: all.flatMap((el) => Array.from(el.attributes).filter((a) => /^on/i.test(a.name)).map((a) => `${el.tagName.toLowerCase()} ${a.name}`)),
      pwned: (window as unknown as { __fcdPwned?: unknown }).__fcdPwned
    };
  }, root);
}

const safeUrl = (u: string): boolean => {
  try {
    return ['http:', 'https:'].includes(new URL(u, ORIGIN).protocol);
  } catch {
    return false;
  }
};

describe('Recent Posts', () => {
  it('never restores cached HTML from localStorage into the page', async () => {
    const poison = '<article class="sidebar-recent-item"><img src="x" onerror="window.__fcdPwned=1"><span class="sidebar-recent-tag">x</span></article>';
    const { page } = await open('<div class="sidebar-recent-list"></div>', () => ({ feed: { entry: [] } }), `localStorage.setItem('ledger_recent_posts_v1', ${JSON.stringify(poison)});`);
    await page.evaluate(() => (window as unknown as { FCD: { initSidebarRecentPosts(): void } }).FCD.initSidebarRecentPosts());
    await page.waitForTimeout(400);
    const result = await audit(page, '.sidebar-recent-list');
    expect(result.srcs, 'cached markup restored into the list').toEqual([]);
    expect(result.handlers).toEqual([]);
    expect(result.pwned).toBeUndefined();
    await page.close();
  }, 30_000);

  it('renders feed entries with safe DOM and only http(s) links', async () => {
    const { page } = await open('<div class="sidebar-recent-list"></div>', () => ({ feed: { entry: HOSTILE } }));
    await page.evaluate(() => (window as unknown as { FCD: { initSidebarRecentPosts(): void } }).FCD.initSidebarRecentPosts());
    await page.waitForSelector('.sidebar-recent-list .sidebar-recent-title', { timeout: 5000 });
    const result = await audit(page, '.sidebar-recent-list');
    expect(result.handlers, 'event handler attributes injected from the feed').toEqual([]);
    expect(result.hrefs.filter((h) => !safeUrl(h)), 'non-http(s) links from the feed').toEqual([]);
    expect(result.hrefs).toContain(ORIGIN + '/2026/10/safe-post.html');
    expect(result.pwned).toBeUndefined();
    await page.close();
  }, 30_000);
});

describe('Live search', () => {
  it('renders results with safe DOM and only http(s) links', async () => {
    const { page } = await open('<div class="header-search-wrap"><input class="header-search-input" aria-label="Search"><div class="search-results-dropdown"></div></div>', () => ({ feed: { entry: HOSTILE } }));
    await page.evaluate(() => (window as unknown as { FCD: { initLiveSearch(): void } }).FCD.initLiveSearch());
    await page.fill('.header-search-input', 'post');
    await page.waitForSelector('.search-results-dropdown .search-result-title', { timeout: 5000 });
    const result = await audit(page, '.search-results-dropdown');
    expect(result.handlers, 'event handler attributes injected from the feed').toEqual([]);
    expect(result.hrefs.filter((h) => !safeUrl(h)), 'non-http(s) links from the feed').toEqual([]);
    expect(result.hrefs).toContain(ORIGIN + '/2026/10/safe-post.html');
    expect(result.pwned).toBeUndefined();
    await page.close();
  }, 30_000);
});

describe('Homepage catalog', () => {
  const CATALOG = '<div id="posts-filter-bar"><input id="catalog-search" aria-label="Filter"></div><div class="blog-posts"></div>';

  it(`stops walking the feed after ${CATALOG_PAGE_CAP} pages`, async () => {
    const endless = (url: URL) => {
      const start = Number(url.searchParams.get('start-index') || '1');
      return { feed: { openSearch$totalResults: { $t: '1000000' }, entry: Array.from({ length: 50 }, (_, i) => entry('Post ' + (start + i), ORIGIN + '/p/' + (start + i) + '.html')) } };
    };
    const { page, requests } = await open(CATALOG, endless);
    await page.evaluate(() => (window as unknown as { FCD: { initHomepageCatalog(): void } }).FCD.initHomepageCatalog());
    await page.waitForTimeout(3000);
    const feedPages = requests.filter((u) => u.pathname === '/feeds/posts/default').length;
    expect(feedPages, 'catalog feed pages fetched').toBeGreaterThan(0);
    expect(feedPages, 'catalog feed pages fetched').toBeLessThanOrEqual(CATALOG_PAGE_CAP);
    await page.close();
  }, 30_000);

  it('renders cards with safe DOM, only http(s) links and escaped thumbnails', async () => {
    const { page } = await open(CATALOG, () => ({ feed: { openSearch$totalResults: { $t: String(HOSTILE.length) }, entry: HOSTILE } }));
    await page.evaluate(() => (window as unknown as { FCD: { initHomepageCatalog(): void } }).FCD.initHomepageCatalog());
    await page.waitForTimeout(500);
    await page.fill('#catalog-search', 'post');
    await page.waitForSelector('.blog-posts .post-title a', { timeout: 5000 });
    const result = await audit(page, '.blog-posts');
    expect(result.handlers, 'event handler attributes injected from the feed').toEqual([]);
    expect(result.hrefs.filter((h) => !safeUrl(h)), 'non-http(s) links from the feed').toEqual([]);
    expect(result.srcs.filter((s) => !safeUrl(s) || s.includes('"')), 'unsafe thumbnail sources').toEqual([]);
    expect(result.hrefs).toContain(ORIGIN + '/2026/10/safe-post.html');
    expect(result.pwned).toBeUndefined();
    await page.close();
  }, 30_000);
});

describe('Mermaid', () => {
  it("initializes Mermaid with securityLevel 'strict'", async () => {
    const stub = 'window.__mermaidConfigs = []; window.mermaid = { initialize: (c) => window.__mermaidConfigs.push(c), run: async () => {} };';
    const { page } = await open('<div class="post-body"><div class="mermaid-diagram-wrap"><pre class="mermaid">graph TD\n  A --> B</pre></div></div>', () => ({}), stub);
    await page.evaluate(() => (window as unknown as { FCD: { initMermaidDiagrams(t?: string): void } }).FCD.initMermaidDiagrams('default'));
    await page.waitForFunction(() => (window as unknown as { __mermaidConfigs: unknown[] }).__mermaidConfigs.length > 0, undefined, { timeout: 5000 });
    const levels = await page.evaluate(() => (window as unknown as { __mermaidConfigs: Array<{ securityLevel?: string }> }).__mermaidConfigs.map((c) => c.securityLevel));
    expect(levels).toEqual(['strict']);
    await page.close();
  }, 30_000);
});
