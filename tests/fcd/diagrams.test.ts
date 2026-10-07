// US-L10: the fourth test-blog upload (build accb4d9, 2026-10-07) showed three
// faults on the article page:
//   1. After a theme switch every diagram turned into the "Source View" card
//      with Mermaid's own CSS as its text. The redraw read the drawn diagram
//      (an svg whose style text is longer than the source) instead of the
//      source kept on the wrap, and a standalone pre.mermaid lost its source.
//   2. Light diagrams used Mermaid's stock lavender and yellow: the 'default'
//      and 'dark' themes ignore most themeVariables. Only 'base' takes them, so
//      both modes now draw with 'base' and the tweakcn colours.
//   3. In dark mode every callout bar was the primary blue: a dark rule for all
//      blockquotes overrode the five semantic colours.
// The built theme script runs over the static post view (tests/fcd/blogger-static.ts)
// with a Mermaid stand-in that behaves like Mermaid 11 for these cases: it skips
// nodes marked data-processed, replaces the node with an svg that begins with
// a long style block, and draws an error svg when the text is not a diagram.
// Every request is blocked.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseXml, renderTheme } from './blogger-static.ts';
import { siteExact } from './site-exact.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const tree = parseXml(xml);
const SKIN = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';
const THEME_SCRIPT = [...xml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1] ?? '').find((s) => s.includes('mermaid-diagram-wrap')) ?? '';

type Rgba = [number, number, number, number];

// The tweakcn theme of fastcyberdefense.com, as Mermaid 'base' variables.
const FONT = 'Inter';
const LIGHT: Record<string, string | boolean> = {
  darkMode: false,
  background: '#ffffff',
  primaryColor: '#e3f2fa',
  mainBkg: '#e3f2fa',
  primaryTextColor: '#1d2b4d',
  textColor: '#1d2b4d',
  titleColor: '#1d2b4d',
  noteTextColor: '#1d2b4d',
  primaryBorderColor: '#3d8fe1',
  nodeBorder: '#3d8fe1',
  secondaryColor: '#f0f8fc',
  tertiaryColor: '#f0f8fc',
  clusterBkg: '#f0f8fc',
  noteBkgColor: '#f0f8fc',
  clusterBorder: '#d9e5ee',
  noteBorderColor: '#d9e5ee',
  lineColor: '#6e7b9d',
  actorLineColor: '#6e7b9d',
  edgeLabelBackground: '#ffffff'
};
const DARK: Record<string, string | boolean> = {
  darkMode: true,
  background: '#0e1428',
  primaryColor: '#2a4a6d',
  mainBkg: '#2a4a6d',
  primaryTextColor: '#e2e8f0',
  textColor: '#e2e8f0',
  titleColor: '#e2e8f0',
  noteTextColor: '#e2e8f0',
  primaryBorderColor: '#3d8fe1',
  nodeBorder: '#3d8fe1',
  secondaryColor: '#171f36',
  tertiaryColor: '#171f36',
  clusterBkg: '#171f36',
  noteBkgColor: '#171f36',
  clusterBorder: '#2d3748',
  noteBorderColor: '#2d3748',
  lineColor: '#3d8fe1',
  actorLineColor: '#3d8fe1',
  edgeLabelBackground: '#0e1428'
};

const FLOW = 'flowchart LR\n  A[Request] --&gt; B[Gateway]\n  B --&gt; C[Service]';
const SEQUENCE = 'sequenceDiagram\n  participant C as Client\n  participant S as Server\n  C-&gt;&gt;S: Hello';
const TYPES = ['note', 'tip', 'important', 'warning', 'caution'] as const;
const FIXTURE =
  `<div class="mermaid-diagram-wrap"><pre class="mermaid">${FLOW}</pre></div>` +
  `<p>Between the diagrams.</p><pre class="mermaid">${SEQUENCE}</pre>` +
  TYPES.map((t) => `<blockquote><p>[!${t.toUpperCase()}] A ${t} callout with body text.</p></blockquote>`).join('');

const MERMAID_STUB = String.raw`
(() => {
  window.__mm = { inits: [], runs: [] };
  let n = 0;
  window.mermaid = {
    initialize(cfg) { window.__mm.inits.push(JSON.parse(JSON.stringify(cfg))); },
    async run(opts) {
      for (const node of opts.nodes) {
        if (node.getAttribute('data-processed')) continue;
        const src = (node.textContent || '').trim();
        window.__mm.runs.push(src.slice(0, 60));
        const id = 'mermaid-' + (++n);
        const css = '#' + id + '{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}' +
          ('#' + id + ' .node rect{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}').repeat(30);
        node.innerHTML = /^(flowchart|graph|sequenceDiagram)\b/.test(src)
          ? '<svg id="' + id + '" viewBox="0 0 400 200" aria-roledescription="flowchart-v2"><style>' + css + '</style><g><text x="10" y="20">diagram</text></g></svg>'
          : '<svg id="' + id + '" viewBox="0 0 400 100" aria-roledescription="error"><g><text x="10" y="20">Syntax error in text</text></g></svg>';
        node.setAttribute('data-processed', 'true');
      }
    }
  };
})();
`;

