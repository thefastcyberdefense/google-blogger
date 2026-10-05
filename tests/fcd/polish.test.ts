// US-L7: the first test-blog upload of the Ledger rebuild (2026-10-05) showed
// what Ledger never met on its own blog:
//   1. Blogger kept the earlier theme's Blog Search, Blog Archive, Report Abuse
//      and Profile gadgets and moved them into the Header section, so they sat
//      in the masthead (Profile with a personal portrait) and pushed the brand
//      into a narrow column.
//   2. The FCD mark beside the long blog title shrank into an oval.
//   3. Secondary buttons (sidebar and author RSS) stayed white in dark mode.
//   4. The call-to-action secondary was filled like the primary in light mode.
//   5. Articles were set in Georgia; fastcyberdefense.com sets text in Inter.
//   6. Some rules (sidebar card headings, post meta, share bar, footer) stayed
//      near-white on the dark page.
// Each case lays out the built skin over a static expansion of dist/theme.xml
// (tests/fcd/blogger-static.ts) in Chromium, with every request blocked.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseXml, renderTheme, type Orphan, type View } from './blogger-static.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const tree = parseXml(xml);
const cdata = (tag: string): string => xml.match(new RegExp(`<${tag}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`))?.[1] ?? '';
const SKIN = cdata('b:skin');
const LAYOUT_SKIN = cdata('b:template-skin');

type Theme = 'light' | 'dark';
type Rgba = [number, number, number, number];
interface Box { left: number; right: number; top: number; width: number; height: number }

