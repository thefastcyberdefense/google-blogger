// US-L9: the owner's tweakcn theme (tweakcn.com/themes/cmj93i381000k04jt333e4ko2),
// which fastcyberdefense.com is built on, is the whole palette of the blog. Every
// colour the built theme draws (skin, script and markup) is one of its tokens in
// either theme at any alpha, black for overlays only, the logo's own gradient,
// or one of the AA text values the owner approved for small text on light
// surfaces (action blue #166fbe and its hover, muted text #606d8e). Shadows are
// the tweakcn shadows, tinted with the primary #3d8fe1. Each source file has its
// own case, so a failure lists that file's off-palette literals and lines.
// Content semantics keep their own hues: Prism syntax tokens (.token) and the
// GitHub-style alert callouts carry meaning (keyword, string; tip, warning,
// caution) the palette has no colours for.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const visible = xml.replace(/<!--[\s\S]*?-->/g, '');
const SKIN = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';
const SCRIPT_RE = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
const SCRIPT = [...visible.matchAll(SCRIPT_RE)].map((m) => m[1] ?? '').join('\n');
const MARKUP = visible
  .replace(/<b:skin\b[\s\S]*?<\/b:skin>/g, '')
  .replace(/<b:template-skin\b[\s\S]*?<\/b:template-skin>/g, '')
  .replace(SCRIPT_RE, '')
  .replace(/<svg\b[^>]*\bfcd-mark\b[^>]*>[\s\S]*?<\/svg>/g, '');

type Rgb = [number, number, number];
interface Colour { literal: string; rgb: Rgb; alpha: number }

function srgb(linear: number): number {
  const v = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, v)) * 255);
}

function fromOklch(l: number, c: number, h: number): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l1 = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m1 = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s1 = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    srgb(4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1),
    srgb(-1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1),
    srgb(-0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1)
  ];
}

