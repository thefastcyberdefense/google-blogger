// US-L8: after the second test-blog upload (build 0afa13c, 2026-10-06) the owner
// asked for the company logo, https://fastcyberdefense.com/icon0.svg, in place
// of the shield drawn for the rebuild. tests/fcd/icon0.svg is that file verbatim
// (thefastcyberdefense/fastcyberdefense src/app/icon0.svg at main f2b0cfa, blob
// 7c54b9e). The theme inlines it, so the blog makes no logo request, and gives
// each inline copy its own gradient id, because inline SVG ids share the page.
// The logo is a disc with cut-out letters, so a mark has no ring or fill of its
// own and the letters show the surface below, as on the main site; an author
// without a photo gets the logo too. The same screenshots showed white "Post a
// Comment" labels on the lighter brand blue in dark mode (3.4:1). After the
// US-L9 palette build the owner chose the site's exact colours (2026-10-06,
// tests/fcd/site-exact.ts): comment actions are white on the primary #3d8fe1
// in both themes, as on fastcyberdefense.com, and darken on hover.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseXml, renderTheme, type View } from './blogger-static.ts';
import { SITE_EXACT, siteExact } from './site-exact.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const visible = xml.replace(/<!--[\s\S]*?-->/g, '');
const SCRIPT = /<script\b[^>]*>[\s\S]*?<\/script>/g;
const script = (visible.match(SCRIPT) ?? []).join('\n');
const markup = visible.replace(SCRIPT, '');
const SKIN = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';
const ICON = readFileSync(join(ROOT, 'tests/fcd/icon0.svg'), 'utf8');

const attr = (attrs: string, name: string): string => attrs.match(new RegExp(`(?:^|\\s)${name}=["']([^"']*)["']`))?.[1] ?? '';
const stops = (text: string): string[] => [...text.matchAll(/<stop\b([^>]*?)\/?>/g)].map((s) => `${attr(s[1] ?? '', 'offset')} ${attr(s[1] ?? '', 'stop-color')}`);

const LOGO_VIEWBOX = attr(ICON.match(/<svg\b([^>]*)>/)?.[1] ?? '', 'viewBox');
const LOGO_PATH = attr(ICON.match(/<path\b([^>]*)>/)?.[1] ?? '', 'd');
const LOGO_STOPS = stops(ICON);
// The shield drawn for the rebuild before the owner supplied the logo.
const DRAWN_SHIELD = 'M20 3 34 8v11';
const PLACES = ['header-avatar', 'sidebar-avatar', 'drawer-avatar', 'hero-portrait-img'];

interface InlineMark { cls: string; viewBox: string; body: string; fills: string[]; ids: string[] }

const MARKS: InlineMark[] = [...markup.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)]
  .filter((m) => /\bfcd-mark\b/.test(attr(m[1] ?? '', 'class')))
  .map((m) => {
    const body = m[2] ?? '';
    return {
      cls: attr(m[1] ?? '', 'class'),
      viewBox: attr(m[1] ?? '', 'viewBox'),
      body,
      fills: [...body.matchAll(/\bfill=["']url\(#([^)"']+)\)["']/g)].map((f) => f[1] ?? ''),
      ids: [...body.matchAll(/\sid=["']([^"']+)["']/g)].map((f) => f[1] ?? '')
    };
  });

const uses = (id: string): number => markup.split(`id="${id}"`).length + markup.split(`id='${id}'`).length - 2;

