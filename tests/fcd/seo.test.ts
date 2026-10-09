// US-L12a: Ledger v1.8.0 (redwan-cse/ledger-blogger-theme f3647ef, 2026-10-06)
// found the post JSON-LD description invalid: a b:eval that chains snippet()
// over data:post.snippets.long with ?: fallbacks. The FCD head
// (src/partials/head-meta.pug) carried the same line onto the live blog.
// US-L12e: on the live blog (build 48fa7fd, owner's view-source 2026-10-08)
// the head's article:published_time and article:author read empty: the head
// binds the post through data:widgets.Blog.first.posts.first, and Blogger
// leaves that empty there. The BlogPosting JSON-LD therefore lives in the
// Blog widget's postMeta includable, where Blogger binds data:post (the
// byline shows the date and author), only on post views; the head reads no
// data:post values at all.
// US-L12f: on the live blog (build 4b4ccca, owner's view-source 2026-10-09)
// the description read "Overview \u0026amp; Defensive Context ...": Blogger
// serves data:post.snippets.short HTML-escaped, so .jsonEscaped escapes the
// entity a second time, and Blogger has no operator that unescapes it.
// Google's Article structured data does not list description among its
// recommended properties, so the BlogPosting carries none; the recommended
// ones (headline, datePublished, dateModified, image, author) stay.
// US-L12g: Google's Rich Results Test on the live post (build 0ab9602,
// 2026-10-10) found two Article items: the JSON-LD and a second BlogPosting
// from the microdata the Ledger base put on the post markup (itemscope on
// article.post, itemprop on the title, date, body and excerpt), flagged for
// missing author and image. Google does not document merging the two formats,
// so the theme ships no microdata and the JSON-LD is the only BlogPosting.
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
import { blocks, withoutBlocks } from './markup.ts';

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
  { name: 'a post with a snippet', known: { 'data:post.snippets.short': true, 'data:view.description': true } },
  { name: 'a post with only a search description', known: { 'data:post.snippets.short': false, 'data:view.description': true } },
  { name: 'a post with neither', known: { 'data:post.snippets.short': false, 'data:view.description': false } }
];

// Google's recommended Article properties the post data can fill.
const RECOMMENDED = ['headline', 'datePublished', 'dateModified', 'image', 'author'];

const HEAD_START = xml.indexOf('<head>');
// The head as Blogger evaluates it: b:defaultmarkups sits in the head but only
// holds includables the widgets render in the body.
const HEAD = withoutBlocks(HEAD_START < 0 ? '' : xml.slice(HEAD_START, xml.indexOf('</head>', HEAD_START)), '<b:defaultmarkups', '</b:defaultmarkups>');
const POST_META = blocks(xml, '<b:includable', '</b:includable>', (open) => /\bid=(["'])postMeta\1/.test(open)).map((b) => b.inner);

describe('Post structured data reads the post where Blogger binds it (US-L12e)', () => {
  it('the head reads no data:post values', () => {
    expect(HEAD.length, 'head').toBeGreaterThan(1000);
    const uses = HEAD.match(/data:post\.[\w.]+/g) ?? [];
    expect(uses, 'data:post in the head reads empty on live Blogger (48fa7fd: article:published_time and article:author)').toEqual([]);
  });

  it('the BlogPosting JSON-LD is in the Blog widget postMeta, on post views only', () => {
    const withLd = POST_META.filter((inner) => inner.includes('"@type": "BlogPosting"'));
    expect(withLd, `postMeta includables: ${POST_META.length}`).toHaveLength(1);
    const inner = withLd[0] ?? '';
    const guard = blocks(inner, '<b:if', '</b:if>', (open) => open.includes('data:view.isPost')).find((b) => b.inner.includes('"@type": "BlogPosting"'));
    expect(guard, 'BlogPosting script inside a data:view.isPost guard').toBeDefined();
    expect(HEAD.includes('"BlogPosting"'), 'BlogPosting left in the head').toBe(false);
  });
});

describe('Post structured data (Ledger v1.8.0 f3647ef, US-L12f)', () => {
  it('ships exactly one BlogPosting JSON-LD block', () => {
    expect(POSTINGS).toHaveLength(1);
  });

  for (const c of CASES) {
    it(`carries no description for ${c.name} and keeps the recommended properties`, () => {
      const json = resolve(POSTINGS[0] ?? '', { ...PRESENT, ...c.known });
      let parsed: Record<string, unknown> = {};
      expect(() => {
        parsed = JSON.parse(json) as Record<string, unknown>;
      }, `BlogPosting JSON-LD does not parse: ${json.slice(0, 800)}`).not.toThrow();
      expect(
        parsed['description'],
        `description in the BlogPosting (live 4b4ccca: Blogger's HTML-escaped snippet read \\u0026amp; after .jsonEscaped); JSON-LD: ${json.slice(0, 800)}`
      ).toBeUndefined();
      expect(json.includes('"description"'), 'description key anywhere in the BlogPosting').toBe(false);
      expect(RECOMMENDED.filter((k) => !(k in parsed)), `missing recommended properties; JSON-LD: ${json.slice(0, 800)}`).toEqual([]);
    });
  }
});

describe('One BlogPosting per post: no microdata (US-L12g)', () => {
  it('the theme XML carries no microdata attributes', () => {
    const found: string[] = [];
    const re = /\bitem(?:prop|scope|type|id|ref)\s*=/g;
    for (let m = re.exec(xml); m; m = re.exec(xml)) {
      found.push(xml.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' '));
    }
    expect(found, `${found.length} microdata attributes in the theme (live 0ab9602: a second, incomplete BlogPosting in the Rich Results Test)`).toEqual([]);
  });
});