// Measurement helpers injected as plain script, so nothing the test runner
// compiles is serialised into the page. Colours go through a canvas, which
// resolves any CSS colour syntax (oklch, color-mix) to sRGB.
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
  const lum = (c) => Math.round((0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])) * 1000) / 1000;
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
  const shown = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => {
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  };
  // Screen rules of the skin that match el (or its ::before/::after), in order.
  const matching = (el, pseudo) => {
    const out = [];
    const visit = (list, media) => {
      for (const r of Array.from(list)) {
        if (r instanceof CSSStyleRule) {
          let hit = false;
          try {
            hit = pseudo
              ? r.selectorText.split(',').some((s) => s.includes(pseudo) && el.matches(s.replace(/::?(before|after)\b/g, '').trim() || '*'))
              : el.matches(r.selectorText);
          } catch (e) {
            hit = false;
          }
          if (hit && !/\bprint\b/.test(media)) out.push([r, media]);
          if (r.cssRules && r.cssRules.length) visit(r.cssRules, media);
        } else if (r.cssRules) {
          visit(r.cssRules, r.media ? r.media.mediaText : media);
        }
      }
    };
    for (const s of Array.from(document.styleSheets)) {
      try { visit(s.cssRules, ''); } catch (e) { /* unreadable sheet */ }
    }
    return out;
  };
  const selector = (r, media) => (media ? '@media ' + media + ' ' : '') + r.selectorText.replace(/\s+/g, ' ').slice(0, 200);
  // Matching rules that declare one of props, with the declarations.
  const rulesFor = (el, props, pseudo) => matching(el, pseudo)
    .map(([r, media]) => {
      const decl = props
        .map((p) => { const v = r.style.getPropertyValue(p); return v ? p + ': ' + v + (r.style.getPropertyPriority(p) ? ' !important' : '') : ''; })
        .filter(Boolean);
      return decl.length ? selector(r, media) + ' { ' + decl.join('; ') + ' }' : '';
    })
    .filter(Boolean);
  // The last matching rule whose declared colour for prop is the computed one.
  const winner = (el, prop, computed, pseudo) => {
    const target = rgba(computed).join(',');
    const hits = matching(el, pseudo).filter(([r]) => { const v = r.style.getPropertyValue(prop); return v && rgba(v).join(',') === target; });
    const last = hits[hits.length - 1];
    return last ? selector(last[0], last[1]) : 'no rule sets it (inherited or currentColor)';
  };
  // Nearest element, self first, whose own rules set one of props.
  const origin = (el, props) => {
    for (let n = el; n; n = n.parentElement) {
      const r = rulesFor(n, props);
      if (r.length) return name(n) + ' <- ' + r.slice(-6).join(' | ');
    }
    return 'no rule';
  };
  window.__fcd = {
    page: () => { const f = face(document.body); return { face: f, lum: lum(f) }; },
    orphans: () => Array.from(document.querySelectorAll('[data-fcd-orphan]')).map((el) => ({
      id: el.id,
      section: el.parentElement ? el.parentElement.id : '',
      display: getComputedStyle(el).display,
      shown: shown(el)
    })),
    widgets: (ids) => ids.map((id) => { const el = document.getElementById(id); return { id, present: !!el, display: el ? getComputedStyle(el).display : '' }; }),
    nav: () => {
      const links = Array.from(document.querySelectorAll('#LinkList1 .nav-link'));
      const chain = [document.querySelector('.nav-container'), document.getElementById('navlinks'), document.getElementById('LinkList1'), document.querySelector('#LinkList1 .site-nav'), document.querySelector('#LinkList1 .nav-list')].filter(Boolean);
      return {
        links: links.length,
        shown: links.filter((a) => shown(a) && a.getBoundingClientRect().right <= innerWidth + 1).length,
        chain: chain.map((el) => name(el) + ' ' + getComputedStyle(el).display + ' ' + JSON.stringify(box(el)) + ' [' + rulesFor(el, ['display', 'visibility', 'width', 'max-width', 'overflow', 'flex']).join(' | ').slice(0, 300) + ']')
      };
    },
    masthead: () => {
      const bar = document.querySelector('.header-bar');
      const title = document.querySelector('#Header1 .site-title');
      let lines = 0;
      if (title) {
        const range = document.createRange();
        range.selectNodeContents(title);
        lines = new Set(Array.from(range.getClientRects()).filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
      }
      const cs = bar ? getComputedStyle(bar) : null;
      return {
        bar: box(bar),
        padLeft: cs ? parseFloat(cs.paddingLeft) || 0 : 0,
        section: box(document.getElementById('header')),
        widget: box(document.getElementById('Header1')),
        brand: box(document.querySelector('#Header1 .header-brand')),
        title: box(title),
        titleLines: lines,
        toggle: box(document.querySelector('#Header1 .theme-toggle'))
      };
    },
    marks: () => Array.from(document.querySelectorAll('.fcd-mark')).filter(shown).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        mark: name(el),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
        rules: rulesFor(el, ['width', 'height', 'flex', 'flex-shrink', 'flex-basis', 'min-width', 'max-width', 'aspect-ratio'])
      };
    }),
    buttons: (selectors) => selectors.flatMap((sel) => Array.from(document.querySelectorAll(sel)).filter(shown).slice(0, 1).map((el) => {
      const cs = getComputedStyle(el);
      const surface = face(el);
      const behind = face(el.parentElement || el);
      const ink = over(rgba(cs.color), surface);
      const border = rgba(cs.borderTopColor);
      return {
        sel,
        el: name(el),
        fill: rgba(cs.backgroundColor),
        surface,
        surfaceLum: lum(surface),
        behind,
        fillContrast: ratio(surface, behind),
        ink,
        contrast: ratio(ink, surface),
        border,
        borderWidth: parseFloat(cs.borderTopWidth) || 0,
        borderStyle: cs.borderTopStyle,
        borderContrast: ratio(over(border, behind), behind),
        rules: rulesFor(el, ['background', 'background-color', 'color', 'border-color', 'border-top-color'])
      };
    })),
    serif: () => {
      const SERIF = /^(georgia|iowan old style|palatino linotype|palatino|book antiqua|times new roman|times|cambria|serif)$/;
      const seen = new Map();
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (el.closest('svg, script, style, noscript')) continue;
        if (!Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (!shown(el)) continue;
        const family = getComputedStyle(el).fontFamily;
        const first = family.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
        if (!SERIF.test(first)) continue;
        const key = name(el);
        if (!seen.has(key)) seen.set(key, { el: key, family, origin: seen.size < 4 ? origin(el, ['font-family']) : '' });
      }
      return Array.from(seen.values());
    },
    lines: () => {
      const seen = new Map();
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (el.closest('svg') || !shown(el)) continue;
        const cs = getComputedStyle(el);
        let behind = null;
        const sides = [];
        for (const side of ['top', 'right', 'bottom', 'left']) {
          const width = parseFloat(cs.getPropertyValue('border-' + side + '-width')) || 0;
          const style = cs.getPropertyValue('border-' + side + '-style');
          if (width < 0.5 || style === 'none' || style === 'hidden') continue;
          const c = rgba(cs.getPropertyValue('border-' + side + '-color'));
          if (c[3] < 0.05) continue;
          behind = behind || face(el.parentElement || el);
          if (lum(over(c, behind)) > 0.45) sides.push(side);
        }
        if (sides.length) {
          const prop = 'border-' + sides[0] + '-color';
          const rule = winner(el, prop, cs.getPropertyValue(prop));
          const key = rule + ' :: ' + name(el);
          if (!seen.has(key)) seen.set(key, { rule, el: name(el), sides: sides.map((x) => x[0]).join('') });
        }
        for (const pseudo of ['::before', '::after']) {
          const ps = getComputedStyle(el, pseudo);
          if (ps.content === 'none' || ps.content === 'normal' || ps.display === 'none') continue;
          const h = parseFloat(ps.height);
          const w = parseFloat(ps.width);
          if (!((h > 0 && h <= 2) || (w > 0 && w <= 2))) continue;
          const c = rgba(ps.backgroundColor);
          if (c[3] < 0.05 || lum(over(c, face(el))) <= 0.45) continue;
          const rule = winner(el, 'background-color', ps.backgroundColor, pseudo);
          const key = rule + ' :: ' + name(el) + pseudo;
          if (!seen.has(key)) seen.set(key, { rule, el: name(el) + pseudo, sides: 'line' });
        }
      }
      return Array.from(seen.values());
    }
  };
})();
`;

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

interface Shot {
  view: View;
  theme: Theme;
  layout?: boolean;
  orphans?: Record<string, Orphan[]>;
  width?: number;
}

async function open(shot: Shot): Promise<Page> {
  const { body } = renderTheme(tree, { view: shot.view, layout: shot.layout, orphans: shot.orphans });
  const css = shot.layout ? `${SKIN}\n${LAYOUT_SKIN}` : SKIN;
  const page = await browser.newPage({ viewport: { width: shot.width ?? 1280, height: 900 }, colorScheme: shot.theme });
  await page.route('**/*', (route) => route.abort());
  await page.setContent(`<!doctype html><html lang="en" data-theme="${shot.theme}"><head><meta charset="utf-8"><style>${css}</style></head>${body}</html>`, { waitUntil: 'load' });
  await page.addScriptTag({ content: PAGE_HELPERS });
  return page;
}

async function measure<T>(page: Page, call: string): Promise<T> {
  return (await page.evaluate(`window.__fcd.${call}`)) as T;
}

// The four gadgets the 2026-10-05 upload moved into the Header section, in the
// shape Blogger's built-in markup gives them, and one relocated Text gadget in
// every other section that takes no gadgets of its own.
const OBSERVED: Orphan[] = [
  { id: 'BlogSearch1', type: 'BlogSearch', html: '<h3 class="title">Search This Blog</h3><div class="widget-content" role="search"><form action="#"><input name="q" placeholder="Search this blog" type="text"><input type="submit" value="Search"></form></div>' },
  { id: 'BlogArchive1', type: 'BlogArchive', html: '<div class="widget-content"><ul class="hierarchy"><li class="archivedate"><a class="post-count-link" href="#">October 2026</a> <span class="post-count">1</span></li></ul></div>' },
  { id: 'ReportAbuse1', type: 'ReportAbuse', html: '<h3 class="title"><a class="report_abuse" href="#">Report Abuse</a></h3>' },
  { id: 'Profile1', type: 'Profile', html: '<h3 class="title">Authors</h3><div class="widget-content"><ul><li><a class="profile-name-link g-profile" href="#">Fast Cyber Defense</a></li><li><img alt="" height="80" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" width="80"><a class="profile-name-link g-profile" href="#">Second author</a></li></ul></div>' }
];

const { sections } = renderTheme(tree, { view: 'home' });
const FIXED = sections.filter((s) => s.fixed);

function relocated(): Record<string, Orphan[]> {
  return Object.fromEntries(
    FIXED.map((s, i): [string, Orphan[]] => [s.id, s.id === 'header' ? OBSERVED : [{ id: `Text${90 + i}`, type: 'Text', html: '<h3 class="title">Relocated gadget</h3><div class="widget-content">Text gadget from an earlier theme.</div>' }]])
  );
}

interface OrphanState { id: string; section: string; display: string; shown: boolean }
interface WidgetState { id: string; present: boolean; display: string }
interface NavState { links: number; shown: number; chain: string[] }
interface Masthead { bar: Box | null; padLeft: number; section: Box | null; widget: Box | null; brand: Box | null; title: Box | null; titleLines: number; toggle: Box | null }
interface Mark { mark: string; width: number; height: number; rules: string[] }
interface Button { sel: string; el: string; fill: Rgba; surface: Rgba; surfaceLum: number; behind: Rgba; fillContrast: number; ink: Rgba; contrast: number; border: Rgba; borderWidth: number; borderStyle: string; borderContrast: number; rules: string[] }
interface Serif { el: string; family: string; origin: string }
interface Line { rule: string; el: string; sides: string }

const rgb = (c: Rgba): string => `rgb(${c.slice(0, 3).join(' ')}${c[3] < 1 ? ' / ' + c[3] : ''})`;
const describeButton = (view: string, b: Button): string =>
  `${view} ${b.el}: fill ${rgb(b.fill)}, face ${rgb(b.surface)} (lum ${b.surfaceLum}), text ${rgb(b.ink)} at ${b.contrast}:1, border ${b.borderWidth}px ${b.borderStyle} ${rgb(b.border)} [${b.rules.join(' | ')}]`;

describe('Test-blog upload, 2026-10-05: relocated gadgets', () => {
  it('finds the sections that take no gadgets of their own', () => {
    expect(FIXED.map((s) => s.id), 'fixed sections').toEqual(expect.arrayContaining(['header', 'navlinks', 'intro', 'topics', 'page_body', 'cta']));
  });

  it('keeps gadgets Blogger relocates into those sections off the live page', async () => {
    const orphans = relocated();
    const page = await open({ view: 'home', theme: 'light', orphans });
    const state = await measure<OrphanState[]>(page, 'orphans()');
    const own = await measure<WidgetState[]>(page, `widgets(${JSON.stringify(['Header1', 'Blog1', 'HTML1', 'HTML2'])})`);
    await page.close();
    expect(state.length, 'relocated gadgets in the fixture').toBe(Object.values(orphans).flat().length);
    const leaks = state.filter((s) => s.shown).map((s) => `${s.id} in #${s.section} (display ${s.display})`);
    expect(leaks, `relocated gadgets showing on the live page: ${leaks.join(' | ')}`).toEqual([]);
    const lost = own.filter((w) => !w.present || w.display === 'none').map((w) => `${w.id} (${w.present ? w.display : 'missing'})`);
    expect(lost, `theme widgets hidden by the guard: ${lost.join(', ')}`).toEqual([]);
  }, 30_000);

  it('still lists them in Layout so the owner can delete them', async () => {
    const page = await open({ view: 'home', theme: 'light', layout: true, orphans: relocated() });
    const state = await measure<OrphanState[]>(page, 'orphans()');
    await page.close();
    const hidden = state.filter((s) => s.display === 'none').map((s) => `${s.id} in #${s.section}`);
    expect(hidden, `relocated gadgets hidden in Layout: ${hidden.join(' | ')}`).toEqual([]);
  }, 30_000);

  it('shows the Navigation links in the desktop masthead', async () => {
    const page = await open({ view: 'home', theme: 'light' });
    const nav = await measure<NavState>(page, 'nav()');
    await page.close();
    expect(nav.shown, `navigation links not visible at 1280px: ${JSON.stringify(nav)}`).toBeGreaterThan(0);
  }, 30_000);

  it('keeps the brand at the start of the masthead, its title on one line', async () => {
    const page = await open({ view: 'home', theme: 'light', orphans: relocated() });
    const m = await measure<Masthead>(page, 'masthead()');
    await page.close();
    const detail = JSON.stringify(m);
    if (!m.bar || !m.brand || !m.title) throw new Error(`masthead parts missing: ${detail}`);
    expect(m.brand.left - (m.bar.left + m.padLeft), `brand pushed right: ${detail}`).toBeLessThanOrEqual(24);
    expect(m.titleLines, `blog title wraps: ${detail}`).toBe(1);
  }, 30_000);
});

