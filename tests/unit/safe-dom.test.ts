import { describe, expect, it } from 'vitest';
import { safePostUrl } from '../../src/scripts/safe-dom.ts';
import { parseFeed } from '../../src/scripts/feed.ts';
const base = 'https://blogs.fastcyberdefense.com/';
describe('feed post URL boundary', () => {
  it.each(['javascript:alert(1)', 'data:text/html,x', 'https://evil.example/post', '//evil.example/post', 'http://blogs.fastcyberdefense.com/post', 'https://user:pass@blogs.fastcyberdefense.com/post'])('rejects %s', value => expect(safePostUrl(value, base)).toBeNull());
  it.each(['/2026/09/cloud-security.html', 'https://blogs.fastcyberdefense.com/2026/09/incident-response.html'])('accepts a valid hyphenated permalink: %s', value => expect(safePostUrl(value, base)).toBe(new URL(value, base).href));
  it('accepts a hyphenated same-origin staging hostname', () => expect(safePostUrl('/feeds/posts/default', 'https://fcd-staging.blogspot.com/')).toBe('https://fcd-staging.blogspot.com/feeds/posts/default'));
  it.each(Array.from({ length: 32 }, (_, i) => i).concat(127))('rejects control character code %i before URL normalization', code => expect(safePostUrl('/cloud' + String.fromCharCode(code) + 'security.html', base)).toBeNull());
  it('rejects non-string data', () => expect(safePostUrl({}, base)).toBeNull());
  it('preserves multiple real-world feed slugs', () => {
    const slugs = ['cloud-security', 'incident-response', 'zero-trust'];
    const posts = parseFeed({ feed: { entry: slugs.map(slug => ({title: {$t: slug}, link: [{rel: 'alternate', href: `${base}2026/09/${slug}.html`}] })) } }, base);
    expect(posts.map(p => p.url)).toEqual(slugs.map(slug => `${base}2026/09/${slug}.html`));
  });
});