const PAGE_HELPERS = String.raw`
(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const rgba = (color) => {
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = 'rgba(0, 0, 0, 0)';
    g.fillStyle = color;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], Math.round((d[3] / 255) * 1000) / 1000];
  };
  const lin = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = lum(a); const y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
  const over = (top, under) => [0, 1, 2].map((i) => Math.round(top[i] * top[3] + under[i] * (1 - top[3]))).concat([1]);
  const face = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  };
  window.__dg = {
    diagrams: () => {
      const wrap = document.querySelector('.mermaid-diagram-wrap');
      const lone = Array.from(document.querySelectorAll('.post-body pre.mermaid')).find((p) => !p.closest('.mermaid-diagram-wrap'));
      const drawn = (root) => !!root && Array.from(root.querySelectorAll('svg')).some((s) => s.getAttribute('aria-roledescription') && s.getAttribute('aria-roledescription') !== 'error');
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        fallback: document.querySelectorAll('.mermaid-fallback-code').length,
        fallbackText: (document.querySelector('.mermaid-fallback-code') || { textContent: '' }).textContent.slice(0, 80),
        wrapDrawn: drawn(wrap && wrap.querySelector('.mermaid-stage')),
        loneDrawn: drawn(lone),
        loneText: lone && !lone.querySelector('svg') ? (lone.textContent || '').slice(0, 80) : '',
        inits: window.__mm.inits.length,
        runs: window.__mm.runs.slice()
      };
    },
    callouts: () => Array.from(document.querySelectorAll('.post-body blockquote.alert-callout')).map((bq) => {
      const type = (Array.from(bq.classList).find((c) => /^alert-callout-(note|tip|important|warning|caution)$/.test(c)) || '').replace('alert-callout-', '');
      const cs = getComputedStyle(bq);
      const bg = face(bq);
      const title = bq.querySelector('.alert-callout-title span') || bq.querySelector('.alert-callout-title');
      const ink = title ? over(rgba(getComputedStyle(title).color), bg) : [0, 0, 0, 1];
      return { type, bar: rgba(cs.borderLeftColor), barWidth: parseFloat(cs.borderLeftWidth) || 0, bg, title: ink, ratio: ratio(ink, bg) };
    })
  };
})();
`;

const NO_MOTION = '*,*::before,*::after{transition:none!important;animation:none!important}';

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

interface Opened { page: Page; errors: string[] }

