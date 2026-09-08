import { describe, expect, it } from 'vitest';
import { safePostUrl } from '../../src/scripts/safe-dom.ts';
describe('feed post URL boundary', () => {
  it.each(['javascript:alert(1)', 'data:text/html,x', 'https://evil.example/post', '//evil.example/post', 'http://blogs.fastcyberdefense.com/post', 'https://user:pass@blogs.fastcyberdefense.com/post'])('rejects %s', value => { expect(safePostUrl(value, 'https://blogs.fastcyberdefense.com/')).toBeNull(); });
  it('accepts same-origin Blogger permalinks', () => { expect(safePostUrl('/2026/09/security.html', 'https://blogs.fastcyberdefense.com/')).toBe('https://blogs.fastcyberdefense.com/2026/09/security.html'); });
  it('rejects non-string data', () => { expect(safePostUrl({}, 'https://blogs.fastcyberdefense.com/')).toBeNull(); });
});