describe('FCD logo in the theme XML', () => {
  it('reads the company logo from tests/fcd/icon0.svg', () => {
    expect(LOGO_VIEWBOX).toBe('0 0 1495.22 1495.22');
    expect(LOGO_PATH.length).toBeGreaterThan(1000);
    expect(LOGO_STOPS).toHaveLength(9);
  });

  it('draws every FCD mark from the company logo', () => {
    const problems: string[] = [];
    for (const place of PLACES) if (!MARKS.some((m) => m.cls.split(/\s+/).includes(place))) problems.push(`${place}: no inline mark`);
    for (const m of MARKS) {
      if (m.viewBox !== LOGO_VIEWBOX) problems.push(`${m.cls}: viewBox ${m.viewBox}`);
      if (!m.body.includes(`d="${LOGO_PATH}"`)) problems.push(`${m.cls}: path ${(m.body.match(/\sd=["']([^"']{0,24})/)?.[1] ?? 'none')}... is not icon0.svg`);
      const own = stops(m.body);
      if (own.join(',') !== LOGO_STOPS.join(',')) problems.push(`${m.cls}: gradient ${own.join(',') || 'none'}`);
      if (m.fills.length === 0 || m.fills.some((id) => !m.ids.includes(id))) problems.push(`${m.cls}: fills ${m.fills.join(',') || 'none'}, own ids ${m.ids.join(',') || 'none'}`);
    }
    expect(MARKS.length, 'inline FCD marks').toBeGreaterThanOrEqual(PLACES.length);
    expect(problems, `logo marks: ${problems.join(' | ')}`).toEqual([]);
  });

  it('gives each inline logo a gradient id nothing else on the page uses', () => {
    const ids = MARKS.flatMap((m) => m.ids);
    const shared = [...new Set(ids)].filter((id) => uses(id) !== 1).map((id) => `${id} x${uses(id)}`);
    expect(ids.length, 'logo gradient ids').toBeGreaterThanOrEqual(PLACES.length);
    expect(shared, 'ids defined more than once').toEqual([]);
  });

  it('uses the logo in the script and the skin, retires the drawn shield and fetches no logo', () => {
    const problems: string[] = [];
    if (!script.includes(LOGO_PATH)) problems.push('the script fallback avatar is not icon0.svg');
    if (!SKIN.includes(LOGO_PATH)) problems.push('the skin carries no icon0.svg for an author without a photo');
    if (visible.includes(DRAWN_SHIELD)) problems.push(`the drawn shield is still in the theme (${visible.split(DRAWN_SHIELD).length - 1}x)`);
    const fetched = visible.match(/fastcyberdefense\.com\/(?:icon0\.svg|logo\.svg)/g) ?? [];
    if (fetched.length) problems.push(`logo requests: ${fetched.join(', ')}`);
    expect(problems, `logo sources: ${problems.join(' | ')}`).toEqual([]);
  });
});

