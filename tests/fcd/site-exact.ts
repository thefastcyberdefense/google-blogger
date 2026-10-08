// Owner decision, 2026-10-06, after the US-L9 palette build: the blog uses the
// exact colours of fastcyberdefense.com as the tweakcn theme exports them, not
// the deeper AA text values approved with the rebuild (#166fbe, #606d8e). Small
// text in the primary #3d8fe1 or the muted foreground #6e7b9d, and white labels
// on the primary, therefore sit below WCAG AA (3.38:1 and 4.21:1 on white,
// white on the primary 3.38:1), exactly as on the main site. The contrast
// checks accept those pairs down to the lowest ratio the site itself shows
// (the primary on the accent wash, 2.95:1); every other text keeps AA.
export type Rgb = readonly number[];

export const SITE_EXACT = {
  decided: '2026-10-06',
  // #3d8fe1 primary, #6e7b9d muted foreground
  inks: [
    [61, 143, 225],
    [110, 123, 157]
  ],
  // white labels on the primary
  fill: [61, 143, 225],
  floor: 2.9
} as const;

const near = (x: Rgb, y: Rgb): boolean => [0, 1, 2].every((i) => Math.abs((x[i] ?? 0) - (y[i] ?? 0)) <= 2);

// True when text of colour `text` on `surface` at `ratio` is one of the site's
// own exact pairs, at or above the floor.
export function siteExact(text: Rgb, surface: Rgb, ratio: number): boolean {
  if (ratio < SITE_EXACT.floor) return false;
  return SITE_EXACT.inks.some((c) => near(text, c)) || (near(surface, SITE_EXACT.fill) && near(text, [255, 255, 255]));
}

// The same check for scripts injected into the page.
export const SITE_EXACT_JS = `const SITE_EXACT = ${JSON.stringify(SITE_EXACT)};
  const siteExact = (text, surface, r) => {
    const near = (x, y) => [0, 1, 2].every((i) => Math.abs(x[i] - y[i]) <= 2);
    return r >= SITE_EXACT.floor && (SITE_EXACT.inks.some((c) => near(text, c)) || (near(surface, SITE_EXACT.fill) && near(text, [255, 255, 255])));
  };`;
