// US-L12a: Ledger v1.8.0 (redwan-cse/ledger-blogger-theme f3647ef, 2026-10-06)
// found the post JSON-LD description invalid: a b:eval that chains snippet()
// over data:post.snippets.long with ?: fallbacks. The FCD head
// (src/partials/head-meta.pug) carries the same line onto the live blog. The
// description must be one of Blogger's plain data values instead: the post's
// short snippet, else the view description, else the title.
// The check reads the BlogPosting JSON-LD in the CI-built XML, resolves its
// b:if branches for each case with the static renderer's condition
// evaluator, stands in every data value by its name and parses the result.
// A static reading cannot prove what Blogger serves; the owner's view of the
// rendered post (or Google's Rich Results Test) is the native evidence.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { evaluate } from './blogger-static.ts';
import { blocks } from './markup.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const LD = blocks(xml, '<script', '</script>', (open) => open.includes('application/ld+json')).map((b) => b.inner);
const POSTINGS = LD.filter((s) => s.includes('"BlogPosting"'));

// Each <data:x.jsonEscaped/> becomes its name (x) and each <b:eval .../>
// becomes the text b:eval, so the parsed JSON names the source of a value.
function standIns(text: string): string {
  let out = '';
  let at = 0;
  for (;;) {
    const data = text.indexOf('<data:', at);
    const expr = text.indexOf('<b:eval', at);
    const start = data < 0 ? expr : expr < 0 ? data : Math.min(data, expr);
    if (start < 0) return out + text.slice(at);
    const end = text.indexOf('/>', start);
    if (end < 0) return out + text.slice(at);
    const name = text.slice(start + '<data:'.length, end).trim();
    out += text.slice(at, start) + (start === data ? (name.endsWith('.jsonEscaped') ? name.slice(0, -'.jsonEscaped'.length) : name) : 'b:eval');
    at = end + 2;
  }
}

// Resolves the (unnested) b:if blocks of the JSON-LD for the known values.
function resolve(text: string, known: Record<string, boolean>): string {
  let out = text;
  for (const b of blocks(text, '<b:if', '</b:if>').reverse()) {
    const cond = b.open.match(/cond=(["'])(.*?)\1/)?.[2] ?? '';
    const v = evaluate(cond, known);
    if (v === null) throw new Error(`condition the check cannot resolve in the BlogPosting JSON-LD: ${cond}`);
    out = out.slice(0, b.start) + (v ? b.inner : '') + out.slice(b.end);
  }
  return standIns(out);
}

const PRESENT: Record<string, boolean> = {
  'data:post.lastUpdated': true,
  'data:view.featuredImage': true,
  'data:post.author.profileUrl': true,
  'data:post.author.authorPhoto.image': true
};

const CASES = [
  { name: 'a post with a snippet', known: { 'data:post.snippets.short': true, 'data:view.description': true }, want: 'post.snippets.short' },
  { name: 'a post with only a search description', known: { 'data:post.snippets.short': false, 'data:view.description': true }, want: 'view.description' },
  { name: 'a post with neither', known: { 'data:post.snippets.short': false, 'data:view.description': false }, want: 'view.title' }
];

describe('Post structured data (Ledger v1.8.0 f3647ef)', () => {
  it('ships exactly one BlogPosting JSON-LD block', () => {
    expect(POSTINGS).toHaveLength(1);
  });

  for (const c of CASES) {
    it(`describes ${c.name} with a plain Blogger value, not a b:eval chain`, () => {
      const json = resolve(POSTINGS[0] ?? '', { ...PRESENT, ...c.known });
      let parsed: Record<string, unknown> = {};
      expect(() => {
        parsed = JSON.parse(json) as Record<string, unknown>;
      }, `BlogPosting JSON-LD does not parse: ${json.slice(0, 800)}`).not.toThrow();
      expect(json.split('"description"').length - 1, 'description keys').toBe(1);
      expect(parsed['description'], `description source; JSON-LD: ${json.slice(0, 800)}`).toBe(c.want);
    });
  }
});
