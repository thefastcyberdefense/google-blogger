import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const qaRoot = path.resolve(__dirname, '..');
const checkoutDir = path.join(qaRoot, 'checkout');
const evidenceDir = path.join(qaRoot, 'evidence');
const require = createRequire(path.join(checkoutDir, 'package.json'));

const { chromium } = require('playwright-core');
const AxeBuilder = require('@axe-core/playwright').default || require('@axe-core/playwright');
const { assets, pug } = await import(new URL('../checkout/tools/generate.ts', import.meta.url).href);

const origin = 'https://blogs.fastcyberdefense.com';
const mermaidPrefix = 'https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/';
const commitSha = 'ecb1d438e8b3227911dc76359b9e05f127867b27';

async function readPreview(name) {
  return fs.readFile(path.join(checkoutDir, '.preview', `${name}.html`), 'utf8');
}

async function setupMockRoutes(context, viewMap, feedMode = 'normal') {
  await context.route('**/*', async (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.startsWith('data:') || reqUrl.startsWith('blob:') || reqUrl.startsWith('about:')) {
      return route.continue();
    }
    if (reqUrl.startsWith(mermaidPrefix)) {
      const rel = decodeURIComponent(new URL(reqUrl).pathname.split('/dist/')[1] || '');
      const base = path.join(checkoutDir, 'node_modules/mermaid/dist');
      const file = path.resolve(base, rel);
      if (!file.startsWith(base + path.sep) || !file.endsWith('.mjs')) return route.abort();
      const body = await fs.readFile(file);
      return route.fulfill({
        contentType: 'text/javascript',
        headers: { 'access-control-allow-origin': '*' },
        body
      });
    }
    const url = new URL(reqUrl);
    if (url.origin !== origin) return route.abort();
    if (url.pathname.startsWith('/feeds/')) {
      if (feedMode === 'error') return route.abort();
      const entries = [
        {
          id: { $t: '201' },
          title: { $t: 'Zero-trust network segmentation in hybrid clouds' },
          link: [{ rel: 'alternate', href: `${origin}/2026/09/zero-trust.html` }],
          category: [{ term: 'Cloud Security' }, { term: 'Research' }],
          published: { $t: '2026-09-09T12:00:00Z' }
        },
        {
          id: { $t: '202' },
          title: { $t: 'Incident containment playbooks for identity providers' },
          link: [{ rel: 'alternate', href: `${origin}/2026/09/incident-containment.html` }],
          category: [{ term: 'Research' }],
          published: { $t: '2026-09-08T12:00:00Z' }
        }
      ];
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ feed: { entry: entries } })
      });
    }
    const key = url.pathname.slice(1) || 'home';
    const html = viewMap[key] || viewMap.home;
    const status = key === 'error' || key === 'state-error' ? 404 : 200;
    return route.fulfill({ status, contentType: 'text/html; charset=utf-8', body: html });
  });
}

const compiled = await assets();
const techData = JSON.parse(await fs.readFile(path.join(checkoutDir, 'fixtures/technical-content.json'), 'utf8'));
const technicalHtml = pug.renderFile(path.join(checkoutDir, 'fixtures/technical-libraries.pug'), {
  ...compiled,
  data: techData
});
const twelveDiagramsHtml = pug.renderFile(path.join(checkoutDir, 'fixtures/technical-libraries.pug'), {
  ...compiled,
  data: {
    code: [],
    diagrams: Array.from({ length: 12 }, (_, i) => ({
      id: `d${i + 1}`,
      source: `flowchart TD\naccTitle: Diagram ${i + 1}\naccDescr: Description for diagram ${i + 1}\nA${i}-->B${i}`
    }))
  }
});

