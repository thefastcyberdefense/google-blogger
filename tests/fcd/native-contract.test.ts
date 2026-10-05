// US-L1: the native Blogger engine surface Ledger v1.7.0 proves on a live blog.
// The first FCD uploads (2026-10-04 and 2026-10-05) showed what breaks without it:
// an empty article page, "Subscribe to: Posts (Atom)" leaking under the home
// cards and Blogger's raw archive list. These checks read the CI-built XML.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const xml = readFileSync(new URL('../../dist/theme.xml', import.meta.url), 'utf8');

function widget(id: string): string {
  const start = xml.search(new RegExp(`<b:widget\\b[^>]*\\bid=["']${id}["']`));
  expect(start, `widget ${id} must exist`).toBeGreaterThanOrEqual(0);
  const end = xml.indexOf('</b:widget>', start);
  expect(end, `widget ${id} must close`).toBeGreaterThan(start);
  return xml.slice(start, end);
}

function emptyIncludable(body: string, id: string): boolean {
  return new RegExp(`<b:includable\\b[^>]*\\bid=["']${id}["'][^>]*(?:/>|>\\s*</b:includable>)`).test(body);
}

function includable(body: string, id: string): boolean {
  return new RegExp(`<b:includable\\b[^>]*\\bid=["']${id}["']`).test(body);
}

describe('native Blogger engine surface', () => {
  it('declares no maxwidgets on any section, so Blogger always instantiates saved gadgets', () => {
    const offenders = [...xml.matchAll(/<b:section\b[^>]*>/g)].map((m) => m[0]).filter((tag) => /\bmaxwidgets=/.test(tag));
    expect(offenders).toEqual([]);
  });

  it('stubs the Blog1 feed and pager chrome Blogger would otherwise print under the posts', () => {
    const blog = widget('Blog1');
    const missing = ['feedLinks', 'feedLinksBody', 'nextPageLink', 'previousPageLink', 'homePageLink'].filter((id) => !emptyIncludable(blog, id));
    expect(missing).toEqual([]);
  });

  it('gives super.main the engine includables it dispatches to on every view', () => {
    const blog = widget('Blog1');
    const missing = ['headerByline', 'snippetedPostByline', 'commentsLink', 'postFooterJumpLink', 'iframeComments', 'defaultAdUnit'].filter((id) => !includable(blog, id));
    expect(missing).toEqual([]);
  });

  it('ships default markups for the gadgets owners commonly save', () => {
    const missing = ['Common', 'PopularPosts', 'FeaturedPost', 'ContactForm', 'BlogArchive', 'Label', 'Attribution'].filter(
      (type) => !new RegExp(`<b:defaultmarkup\\b[^>]*\\btype=["']${type}["']`).test(xml)
    );
    expect(missing).toEqual([]);
  });

  it('stays within the 500,000-byte cap with exactly one build stamp', () => {
    expect(Buffer.byteLength(xml, 'utf8')).toBeLessThanOrEqual(500_000);
    expect(xml.match(/<meta\b[^>]*\bname=["']theme-build["']/g)?.length ?? 0).toBe(1);
  });
});