// Measurement helpers injected as plain script (nothing the runner compiles is
// serialised into the page). Colours go through a canvas, which resolves any
// CSS colour syntax to sRGB.
const HELPERS = String.raw`
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
  const shown = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => {
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  // The last few skin rules matching el that declare one of props.
  const rules = (el, props) => {
    const out = [];
    const visit = (list, media) => {
      for (const r of Array.from(list)) {
        if (r instanceof CSSStyleRule) {
          let hit = false;
          try { hit = el.matches(r.selectorText); } catch (e) { hit = false; }
          if (hit) {
            const decl = props
              .map((p) => { const v = r.style.getPropertyValue(p); return v ? p + ': ' + v.slice(0, 60) + (r.style.getPropertyPriority(p) ? ' !important' : '') : ''; })
              .filter(Boolean);
            if (decl.length) out.push((media ? '@media ' + media + ' ' : '') + r.selectorText.replace(/\s+/g, ' ').slice(0, 160) + ' { ' + decl.join('; ') + ' }');
          }
          if (r.cssRules && r.cssRules.length) visit(r.cssRules, media);
        } else if (r.cssRules) {
          visit(r.cssRules, r.media ? r.media.mediaText : media);
        }
      }
    };
    for (const s of Array.from(document.styleSheets)) {
      try { visit(s.cssRules, ''); } catch (e) { /* unreadable sheet */ }
    }
    return out.slice(-6);
  };
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const BOX = ['background', 'background-color', 'background-image', 'border', 'border-width', 'border-color', 'box-shadow', 'padding'];
  window.__logo = {
    marks: () => Array.from(document.querySelectorAll('.fcd-mark')).filter(shown).map((el) => {
      const cs = getComputedStyle(el);
      return {
        mark: name(el),
        hero: el.classList.contains('hero-portrait-img'),
        viewBox: el.getAttribute('viewBox') || '',
        fill: rgba(cs.backgroundColor),
        image: cs.backgroundImage,
        border: SIDES.reduce((sum, side) => sum + (parseFloat(cs.getPropertyValue('border-' + side + '-width')) || 0), 0),
        shadow: cs.boxShadow,
        padding: Math.min.apply(null, SIDES.map((side) => parseFloat(cs.getPropertyValue('padding-' + side)) || 0)),
        rules: rules(el, BOX)
      };
    }),
    inject: (html, css) => {
      document.body.insertAdjacentHTML('beforeend', html);
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
      return true;
    },
    controls: (selectors) => selectors.map((sel) => {
      const el = document.querySelector(sel);
      if (!el || !shown(el)) return { sel, found: false };
      const cs = getComputedStyle(el);
      const surface = face(el);
      const ink = over(rgba(cs.color), surface);
      return { sel, found: true, el: name(el), surface, ink, contrast: ratio(ink, surface), rules: rules(el, ['background', 'background-color', 'color']) };
    }),
    fallback: () => {
      const el = document.querySelector('.author-avatar-fallback');
      if (!el) return null;
      const cs = getComputedStyle(el);
      const initials = el.querySelector('.author-initials');
      return {
        el: name(el),
        shown: shown(el),
        image: cs.backgroundImage.slice(0, 80),
        logo: cs.backgroundImage.indexOf('1495.22') >= 0,
        initials: !!initials && shown(initials),
        rules: rules(el, ['background', 'background-color', 'background-image', 'border-color'])
      };
    }
  };
})();
`;

type Theme = 'light' | 'dark';
type Rgba = [number, number, number, number];
interface Mark { mark: string; hero: boolean; viewBox: string; fill: Rgba; image: string; border: number; shadow: string; padding: number; rules: string[] }
interface Control { sel: string; found: boolean; el?: string; surface?: Rgba; ink?: Rgba; contrast?: number; rules?: string[] }
interface Fallback { el: string; shown: boolean; image: string; logo: boolean; initials: boolean; rules: string[] }

const tree = parseXml(xml);
let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

async function open(view: View, theme: Theme): Promise<Page> {
  const { body } = renderTheme(tree, { view });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
  await page.route('**/*', (route) => route.abort());
  await page.setContent(`<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><style>${SKIN}</style></head>${body}</html>`, { waitUntil: 'load' });
  await page.addScriptTag({ content: HELPERS });
  return page;
}

async function call<T>(page: Page, expr: string): Promise<T> {
  return (await page.evaluate(`window.__logo.${expr}`)) as T;
}

const rgb = (c?: Rgba): string => (c ? `rgb(${c.slice(0, 3).join(' ')}${c[3] < 1 ? ' / ' + c[3] : ''})` : 'none');

// Comment actions in the shape Ledger's threaded comments give them.
const PROBE =
  '<div class="comments" id="comments" data-fcd-probe=""><div class="comments-header-row"><h3 class="comments-title">Comments</h3>' +
  '<a class="comment-trigger-btn" data-probe="trigger" href="#"><span class="btn-icon">+</span> Post a Comment</a></div>' +
  '<div class="comment-zero-state"><p class="comment-zero-message">No comments yet. Share your thoughts or questions!</p><a data-probe="add" href="#" id="add-comment">Post a Comment</a></div>' +
  '<div class="comment-header"><cite class="user">Fast Cyber Defense</cite><span class="comment-author-badge" data-probe="badge">Author</span></div></div>';
const NO_MOTION = '*, *::before, *::after { transition: none !important; animation: none !important; }';
const ACTIONS = ['[data-probe="trigger"]', '[data-probe="add"]', '[data-probe="badge"]'];