async function open(): Promise<Opened> {
  const { body } = renderTheme(tree, { view: 'post' });
  const at = body.match(/<[a-z]+\b[^>]*\bclass=(["'])(?:(?!\1).)*?(?<![\w-])post-body(?![\w-])(?:(?!\1).)*\1[^>]*>/);
  if (!at || at.index === undefined) throw new Error('the post view has no .post-body');
  const cut = at.index + at[0].length;
  const end = body.lastIndexOf('</body>');
  if (end < cut) throw new Error('the post view has no </body>');
  // String slicing, not replace(): the theme script contains $ patterns.
  const html =
    '<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">' +
    `<style>${SKIN}</style><style>${NO_MOTION}</style><script>${MERMAID_STUB}</script></head>` +
    body.slice(0, cut) + FIXTURE + body.slice(cut, end) +
    `<script>${THEME_SCRIPT}</script>` + body.slice(end) + '</html>';
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => route.abort());
  await page.setContent(html, { waitUntil: 'load' });
  await page.addScriptTag({ content: PAGE_HELPERS });
  try {
    await page.waitForFunction('window.__mm.inits.length > 0 && document.querySelectorAll(".alert-callout").length >= 5', undefined, { timeout: 10_000 });
  } catch {
    throw new Error(`the theme script did not draw diagrams and callouts; page errors: ${errors.join(' | ') || 'none'}`);
  }
  await page.waitForTimeout(400);
  return { page, errors };
}

async function toggle(page: Page): Promise<void> {
  const before = (await page.evaluate('window.__mm.inits.length')) as number;
  await page.evaluate('document.querySelector(".theme-toggle").click()');
  await page.waitForFunction(`window.__mm.inits.length > ${before}`, undefined, { timeout: 5_000 });
  await page.waitForTimeout(400);
}

interface Diagrams { theme: string; fallback: number; fallbackText: string; wrapDrawn: boolean; loneDrawn: boolean; loneText: string; inits: number; runs: string[] }
interface Callout { type: string; bar: Rgba; barWidth: number; bg: Rgba; title: Rgba; ratio: number }

const rgb = (c: readonly number[]): string => `rgb(${c.slice(0, 3).join(' ')})`;
const near = (x: readonly number[], y: readonly number[]): boolean => [0, 1, 2].every((i) => Math.abs((x[i] ?? 0) - (y[i] ?? 0)) <= 2);

describe('Fourth test-blog upload, 2026-10-07: diagrams and callouts', () => {
  it('finds the theme script with the diagram code', () => {
    expect(THEME_SCRIPT.length, 'theme script').toBeGreaterThan(10_000);
  });

  it('redraws every diagram from its source after theme switches', async () => {
    const { page, errors } = await open();
    const states: Diagrams[] = [(await page.evaluate('window.__dg.diagrams()')) as Diagrams];
    await toggle(page);
    states.push((await page.evaluate('window.__dg.diagrams()')) as Diagrams);
    await toggle(page);
    states.push((await page.evaluate('window.__dg.diagrams()')) as Diagrams);
    await page.close();

    const problems = states.flatMap((s, i) => {
      const at = i === 0 ? 'first draw' : `after switch ${i} (${s.theme})`;
      const out: string[] = [];
      if (s.fallback) out.push(`${at}: ${s.fallback} source card(s) showing "${s.fallbackText}"`);
      if (!s.wrapDrawn) out.push(`${at}: the wrapped diagram is not drawn`);
      if (!s.loneDrawn) out.push(`${at}: the standalone diagram is not drawn${s.loneText ? `, it shows "${s.loneText}"` : ''}`);
      return out;
    });
    const last = states[states.length - 1];
    const bad = (last?.runs ?? []).filter((r) => !/^(flowchart|sequenceDiagram)\b/.test(r));
    if (bad.length) problems.push(`Mermaid was given text that is not a diagram: ${bad.map((r) => JSON.stringify(r)).join(', ')}`);
    expect(problems, `page errors: ${errors.join(' | ') || 'none'}`).toEqual([]);
  }, 60_000);

  it('draws with the base theme and the tweakcn colours in both modes', async () => {
    const { page } = await open();
    await toggle(page);
    const inits = (await page.evaluate('window.__mm.inits')) as Array<{ theme?: string; securityLevel?: string; themeVariables?: Record<string, unknown> }>;
    await page.close();

    const problems: string[] = [];
    const modes = new Set<string>();
    inits.forEach((cfg, i) => {
      const vars = cfg.themeVariables ?? {};
      const want = vars['darkMode'] ? DARK : LIGHT;
      const mode = vars['darkMode'] ? 'dark' : 'light';
      modes.add(mode);
      if (cfg.theme !== 'base') problems.push(`init ${i} (${mode}): theme '${cfg.theme}', not 'base'`);
      if (cfg.securityLevel !== 'strict') problems.push(`init ${i} (${mode}): securityLevel '${cfg.securityLevel}'`);
      for (const [key, value] of Object.entries(want)) {
        const got = typeof vars[key] === 'string' ? String(vars[key]).toLowerCase() : vars[key];
        if (got !== value) problems.push(`init ${i} (${mode}): ${key} ${JSON.stringify(vars[key])}, want ${JSON.stringify(value)}`);
      }
      if (!String(vars['fontFamily'] ?? '').startsWith(FONT)) problems.push(`init ${i} (${mode}): fontFamily ${JSON.stringify(vars['fontFamily'])}, want Inter first`);
    });
    if (!modes.has('light') || !modes.has('dark')) problems.push(`modes drawn: ${[...modes].join(', ') || 'none'}`);
    expect(problems).toEqual([]);
  }, 60_000);

  it('keeps the five callout colours in dark mode, with readable titles in both', async () => {
    const { page } = await open();
    const dark = (await page.evaluate('window.__dg.callouts()')) as Callout[];
    const darkTheme = await page.evaluate('document.documentElement.getAttribute("data-theme")');
    await toggle(page);
    const light = (await page.evaluate('window.__dg.callouts()')) as Callout[];
    const lightTheme = await page.evaluate('document.documentElement.getAttribute("data-theme")');
    await page.close();

    expect([darkTheme, lightTheme], 'themes measured').toEqual(['dark', 'light']);
    expect(dark.map((c) => c.type), 'dark callouts').toEqual([...TYPES]);
    const problems: string[] = [];
    for (const type of TYPES) {
      const d = dark.find((c) => c.type === type);
      const l = light.find((c) => c.type === type);
      if (!d || !l) continue;
      if (!near(d.bar, l.bar)) problems.push(`${type}: dark bar ${rgb(d.bar)}, light bar ${rgb(l.bar)}`);
      if (d.ratio < 4.5) problems.push(`${type}: dark title ${rgb(d.title)} on ${rgb(d.bg)} at ${d.ratio}:1`);
      if (l.ratio < 4.5 && !siteExact(l.title, l.bg, l.ratio)) problems.push(`${type}: light title ${rgb(l.title)} on ${rgb(l.bg)} at ${l.ratio}:1`);
    }
    const distinct = new Set(dark.map((c) => rgb(c.bar)));
    if (distinct.size !== TYPES.length) problems.push(`dark bars: ${[...distinct].join(', ')} (want five colours)`);
    expect(problems).toEqual([]);
  }, 60_000);
});