const viewNames = [
  'home',
  'article',
  'paged',
  'empty',
  'error',
  'label',
  'search',
  'archive',
  'state-error',
  'state-label',
  'state-search',
  'state-archive',
  'state-home',
  'state-generic'
];
const viewMap = { technical: technicalHtml, 'twelve-diagrams': twelveDiagramsHtml };
for (const name of viewNames) {
  viewMap[name] = await readPreview(name);
}

const browser = await chromium.launch();
const report = {
  commit: commitSha,
  timestampUtc: new Date().toISOString(),
  browserVersion: browser.version(),
  axeSummary: [],
  noJsAudits: [],
  keyboardAndFocus: [],
  tapTargets: [],
  contrastChecks: [],
  reflowAndZoom: [],
  resilienceChecks: {},
  performanceSamples: []
};

try {
  // 1. Representative screenshots + full Axe WCAG A/AA/2.2 scans across narrow/wide, light/dark, populated/empty/error, menu/search-open, and article states
  const matrixViews = ['home', 'article', 'paged', 'state-error', 'state-label', 'state-search', 'state-archive', 'state-home', 'state-generic', 'technical'];
  for (const width of [390, 1280]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme });
      await setupMockRoutes(context, viewMap);
      const page = await context.newPage();

      for (const view of matrixViews) {
        await page.goto(`${origin}/${view}`, { waitUntil: 'domcontentloaded' });
        if (view === 'technical') {
          await page.waitForSelector('.fcd-diagram[data-state="rendered"]', { timeout: 30000 });
        } else {
          await page.waitForTimeout(150);
        }
        const axeResult = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const axeFile = `axe-${view}-${width}-${colorScheme}.json`;
        await fs.writeFile(path.join(evidenceDir, 'axe', axeFile), JSON.stringify(axeResult, null, 2), 'utf8');
        report.axeSummary.push({
          view,
          width,
          colorScheme,
          state: 'initial',
          axeVersion: axeResult.testEngine?.version,
          violationsCount: axeResult.violations.length,
          incompleteCount: axeResult.incomplete.length,
          passesCount: axeResult.passes.length,
          violations: axeResult.violations,
          incompleteIds: axeResult.incomplete.map((i) => i.id),
          evidenceFile: `evidence/axe/${axeFile}`
        });

        if (['home', 'article', 'state-error', 'state-search', 'technical'].includes(view)) {
          const shotName = `${view}-${width}-${colorScheme}.png`;
          await page.screenshot({ path: path.join(evidenceDir, 'screenshots', shotName), fullPage: true });
        }

        if (view === 'home' || view === 'article') {
          if (width < 640 && (await page.locator('#menu-toggle').isVisible())) {
            await page.locator('#menu-toggle').click();
          }
          if (view === 'home') {
            await page.locator('#search-query').fill('incident');
          }
          if (view === 'article' && (await page.locator('.article-toc summary').count()) > 0) {
            await page.locator('.article-toc summary').click();
          }
          const expAxe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();
          const expAxeFile = `axe-${view}-expanded-${width}-${colorScheme}.json`;
          await fs.writeFile(path.join(evidenceDir, 'axe', expAxeFile), JSON.stringify(expAxe, null, 2), 'utf8');
          report.axeSummary.push({
            view,
            width,
            colorScheme,
            state: 'expanded',
            axeVersion: expAxe.testEngine?.version,
            violationsCount: expAxe.violations.length,
            incompleteCount: expAxe.incomplete.length,
            passesCount: expAxe.passes.length,
            violations: expAxe.violations,
            incompleteIds: expAxe.incomplete.map((i) => i.id),
            evidenceFile: `evidence/axe/${expAxeFile}`
          });
          const expShot = `${view}-expanded-${width}-${colorScheme}.png`;
          await page.screenshot({ path: path.join(evidenceDir, 'screenshots', expShot), fullPage: true });
        }
      }
      await context.close();
    }
  }

  // 2. No-JS DOM & Accessibility Structural Audit
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
      colorScheme: 'light'
    });
    await setupMockRoutes(context, viewMap);
    const page = await context.newPage();
    for (const view of ['home', 'article', 'paged', 'state-error', 'state-label', 'state-search', 'state-archive', 'state-home', 'state-generic']) {
      await page.goto(`${origin}/${view}`, { waitUntil: 'domcontentloaded' });
      const audit = await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll('[id]'), (el) => el.id);
        const duplicateIds = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'), (h) => ({
          level: Number(h.tagName.slice(1)),
          text: (h.textContent || '').trim()
        }));
        let headingOrderValid = headings.some((h) => h.level === 1);
        for (let i = 1; i < headings.length; i++) {
          if (headings[i].level - headings[i - 1].level > 1) headingOrderValid = false;
        }
        const jsControlsHidden = Array.from(document.querySelectorAll('.js-control,#reading-time')).every(
          (el) => getComputedStyle(el).display === 'none'
        );
        const inputs = Array.from(document.querySelectorAll('input,select,textarea'));
        const allInputsLabeled = inputs.every((inp) => {
          const id = inp.id;
          return (id && !!document.querySelector(`label[for="${CSS.escape(id)}"]`)) || inp.hasAttribute('aria-label');
        });
        const navVisible = getComputedStyle(document.getElementById('primary-navigation')).display !== 'none';
        const landmarks = {
          banner: document.querySelectorAll('header.site-header').length === 1,
          main: document.querySelectorAll('main#content').length === 1,
          primaryNav: document.querySelectorAll('nav#primary-navigation[aria-label="Primary"]').length === 1,
          sidebar: document.querySelectorAll('aside.sidebar[aria-label="Publication sidebar"]').length === 1,
          contentinfo: document.querySelectorAll('footer.site-footer').length === 1
        };
        const noOverflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
        return {
          duplicateIds,
          h1Count: headings.filter((h) => h.level === 1).length,
          headingOrderValid,
          headings,
          jsControlsHidden,
          allInputsLabeled,
          navVisible,
          landmarks,
          noOverflow
        };
      });
      report.noJsAudits.push({ view, width, ...audit });
    }
    await context.close();
  }

  // 3. Keyboard Order, Focus Visibility/Unobscured, Shortcuts, Tap Targets & Contrast
  for (const width of [390, 1280]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme });
      await setupMockRoutes(context, viewMap);
      const page = await context.newPage();
      await page.goto(`${origin}/article`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(150);

      const focusSteps = [];
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const step = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const cx = Math.min(Math.max(rect.left + rect.width / 2, 1), window.innerWidth - 1);
          const cy = Math.min(Math.max(rect.top + rect.height / 2, 1), window.innerHeight - 1);
          const topEl = rect.width > 0 && rect.height > 0 ? document.elementFromPoint(cx, cy) : null;
          const unobscured = !topEl || el.contains(topEl) || topEl.contains(el);
          return {
            tag: el.tagName,
            id: el.id || null,
            className: el.className || null,
            text: (el.textContent || '').trim().slice(0, 50),
            ariaLabel: el.getAttribute('aria-label'),
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
            unobscured
          };
        });
        if (step) focusSteps.push(step);
      }
      report.keyboardAndFocus.push({ view: 'article', width, colorScheme, focusSteps });

      for (const view of ['home', 'article']) {
        await page.goto(`${origin}/${view}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100);
        if (width < 640 && (await page.locator('#menu-toggle').isVisible())) {
          await page.locator('#menu-toggle').click();
        }
        const targets = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('button, input, a.topic-pill, .footer-grid nav a, .primary-navigation > a, .post-labels a, .pagination a, summary'))
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
            })
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                selector: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className ? `.${String(el.className).trim().replace(/\s+/g, '.')}` : ''),
                text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
                width: Math.round(r.width * 10) / 10,
                height: Math.round(r.height * 10) / 10,
                meets24pxAA: r.width >= 24 && r.height >= 24,
                meets44pxTouch: r.height >= 44 || r.width >= 44
              };
            });
        });
        report.tapTargets.push({ view, width, colorScheme, targets });
      }

      const contrast = await page.evaluate(() => {
        function parseRgb(str) {
          const c = document.createElement('canvas');
          c.width = c.height = 1;
          const ctx = c.getContext('2d');
          ctx.fillStyle = str;
          ctx.fillRect(0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          return [r, g, b];
        }
        function lum([r, g, b]) {
          const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }
        function ratio(fg, bg) {
          const l1 = lum(parseRgb(fg));
          const l2 = lum(parseRgb(bg));
          const brightest = Math.max(l1, l2);
          const darkest = Math.min(l1, l2);
          return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 100) / 100;
        }
        const cs = getComputedStyle(document.documentElement);
        const v = (name) => cs.getPropertyValue(name).trim();
        return {
          textOnBackground: ratio(v('--text'), v('--background')),
          textOnSurface: ratio(v('--text'), v('--surface')),
          mutedOnBackground: ratio(v('--muted-text'), v('--background')),
          mutedOnSurface: ratio(v('--muted-text'), v('--surface')),
          primaryOnBackground: ratio(v('--primary'), v('--background')),
          primaryOnSurface: ratio(v('--primary'), v('--surface')),
          primaryOnMutedSurface: ratio(v('--primary'), v('--muted-surface')),
          focusOnSurface: ratio(v('--focus'), v('--surface')),
          successOnCode: ratio(v('--success'), v('--code'))
        };
      });
      report.contrastChecks.push({ width, colorScheme, ...contrast });
      await context.close();
    }
  }

  // 4. 200% Text Enlargement, WCAG 1.4.12 Text Spacing, and Page Scale / Reflow Checks
  for (const width of [320, 1280]) {
    for (const javaScriptEnabled of [true, false]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: { width, height: 900 } });
      await setupMockRoutes(context, viewMap);
      const page = await context.newPage();
      for (const view of ['home', 'article', 'state-search']) {
        const rawHtml = viewMap[view];
        const spacedHtml = rawHtml.replace(
          '</head>',
          '<style>html{font-size:200%}*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}</style></head>'
        );
        await page.route(`${origin}/spaced-${view}`, (r) =>
          r.fulfill({ contentType: 'text/html; charset=utf-8', body: spacedHtml })
        );
        await page.goto(`${origin}/spaced-${view}`, { waitUntil: 'domcontentloaded' });
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          fitsHorizontally: document.documentElement.scrollWidth <= window.innerWidth + 1
        }));
        report.reflowAndZoom.push({ view, width, javaScriptEnabled, mode: '200%-font-plus-wcag1412-spacing', ...metrics });
      }
      await context.close();
    }
  }

  // 5. Interaction & Diagram Resilience (editable shortcut ignore, >10 diagrams opt-in cap, SVG sanitization)
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await setupMockRoutes(context, viewMap);
    const page = await context.newPage();

    await page.goto(`${origin}/state-search`, { waitUntil: 'domcontentloaded' });
    const recoveryInput = page.locator('#empty-state-query-search');
    await recoveryInput.focus();
    await page.keyboard.press('/');
    const recoveryValAfterSlash = await recoveryInput.inputValue();
    const stillFocusedRecovery = await recoveryInput.evaluate((el) => document.activeElement === el);

    await page.goto(`${origin}/twelve-diagrams`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => document.querySelectorAll('.fcd-diagram[data-state="rendered"]').length === 10,
      null,
      { timeout: 30000 }
    );
    const diagramStates = await page.locator('.fcd-diagram').evaluateAll((els) =>
      els.map((el, idx) => ({
        domIndex: idx,
        state: el.getAttribute('data-state'),
        status: el.querySelector('.diagram-status')?.textContent || ''
      }))
    );
    await page.locator('.fcd-diagram[data-state="source"]').first().getByRole('button', { name: 'Render diagram' }).click();
    await page.waitForFunction(
      () => document.querySelectorAll('.fcd-diagram[data-state="rendered"]').length === 11,
      null,
      { timeout: 30000 }
    );
    const afterOptInCount = await page.locator('.fcd-diagram[data-state="rendered"]').count();

    report.resilienceChecks = {
      shortcutIgnoredInOtherInput: {
        recoveryValAfterSlash,
        stillFocusedRecovery
      },
      twelveDiagramsCap: {
        initialRenderedCount: diagramStates.filter((d) => d.state === 'rendered').length,
        initialDeferredCount: diagramStates.filter((d) => d.state === 'source').length,
        deferredDomIndices: diagramStates.filter((d) => d.state === 'source').map((d) => d.domIndex),
        deferredMessage: diagramStates.find((d) => d.state === 'source')?.status,
        afterOptInRenderedCount: afterOptInCount
      }
    };
    await context.close();
  }

  // 6. Multi-sample Cold & Warm Performance Measurements (390px & 1280px, home & article)
  for (const width of [390, 1280]) {
    for (const view of ['home', 'article']) {
      const coldSamples = [];
      const warmSamples = [];
      for (let i = 0; i < 3; i++) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } });
        await setupMockRoutes(ctx, viewMap);
        const p = await ctx.newPage();
        await p.addInitScript(() => {
          window.__qaPerf = { longTasks: [], shifts: [] };
          if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
            new PerformanceObserver((l) => window.__qaPerf.longTasks.push(...l.getEntries().map((e) => e.duration))).observe({
              type: 'longtask',
              buffered: true
            });
          }
          if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
            new PerformanceObserver((l) =>
              window.__qaPerf.shifts.push(
                ...l.getEntries().map((e) => ({ value: e.value, hadRecentInput: e.hadRecentInput }))
              )
            ).observe({ type: 'layout-shift', buffered: true });
          }
        });

        await p.goto(`${origin}/${view}`, { waitUntil: 'load' });
        await p.waitForTimeout(100);
        const cold = await p.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const res = performance.getEntriesByType('resource');
          return {
            domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd * 100) / 100,
            loadEventEndMs: Math.round(nav.loadEventEnd * 100) / 100,
            resourceCount: res.length,
            longTaskCount: window.__qaPerf.longTasks.length,
            maxLongTaskMs: window.__qaPerf.longTasks.length ? Math.max(...window.__qaPerf.longTasks) : 0,
            clsSum: window.__qaPerf.shifts.filter((s) => !s.hadRecentInput).reduce((a, b) => a + b.value, 0)
          };
        });
        coldSamples.push(cold);

        await p.reload({ waitUntil: 'load' });
        await p.waitForTimeout(100);
        const warm = await p.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const res = performance.getEntriesByType('resource');
          return {
            domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd * 100) / 100,
            loadEventEndMs: Math.round(nav.loadEventEnd * 100) / 100,
            resourceCount: res.length,
            longTaskCount: window.__qaPerf.longTasks.length,
            maxLongTaskMs: window.__qaPerf.longTasks.length ? Math.max(...window.__qaPerf.longTasks) : 0,
            clsSum: window.__qaPerf.shifts.filter((s) => !s.hadRecentInput).reduce((a, b) => a + b.value, 0)
          };
        });
        warmSamples.push(warm);
        await ctx.close();
      }
      report.performanceSamples.push({
        view,
        width,
        conditions: 'Local intercepted fixtures on Chromium 151.0.7922.34, Windows 10.0.26200 AMD64, no CPU/network throttling (synthetic lab sample, not production field p75 CLS/INP)',
        coldSamples,
        warmSamples
      });
    }
  }
} finally {
  await browser.close();
}

await fs.writeFile(
  path.join(evidenceDir, 'supplemental', 'deep-qa-report.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);
console.log('Supplemental deep QA completed successfully.');
