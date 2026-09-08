import { expect, it } from 'vitest';
import { matchesQuery } from '../../src/scripts/search.ts';
it('matches title, excerpt, label and year case-insensitively', () => {
  expect(matchesQuery('Cloud Security access control 2026', 'CLOUD 2026')).toBe(true);
  expect(matchesQuery('Cloud Security access control 2026', 'malware')).toBe(false);
  expect(matchesQuery('Cloud Security', '   ')).toBe(true);
});