function fromHsl(h: number, s: number, l: number): Rgb {
  const k = (n: number): number => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): number => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function fromHex(hex: string): { rgb: Rgb; alpha: number } {
  const h = hex.replace('#', '');
  const full = h.length <= 4 ? [...h].map((x) => x + x).join('') : h;
  const rgb = [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb;
  return { rgb, alpha: full.length === 8 ? Math.round((Number.parseInt(full.slice(6, 8), 16) / 255) * 1000) / 1000 : 1 };
}

const alphaOf = (v: string | undefined, pct: string | undefined): number => (v === undefined || v === '' ? 1 : Number(v) / (pct ? 100 : 1));

const NAMED: Record<string, Rgb> = {
  white: [255, 255, 255], black: [0, 0, 0], red: [255, 0, 0], green: [0, 128, 0], blue: [0, 0, 255], gray: [128, 128, 128],
  grey: [128, 128, 128], silver: [192, 192, 192], orange: [255, 165, 0], yellow: [255, 255, 0], purple: [128, 0, 128], navy: [0, 0, 128],
  teal: [0, 128, 128], maroon: [128, 0, 0], lime: [0, 255, 0], aqua: [0, 255, 255], fuchsia: [255, 0, 255], olive: [128, 128, 0],
  pink: [255, 192, 203], gold: [255, 215, 0], crimson: [220, 20, 60], tomato: [255, 99, 71], coral: [255, 127, 80], whitesmoke: [245, 245, 245],
  gainsboro: [220, 220, 220], lightgray: [211, 211, 211], lightgrey: [211, 211, 211], darkgray: [169, 169, 169], darkgrey: [169, 169, 169],
  dimgray: [105, 105, 105], slategray: [112, 128, 144], ghostwhite: [248, 248, 255], aliceblue: [240, 248, 255]
};

// Every colour literal in a CSS value or a line of script. URL-encoded data URIs
// (%23 for #) are decoded first, so SVG icons inside the skin are read too.
// Character references are not colours: &#039; or #039 between | in a regex
// alternation of entity names (the script's HTML decoder) are skipped.
function colours(text: string, named = false): Colour[] {
  const t = text.replace(/%23/gi, '#');
  const out: Colour[] = [];
  for (const m of t.matchAll(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+)(%?)\s*)?\)/gi)) {
    out.push({ literal: m[0], rgb: fromOklch(Number(m[1]) / (m[2] ? 100 : 1), Number(m[3]), Number(m[4])), alpha: alphaOf(m[5], m[6]) });
  }
  for (const m of t.matchAll(/(?<![&\w|])#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![0-9a-z_|-])/gi)) {
    out.push({ literal: m[0], ...fromHex(m[0]) });
  }
  for (const m of t.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)/gi)) {
    out.push({ literal: m[0], rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alpha: alphaOf(m[4], m[5]) });
  }
  for (const m of t.matchAll(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*(?:[,/]\s*([\d.]+)(%?)\s*)?\)/gi)) {
    out.push({ literal: m[0], rgb: fromHsl(Number(m[1]), Number(m[2]) / 100, Number(m[3]) / 100), alpha: alphaOf(m[4], m[5]) });
  }
  if (named) {
    for (const m of t.matchAll(/(?<![\w#.-])([a-z]+)(?![\w(-])/gi)) {
      const rgb = NAMED[(m[1] ?? '').toLowerCase()];
      if (rgb) out.push({ literal: m[0], rgb, alpha: 1 });
    }
  }
  return out;
}

const hex = (c: Rgb): string => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const near = (x: Rgb, y: Rgb): boolean => x.every((v, i) => Math.abs(v - (y[i] ?? 0)) <= 2);

// The tweakcn export, light and dark (:root and .dark).
const TWEAKCN: Record<string, Rgb> = {
  'background': fromOklch(1, 0, 0),
  'foreground': fromOklch(0.2954, 0.0649, 265.7059),
  'card': fromOklch(0.9743, 0.0101, 228.8865),
  'primary': fromOklch(0.6386, 0.1467, 251.2451),
  'secondary': fromOklch(0.8503, 0.0656, 228.1545),
  'muted-foreground': fromOklch(0.5851, 0.0546, 268.3959),
  'accent': fromOklch(0.9523, 0.0192, 230.6952),
  'destructive': fromOklch(0.6368, 0.2078, 25.3313),
  'border': fromOklch(0.9155, 0.0178, 240.0081),
  'chart-5': fromOklch(0.8319, 0.0256, 246.2533),
  'dark background': fromOklch(0.1971, 0.0414, 269.7076),
  'dark foreground': fromOklch(0.9288, 0.0126, 255.5078),
  'dark card': fromOklch(0.2441, 0.0456, 268.3692),
  'dark secondary': fromOklch(0.4015, 0.0706, 251.9121),
  'dark muted-foreground': fromOklch(0.7137, 0.0192, 261.3246),
  'dark border': fromOklch(0.3351, 0.0331, 260.912),
  'dark chart-5': fromOklch(0.551, 0.0234, 264.3637)
};

// The AA text values the owner approved with the rebuild: small text on light
// surfaces takes the primary and the muted foreground deepened along their hue.
const AA: Record<string, Rgb> = {
  'action blue': fromOklch(0.535, 0.1467, 251.2451),
  'action blue hover': fromOklch(0.5, 0.1467, 251.2451),
  'muted text': fromOklch(0.5375, 0.0546, 268.3959)
};

// fastcyberdefense.com icon0.svg gradient stops (the logo artwork itself).
const LOGO = ['#2d4e8e', '#325695', '#5082b8', '#66a2d2', '#73b6e2', '#78bde8', '#85c8e8', '#94d5e9', '#9adaea'].map((h) => fromHex(h).rgb);
const PALETTE: Rgb[] = [...Object.values(TWEAKCN), ...Object.values(AA)];

function allowed(c: Colour, prop: string, context: string): boolean {
  if (c.alpha === 0) return true;
  if (PALETTE.some((p) => near(c.rgb, p))) return true;
  if (near(c.rgb, [0, 0, 0]) && c.alpha < 1 && /^background(-color)?$/.test(prop)) return true;
  return context.includes('1495.22') && LOGO.some((l) => near(c.rgb, l));
}

interface Decl { selector: string; media: string; prop: string; value: string }

function closeOf(text: string, open: number): number {
  let depth = 0;
  let quote = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  return text.length;
}

function splitTop(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

// Declarations of the compiled skin with their selector and at-rule context;
// print-only media is skipped (paper colours), keyframes are kept.
function walk(css: string, media: string, out: Decl[]): void {
  let i = 0;
  let start = 0;
  let depth = 0;
  let quote = '';
  while (i < css.length) {
    const ch = css[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = '';
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) start = i + 1;
    else if (ch === '{' && depth === 0) {
      const prelude = css.slice(start, i).trim();
      const close = closeOf(css, i);
      const inner = css.slice(i + 1, close);
      if (prelude.startsWith('@')) {
        const printOnly = /^@media\b/.test(prelude) && /\bprint\b/.test(prelude) && !/\b(screen|all)\b/.test(prelude);
        if (!printOnly && /^@(media|supports|layer|container|keyframes|-webkit-keyframes)\b/.test(prelude)) walk(inner, media ? `${media} ${prelude}` : prelude, out);
      } else if (inner.includes('{')) {
        walk(inner, media, out);
      } else {
        for (const d of splitTop(inner)) {
          const colon = d.indexOf(':');
          if (colon < 0) continue;
          const prop = d.slice(0, colon).trim().toLowerCase();
          const value = d.slice(colon + 1).trim();
          if (prop && value) out.push({ selector: prelude.replace(/\s+/g, ' '), media, prop, value });
        }
      }
      i = close + 1;
      start = i;
      continue;
    }
    i++;
  }
}

const DECLS: Decl[] = [];
walk(SKIN.replace(/\/\*[\s\S]*?\*\//g, ''), '', DECLS);
const isDark = (d: Decl): boolean => /data-theme=["']?dark|\.dark\b/.test(d.selector) || /prefers-color-scheme:\s*dark/.test(d.media);
const COLOUR_PROP = /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|fill|stroke|stop-color|box-shadow|text-shadow|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?|--.+)$/;

interface Hit extends Colour { prop: string; dark: boolean; where: string }

const CONTENT = /\.token\b|alert-callout/;
const SKIN_HITS: Hit[] = DECLS.filter((d) => !CONTENT.test(d.selector)).flatMap((d) =>
  colours(d.value, COLOUR_PROP.test(d.prop))
    .filter((c) => !allowed(c, d.prop, d.value))
    .map((c) => ({ ...c, prop: d.prop, dark: isDark(d), where: d.selector }))
);
const SCRIPT_HITS: Hit[] = SCRIPT.split('\n').flatMap((line) =>
  colours(line).filter((c) => !allowed(c, 'script', line)).map((c) => ({ ...c, prop: 'script', dark: false, where: line.trim() }))
);
const MARKUP_HITS: Hit[] = [...MARKUP.matchAll(/\s(fill|stroke|stop-color|color|bgcolor|style)=(?:"([^"]*)"|'([^']*)')/g)].flatMap((m) => {
  const value = m[2] ?? m[3] ?? '';
  return colours(value, true).filter((c) => !allowed(c, m[1] ?? '', value)).map((c) => ({ ...c, prop: m[1] ?? '', dark: false, where: value }));
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sourceFiles(p);
    return /\.(pug|scss|ts)$/.test(d.name) ? [p] : [];
  });
}

const SOURCES = sourceFiles(join(ROOT, 'src')).map((p) => ({ path: relative(ROOT, p).split('\\').join('/'), lines: readFileSync(p, 'utf8').split('\n') }));

interface Origin { file: string; literal: string; at: string }

// Where a colour is written in the sources: the first file with a literal of
// that colour (same alpha first, any alpha second) and its lines.
function origin(hit: Hit, ext: string): Origin {
  const pool = SOURCES.filter((s) => s.path.endsWith(ext));
  for (const sameAlpha of [true, false]) {
    const found: Array<{ file: string; lines: number[]; literal: string }> = [];
    for (const s of pool) {
      const lines: number[] = [];
      let literal = '';
      s.lines.forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        const c = colours(line, true).find((x) => near(x.rgb, hit.rgb) && (!sameAlpha || Math.abs(x.alpha - hit.alpha) < 0.02));
        if (c) {
          lines.push(i + 1);
          literal = literal || c.literal;
        }
      });
      if (lines.length) found.push({ file: s.path, lines, literal });
    }
    const first = found[0];
    if (first) {
      // Other files may write the colour another way; name their literal too.
      const at = found
        .slice(0, 3)
        .map((f) => `${f.file.split('/').pop()}:${f.lines.slice(0, 4).join(',')}${f.lines.length > 4 ? '+' : ''}${f.literal === first.literal ? '' : '=' + f.literal}`)
        .join(' ');
      return { file: first.file, literal: first.literal, at };
    }
  }
  return { file: 'Sass-derived', literal: hit.literal, at: 'no source literal' };
}

interface Entry { file: string; text: string; count: number }

function entries(hits: Hit[], ext: string): Entry[] {
  const byKey = new Map<string, { o: Origin; hit: Hit; props: Set<string>; modes: Set<string>; count: number }>();
  for (const h of hits) {
    const o = origin(h, ext);
    const key = `${o.file}|${o.literal.toLowerCase().replace(/\s+/g, ' ')}`;
    const e = byKey.get(key) ?? { o, hit: h, props: new Set<string>(), modes: new Set<string>(), count: 0 };
    e.props.add(h.prop);
    e.modes.add(h.dark ? 'dark' : 'light');
    e.count++;
    byKey.set(key, e);
  }
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count)
    .map((e) => ({
      file: e.o.file,
      count: e.count,
      text: `${e.o.literal} ${hex(e.hit.rgb)}${e.hit.alpha < 1 ? '/' + e.hit.alpha : ''} ${[...e.props].join('+')} ${[...e.modes].join('+')} x${e.count} @${e.o.at} {${e.hit.where.slice(0, 44)}}`
    }));
}