describe('FCD logo and comment actions on the page', () => {
  it('sets each mark bare, its cut-out letters open to the surface below', async () => {
    const problems: string[] = [];
    let count = 0;
    for (const view of ['home', 'post'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        const page = await open(view, theme);
        const marks = await call<Mark[]>(page, 'marks()');
        await page.close();
        count += marks.length;
        for (const m of marks) {
          const at = `${view}/${theme} ${m.mark}`;
          const why = `[${m.rules.join(' | ')}]`;
          if (m.viewBox !== LOGO_VIEWBOX) problems.push(`${at}: not the logo, viewBox ${m.viewBox}`);
          if (m.fill[3] > 0 || m.image !== 'none') problems.push(`${at}: fill behind the logo ${rgb(m.fill)} ${m.image.slice(0, 40)} ${why}`);
          if (m.hero && m.padding < 8) problems.push(`${at}: logo touches the hero ring, padding ${m.padding}px ${why}`);
          if (!m.hero && (m.border > 0 || m.shadow !== 'none')) problems.push(`${at}: portrait ring ${m.border}px, shadow ${m.shadow} ${why}`);
        }
      }
    }
    expect(count, 'logo marks rendered').toBeGreaterThanOrEqual(8);
    expect(problems, `logo marks: ${problems.join(' || ')}`).toEqual([]);
  }, 60_000);

  it('sets comment actions white on the site primary in both themes, readable on hover too', async () => {
    const problems: string[] = [];
    for (const theme of ['light', 'dark'] as const) {
      const page = await open('post', theme);
      await call<boolean>(page, `inject(${JSON.stringify(PROBE)}, ${JSON.stringify(NO_MOTION)})`);
      const rest = await call<Control[]>(page, `controls(${JSON.stringify(ACTIONS)})`);
      await page.hover(ACTIONS[0] ?? '');
      const hover = await call<Control[]>(page, `controls(${JSON.stringify(ACTIONS.slice(0, 1))})`);
      await page.close();
      const states: Array<[string, Control[]]> = [['rest', rest], ['hover', hover]];
      for (const [state, list] of states) {
        for (const c of list) {
          const at = `${theme} ${state} ${c.el}: text ${rgb(c.ink)} on ${rgb(c.surface)} at ${c.contrast}:1 [${(c.rules ?? []).join(' | ')}]`;
          if (!c.found) problems.push(`${theme} ${state} ${c.sel}: not rendered`);
          else if (state === 'rest' && !siteExact(c.ink ?? [], c.surface ?? [], c.contrast ?? 0)) problems.push(`not white on the primary #3d8fe1 (owner, ${SITE_EXACT.decided}): ${at}`);
          else if (state === 'hover' && (c.contrast ?? 0) < 4.5 && !siteExact(c.ink ?? [], c.surface ?? [], c.contrast ?? 0)) problems.push(`${theme} ${state} ${c.el}: text ${rgb(c.ink)} on ${rgb(c.surface)} at ${c.contrast}:1 [${(c.rules ?? []).join(' | ')}]`);
        }
      }
    }
    expect(problems, `comment actions: ${problems.join(' || ')}`).toEqual([]);
  }, 60_000);

  it('shows the logo for an author without a photo', async () => {
    const problems: string[] = [];
    for (const theme of ['light', 'dark'] as const) {
      const page = await open('post', theme);
      const f = await call<Fallback | null>(page, 'fallback()');
      await page.close();
      if (!f) problems.push(`${theme}: the post view has no author-avatar-fallback`);
      else if (!f.shown || !f.logo || f.initials) problems.push(`${theme} ${f.el}: shown ${f.shown}, logo ${f.logo}, initials ${f.initials}, background ${f.image} [${f.rules.join(' | ')}]`);
    }
    expect(problems, `author fallback: ${problems.join(' || ')}`).toEqual([]);
  }, 60_000);
});
