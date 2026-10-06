// US-L9: with the tweakcn palette in place, every text the theme renders keeps
// WCAG AA contrast against the surface it sits on (4.5:1, large text 3:1), in
// both themes, on the home and post views of the static Blogger expansion
// (tests/fcd/blogger-static.ts). Opacity on the element and its ancestors
// counts; text of disabled controls is exempt (WCAG 1.4.3, inactive
// components). Hover states of the theme's controls are measured too, with
// transitions off. Each case lists its failures with the rule that sets the
// colour.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseXml, renderTheme, type View } from './blogger-static.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const SKIN = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';
const tree = parseXml(xml);

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
    let image = false;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') image = true;
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let base = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return { base, image };
  };
  const shown = (el) => {
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const name = (el) => {
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
  };
  // The last skin rule matching el whose declared colour is the computed one.
  const winner = (el, computed) => {
    const target = rgba(computed).join(',');
    let last = '';
    const visit = (list, media) => {
      for (const r of Array.from(list)) {
        if (r instanceof CSSStyleRule) {
          let hit = false;
          try { hit = el.matches(r.selectorText); } catch (e) { hit = false; }
          const v = hit ? r.style.getPropertyValue('color') : '';
          if (v && rgba(v).join(',') === target) last = (media ? '@media ' + media + ' ' : '') + r.selectorText.replace(/\s+/g, ' ');
          if (r.cssRules && r.cssRules.length) visit(r.cssRules, media);
        } else if (r.cssRules) {
          visit(r.cssRules, r.media ? r.media.mediaText : media);
        }
      }
    };
    for (const s of Array.from(document.styleSheets)) {
      try { visit(s.cssRules, ''); } catch (e) { /* unreadable sheet */ }
    }
    return (last || 'inherited').slice(0, 72);
  };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
  const INACTIVE = ':disabled, [aria-disabled="true"], .is-disabled';
  const ownText = (el) => Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
  const textEl = (root) => {
    if (ownText(root)) return root;
    for (const el of Array.from(root.querySelectorAll('*'))) if (!el.closest('svg') && ownText(el) && shown(el)) return el;
    return null;
  };
  // Text colour over the composed surface, with opacity, and the AA target.
  const sample = (el) => {
    const cs = getComputedStyle(el);
    const color = rgba(cs.color);
    let o = 1;
    for (let n = el; n; n = n.parentElement) { const v = parseFloat(getComputedStyle(n).opacity); o *= Number.isNaN(v) ? 1 : v; }
    const f = face(el);
    const ink = over([color[0], color[1], color[2], color[3] * o], f.base);
    const size = parseFloat(cs.fontSize) || 16;
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    return { cs, color, ink, f, need, r: ratio(ink, f.base) };
  };
  window.__aa = {
    page: () => lum(face(document.body).base),
    failures: () => {
      const seen = new Map();
      let checked = 0;
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (el.closest('svg, script, style, noscript, template')) continue;
        const own = ownText(el);
        const select = el.tagName === 'SELECT';
        if (!own && !select) continue;
        if (!shown(el) || el.closest(INACTIVE)) continue;
        const cs = getComputedStyle(el);
        if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue;
        if (rgba(cs.color)[3] === 0) continue;
        const s = sample(el);
        checked++;
        if (s.r >= s.need) continue;
        const key = name(el) + hex(s.ink) + hex(s.f.base);
        if (seen.has(key)) { seen.get(key).n++; continue; }
        const text = (own || (el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '')).slice(0, 22);
        seen.set(key, { n: 1, line: name(el) + ' "' + text + '" ' + hex(s.ink) + ' on ' + hex(s.f.base) + (s.f.image ? ' (image)' : '') + ' ' + s.r + '<' + s.need + ' [' + winner(el, cs.color) + ']' });
      }
      return { checked, lines: Array.from(seen.values()).map((v) => v.line + (v.n > 1 ? ' x' + v.n : '')) };
    },
    // Marks the first visible, active control of each selector that carries text.
    mark: (selectors) => selectors.map((sel, i) => {
      const el = Array.from(document.querySelectorAll(sel)).find((x) => shown(x) && !x.closest(INACTIVE + ', .mobile-drawer') && textEl(x));
      if (el) el.setAttribute('data-aa-hover', String(i));
      return { sel, i, found: !!el };
    }),
    measure: (i) => {
      const root = document.querySelector('[data-aa-hover="' + i + '"]');
      const t = root ? textEl(root) : null;
      if (!root || !t) return null;
      const s = sample(t);
      return { el: name(t), text: ownText(t).slice(0, 22), ink: hex(s.ink), surface: hex(s.f.base), ratio: s.r, need: s.need, hovered: root.matches(':hover'), rule: s.r < s.need ? winner(t, s.cs.color) : '' };
    }
  };
})();
`;

type Theme = 'light' | 'dark';
interface Measured { el: string; text: string; ink: string; surface: string; ratio: number; need: number; hovered: boolean; rule: string }

const NO_MOTION = '*, *::before, *::after { transition: none !important; animation: none !important; }';
// Controls with a hover state on the home and post views.
const HOVER = ['.hero-btn-primary', '.hero-btn-secondary', '.cta-btn-primary', '.cta-btn-secondary', '.sidebar-btn-primary', '.sidebar-btn-secondary', '.sidebar-recent-link', '.site-nav .nav-link', '.topic-pill', '.post-label', '.label-link', '.share-btn', '.author-follow-btn', '.listen-btn', '.newer-link', '.older-link', '.author-link-pill', '.footer-links-list a', '.post-title a', '.jump-link a'];

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

describe('tweakcn palette: AA text contrast', () => {
  for (const view of ['home', 'post'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      it(`keeps ${view} text at AA in the ${theme} theme`, async () => {
        const page = await open(view, theme);
        const pageLum = (await page.evaluate('window.__aa.page()')) as number;
        const { checked, lines } = (await page.evaluate('window.__aa.failures()')) as { checked: number; lines: string[] };
        await page.close();
        expect(theme === 'dark' ? pageLum < 0.05 : pageLum > 0.9, `${theme} theme not applied (page luminance ${pageLum})`).toBe(true);
        expect(checked, 'text elements measured').toBeGreaterThan(40);
        const shown = lines.slice(0, 22);
        expect(lines.length, `${lines.length} below AA of ${checked}: ${shown.join(' | ')}${lines.length > 22 ? ` | +${lines.length - 22} more` : ''}`).toBe(0);
      }, 60_000);
    }
  }

  for (const theme of ['light', 'dark'] as const) {
    it(`keeps hover text at AA in the ${theme} theme`, async () => {
      const problems: string[] = [];
      let measured = 0;
      for (const view of ['home', 'post'] as const) {
        const page = await open(view, theme);
        await page.addStyleTag({ content: NO_MOTION });
        const marks = (await page.evaluate(`window.__aa.mark(${JSON.stringify(HOVER)})`)) as Array<{ sel: string; i: number; found: boolean }>;
        for (const m of marks) {
          if (!m.found) continue;
          await page.hover(`[data-aa-hover="${m.i}"]`, { force: true, timeout: 3000 }).catch(() => undefined);
          const r = (await page.evaluate(`window.__aa.measure(${m.i})`)) as Measured | null;
          if (!r || !r.hovered) continue;
          measured++;
          if (r.ratio < r.need) problems.push(`${view} ${m.sel} ${r.el} "${r.text}" ${r.ink} on ${r.surface} ${r.ratio}<${r.need} [${r.rule}]`);
        }
        await page.close();
      }
      expect(measured, 'hovered controls measured').toBeGreaterThan(8);
      expect(problems.length, `${problems.length} hover states below AA: ${problems.join(' | ')}`).toBe(0);
    }, 90_000);
  }
});