function report(list: Entry[]): string {
  const shown = list.slice(0, 20).map((e) => e.text);
  return `${list.length} off-palette colours: ${shown.join(' | ')}${list.length > 20 ? ` | +${list.length - 20} more` : ''}`;
}

const STYLE_ENTRIES = entries(SKIN_HITS, '.scss');
const GROUPS = ['tokens', 'base', 'layout', 'index', 'article', 'states', 'threaded-comments', 'dark', 'fcd'].map((n) => `src/styles/${n}.scss`);

describe('tweakcn palette: the skin', () => {
  for (const file of GROUPS) {
    it(`draws ${file} only from the tweakcn palette`, () => {
      const list = STYLE_ENTRIES.filter((e) => e.file === file);
      expect(list.length, report(list)).toBe(0);
    });
  }

  it('draws every other skin colour from the tweakcn palette', () => {
    const list = STYLE_ENTRIES.filter((e) => !GROUPS.includes(e.file));
    expect(list.length, report(list)).toBe(0);
  });

  it('draws every tweakcn token the blog has a role for', () => {
    const all = DECLS.flatMap((d) => colours(d.value, COLOUR_PROP.test(d.prop)));
    const roles = ['background', 'foreground', 'card', 'primary', 'secondary', 'accent', 'border', 'destructive', 'dark background', 'dark foreground', 'dark card', 'dark secondary', 'dark muted-foreground', 'dark border'];
    const missing = roles.filter((r) => !all.some((c) => near(c.rgb, TWEAKCN[r] ?? [0, 0, 0]))).map((r) => `${r} ${hex(TWEAKCN[r] ?? [0, 0, 0])}`);
    expect(missing.length, `tweakcn tokens the skin never draws: ${missing.join(', ')}`).toBe(0);
  });

  it('casts the tweakcn shadows, tinted with the primary', () => {
    const shadow = (d: Decl): boolean => d.prop === 'box-shadow' || /^--.*shadow/.test(d.prop);
    const tinted = (d: Decl, alpha: number): boolean => colours(d.value).some((c) => near(c.rgb, TWEAKCN.primary ?? [0, 0, 0]) && Math.abs(c.alpha - alpha) < 0.011);
    const light = DECLS.filter((d) => shadow(d) && !isDark(d) && tinted(d, 0.1)).length;
    const dark = DECLS.filter((d) => shadow(d) && isDark(d) && tinted(d, 0.2)).length;
    const black = DECLS.filter((d) => shadow(d) && colours(d.value).some((c) => near(c.rgb, [0, 0, 0]) && c.alpha > 0));
    const detail = `light ${light}, dark ${dark}, black shadows ${black.length}: ${black.slice(0, 6).map((d) => `${d.selector.slice(0, 40)} {${d.value.slice(0, 60)}}`).join(' | ')}`;
    expect(light > 0 && dark > 0 && black.length === 0, detail).toBe(true);
  });
});

describe('tweakcn palette: script and markup', () => {
  it('colours the script only from the tweakcn palette', () => {
    const list = entries(SCRIPT_HITS, '.ts');
    expect(list.length, report(list)).toBe(0);
  });

  it('colours the markup only from the tweakcn palette', () => {
    const list = entries(MARKUP_HITS, '.pug');
    expect(list.length, report(list)).toBe(0);
  });
});