describe('Test-blog upload, 2026-10-05: palette and type', () => {
  it('keeps every FCD mark square beside the long blog title', async () => {
    const problems: string[] = [];
    let count = 0;
    for (const view of ['home', 'post'] as const) {
      const page = await open({ view, theme: 'light' });
      const marks = await measure<Mark[]>(page, 'marks()');
      await page.close();
      count += marks.length;
      for (const m of marks) if (Math.abs(m.width - m.height) > 1 || m.width < 16) problems.push(`${view} ${m.mark} ${m.width}x${m.height} [${m.rules.join(' | ')}]`);
    }
    expect(count, 'FCD marks rendered').toBeGreaterThanOrEqual(4);
    expect(problems, `squashed marks: ${problems.join(' || ')}`).toEqual([]);
  }, 30_000);

  it('sets dark-mode secondary buttons on a dark face with readable text', async () => {
    const cases: Array<[View, string[]]> = [
      ['home', ['.hero-btn-secondary', '.sidebar-btn-secondary', '.cta-btn-secondary']],
      ['post', ['.sidebar-btn-secondary', '.author-follow-rss', '.share-btn']]
    ];
    const problems: string[] = [];
    for (const [view, selectors] of cases) {
      const page = await open({ view, theme: 'dark' });
      const base = await measure<{ face: Rgba; lum: number }>(page, 'page()');
      const found = await measure<Button[]>(page, `buttons(${JSON.stringify(selectors)})`);
      await page.close();
      if (base.lum > 0.05) problems.push(`${view}: dark theme not applied, page ${rgb(base.face)}`);
      for (const sel of selectors) if (!found.some((b) => b.sel === sel)) problems.push(`${view} ${sel}: not rendered`);
      for (const b of found) if (b.surfaceLum > 0.1 || b.contrast < 4.5) problems.push(describeButton(view, b));
    }
    expect(problems, `dark secondary buttons: ${problems.join(' || ')}`).toEqual([]);
  }, 30_000);

  it('draws the light call-to-action secondary as an outline, not a second primary', async () => {
    const page = await open({ view: 'home', theme: 'light' });
    const found = await measure<Button[]>(page, `buttons(${JSON.stringify(['.cta-btn-secondary', '.cta-btn-primary'])})`);
    await page.close();
    const secondary = found.find((b) => b.sel === '.cta-btn-secondary');
    const primary = found.find((b) => b.sel === '.cta-btn-primary');
    if (!secondary || !primary) throw new Error(`call-to-action buttons missing: ${JSON.stringify(found)}`);
    const detail = `${describeButton('home', secondary)} || primary ${describeButton('home', primary)}`;
    expect(secondary.fillContrast, `secondary is filled: ${detail}`).toBeLessThan(1.15);
    expect(secondary.borderWidth >= 1 && secondary.borderStyle !== 'none' && secondary.borderContrast >= 1.3, `secondary has no visible outline: ${detail}`).toBe(true);
    expect(secondary.contrast, `secondary label below AA: ${detail}`).toBeGreaterThanOrEqual(4.5);
  }, 30_000);

  it('sets text in Inter like fastcyberdefense.com, never in a serif face', async () => {
    const problems: string[] = [];
    for (const view of ['home', 'post'] as const) {
      const page = await open({ view, theme: 'light' });
      const hits = await measure<Serif[]>(page, 'serif()');
      await page.close();
      for (const h of hits) problems.push(`${view} ${h.el}: ${h.family}${h.origin ? ` [${h.origin}]` : ''}`);
    }
    expect(problems, `serif text: ${problems.join(' || ')}`).toEqual([]);
  }, 30_000);

  it('keeps dark-mode rules as quiet as the main site borders', async () => {
    const byRule = new Map<string, string[]>();
    for (const view of ['home', 'post'] as const) {
      const page = await open({ view, theme: 'dark' });
      const hits = await measure<Line[]>(page, 'lines()');
      await page.close();
      for (const h of hits) byRule.set(h.rule, [...(byRule.get(h.rule) ?? []), `${view} ${h.el} ${h.sides}`]);
    }
    const problems = [...byRule].map(([rule, at]) => `${rule} => ${at.slice(0, 3).join(', ')}${at.length > 3 ? ` (+${at.length - 3})` : ''}`);
    expect(problems, `near-white rules on the dark page, ${problems.length} rules: ${problems.join(' || ')}`).toEqual([]);
  }, 30_000);
});
