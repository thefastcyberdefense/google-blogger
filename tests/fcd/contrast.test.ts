// US-L9: with the tweakcn palette in place, every text the theme renders keeps
// WCAG AA contrast against the surface it sits on (4.5:1, large text 3:1), in
// both themes, on the home and post views of the static Blogger expansion
// (tests/fcd/blogger-static.ts). Opacity on the element and its ancestors
// counts. Each case lists its failures with the rule that sets the colour.
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
  window.__aa = {
    page: () => lum(face(document.body).base),
    failures: () => {
      const seen = new Map();
      let checked = 0;
      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (el.closest('svg, script, style, noscript, template')) continue;
        const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
        const select = el.tagName === 'SELECT';
        if (!own && !select) continue;
        if (!shown(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text') continue;
        const color = rgba(cs.color);
        if (color[3] === 0) continue;
        let o = 1;
        for (let n = el; n; n = n.parentElement) { const v = parseFloat(getComputedStyle(n).opacity); o *= Number.isNaN(v) ? 1 : v; }
        const f = face(el);
        const ink = over([color[0], color[1], color[2], color[3] * o], f.base);
        const size = parseFloat(cs.fontSize) || 16;
        const weight = parseInt(cs.fontWeight, 10) || 400;
        const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
        const r = ratio(ink, f.base);
        checked++;
        if (r >= need) continue;
        const key = name(el) + hex(ink) + hex(f.base);
        if (seen.has(key)) { seen.get(key).n++; continue; }
        const text = (own || (el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : '')).slice(0, 22);
        seen.set(key, { n: 1, line: name(el) + ' "' + text + '" ' + hex(ink) + ' on ' + hex(f.base) + (f.image ? ' (image)' : '') + ' ' + r + '<' + need + ' [' + winner(el, cs.color) + ']' });
      }
      return { checked, lines: Array.from(seen.values()).map((v) => v.line + (v.n > 1 ? ' x' + v.n : '')) };
    }
  };
})();
`;

type Theme = 'light' | 'dark';
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
});
