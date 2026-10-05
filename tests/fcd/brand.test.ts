// US-L3/L4: FCD identity and the main site's palette on the Ledger engine.
// Ledger v1.7.0 ships its author's personal identity, his analytics IDs and his
// blue/slate palette. FCD keeps Ledger's engine and layout but must read as Fast
// Cyber Defense: no personal links, portraits or trackers, the FCD mark in the
// masthead, and the colours of fastcyberdefense.com (src/app/globals.css).
// Text-bearing blue on light surfaces uses the AA-safe deeper action blue;
// #3d8fe1 stays exact for surfaces, large text and the dark theme. These checks
// read the CI-built XML; failures also name the source lines that carry a hit.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const visible = xml.replace(/<!--[\s\S]*?-->/g, '');
const skin = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return sourceFiles(p);
    return /\.(pug|scss|ts)$/.test(d.name) ? [p] : [];
  });
}

const SOURCES = sourceFiles(join(ROOT, 'src')).map((p) => ({ path: relative(ROOT, p), lines: readFileSync(p, 'utf8').split('\n') }));

// Source lines (path:line: text) that satisfy a predicate, for failure messages.
function where(test: (line: string) => boolean): string {
  const hits: string[] = [];
  for (const f of SOURCES) f.lines.forEach((line, i) => { if (test(line)) hits.push(`${f.path}:${i + 1}: ${line.trim().slice(0, 160)}`); });
  return hits.length ? hits.join(' | ') : 'no source line matched';
}

type Rgb = [number, number, number];

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

function fromHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length <= 4 ? [...h.slice(0, 3)].map((x) => x + x).join('') : h.slice(0, 6);
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

// Every colour literal in the text (skin CSS, inline SVG and script), with its source text.
function colours(text: string): Array<{ literal: string; rgb: Rgb }> {
  const found: Array<{ literal: string; rgb: Rgb }> = [];
  for (const m of text.matchAll(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*[\d.]+%?\s*)?\)/gi)) {
    const l = Number(m[1]) / (m[2] ? 100 : 1);
    found.push({ literal: m[0], rgb: fromOklch(l, Number(m[3]), Number(m[4])) });
  }
  for (const m of text.matchAll(/(?<![&\w])#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z_-])/gi)) {
    found.push({ literal: m[0], rgb: fromHex(m[0]) });
  }
  for (const m of text.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/gi)) {
    found.push({ literal: m[0], rgb: [Number(m[1]), Number(m[2]), Number(m[3])] });
  }
  return found;
}

const near = (x: Rgb, y: Rgb): boolean => x.every((v, i) => Math.abs(v - (y[i] ?? 0)) <= 2);

function tally(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].map(([v, n]) => `${v} x${n}`);
}

// Ledger's personal palette: tokens.scss, its hover literal and the dark-mode
// blues and greys hard-coded in dark.scss. White is shared and #e2e8f0 is
// Ledger's rule but FCD's dark foreground, so neither is listed.
const LEDGER: Record<string, Rgb> = {
  'surface #f8fafc': fromHex('#f8fafc'),
  'ink #0a0a0a': fromHex('#0a0a0a'),
  'ink-muted #717171': fromHex('#717171'),
  'accent #2563eb': fromHex('#2563eb'),
  'accent-wash #eff6ff': fromHex('#eff6ff'),
  'dark-page #020817': fromHex('#020817'),
  'dark-surface #161c2a': fromHex('#161c2a'),
  'dark-muted #909192': fromHex('#909192'),
  'dark-rule #1e293b': fromHex('#1e293b'),
  'dark-accent #3b82f6': fromHex('#3b82f6'),
  'dark-highlight #629bf8': fromHex('#629bf8'),
  'hover oklch(48% 0.205 263)': fromOklch(0.48, 0.205, 263),
  'dark link oklch(75% 0.15 259.735)': fromOklch(0.75, 0.15, 259.735),
  'dark button oklch(50% 0.22 260)': fromOklch(0.5, 0.22, 260),
  'dark pager oklch(62% 0.19 250)': fromOklch(0.62, 0.19, 250),
  'dark muted oklch(80% 0.015 255)': fromOklch(0.8, 0.015, 255)
};

const isLedger = (rgb: Rgb): boolean => Object.values(LEDGER).some((l) => near(rgb, l));

// fastcyberdefense.com tokens, plus the AA-safe text values derived from them.
const FCD: Record<string, string> = {
  'primary': '#3d8fe1',
  'foreground': '#1d2b4d',
  'card': '#f0f8fc',
  'accent': '#e3f2fa',
  'border': '#d9e5ee',
  'action blue (AA text on white, card, wash)': '#166fbe',
  'muted text (AA on white, card, wash)': '#606d8e',
  'dark background': '#0e1428',
  'dark card': '#171f36',
  'dark foreground': '#e2e8f0',
  'dark muted': '#9ca3af',
  'dark border': '#2d3748',
  'dark highlight': '#5d9ce0'
};

const IDENTITY = [/redwan/gi, /orcid/gi, /0009-0001-9419-4760/g, /cal\.com/gi, /blog-assets/gi, /AVvXsEid2pK6sS9Z/g, /5972841034338492159/g, /Cyber Security Professional/gi, /Founder &(?:amp;)? CEO/gi, /G-KCCCSPMFVS/g, /ydgpwp2tn0/g, /googletagmanager/gi, /clarity\.ms/gi];

describe('FCD identity', () => {
  it('carries no personal identity or upstream analytics', () => {
    const leaks = IDENTITY.flatMap((re) => tally([...visible.matchAll(re)].map((m) => m[0])));
    const lines = leaks.length ? where((line) => IDENTITY.some((re) => new RegExp(re.source, re.flags.replace('g', '')).test(line))) : '';
    expect(leaks, `personal identity or tracker strings in the theme; source: ${lines}`).toEqual([]);
  });

  it('brands the masthead with the FCD mark and the blog title, and links the company site', () => {
    const start = xml.search(/<b:widget\b[^>]*\bid=["']Header1["']/);
    const header = xml.slice(start, xml.indexOf('</b:widget>', start));
    expect(header, 'Header1 shows the FCD mark').toMatch(/class=["'][^"']*\bfcd-mark\b/);
    expect(header, 'Header1 title comes from the blog, not a hard-coded name').toMatch(/data:title/);
    expect(header).not.toMatch(/<img\b/);
    expect(visible).toMatch(/https:\/\/fastcyberdefense\.com/);
  });
});

describe('FCD palette', () => {
  it('uses none of the upstream personal palette', () => {
    const hits = colours(visible).filter((c) => isLedger(c.rgb));
    const lines = hits.length ? where((line) => colours(line).some((c) => isLedger(c.rgb))) : '';
    expect(tally(hits.map((c) => c.literal)), `upstream palette literals; source: ${lines}`).toEqual([]);
  });

  it('uses the fastcyberdefense.com tokens and the AA-safe text blues', () => {
    const all = colours(visible);
    const missing = Object.entries(FCD).filter(([, hex]) => !all.some((c) => near(c.rgb, fromHex(hex)))).map(([name, hex]) => `${name} ${hex}`);
    expect(missing).toEqual([]);
  });

  it('sets Inter for text and Fira Code for code, as on the main site', () => {
    expect(skin).toMatch(/font-family:\s*["']?Inter\b/);
    expect(skin).toMatch(/["']?Fira Code\b/);
  });
});
