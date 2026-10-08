// US-L11: on the live blog (build 26ca599, 2026-10-08) any commenter whose
// display name contains "fcd" or "fast cyber defense" was shown with the
// company logo and the alt text "Fast Cyber Defense": Ledger chose the logo
// from the name a commenter types. Only comments Blogger itself marks as the
// blog's own (.blog-author) may carry the logo.
// The built theme script runs over the static post view
// (tests/fcd/blogger-static.ts) with five comments added to #comments; every
// request is blocked, so commenter photos fail to load as they would offline.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseXml, renderTheme } from './blogger-static.ts';
import { scripts } from './markup.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const xml = readFileSync(join(ROOT, 'dist/theme.xml'), 'utf8');
const tree = parseXml(xml);
const SKIN = xml.match(/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/)?.[1] ?? '';
const THEME_SCRIPT = scripts(xml).map((s) => s.inner).find((s) => s.includes('mermaid-diagram-wrap')) ?? '';
// A distinctive run of the logo path (tests/fcd/icon0.svg).
const LOGO_MARK = 'M747.61,0C334.71';

interface Commenter { id: string; name: string; author: boolean; logo: boolean }
const COMMENTERS: Commenter[] = [
  { id: 'fcd-c-short', name: 'FCD', author: false, logo: false },
  { id: 'fcd-c-full', name: 'Fast Cyber Defense', author: false, logo: false },
  { id: 'fcd-c-inside', name: 'Team FCD Support', author: false, logo: false },
  { id: 'fcd-c-reader', name: 'Jane Reader', author: false, logo: false },
  { id: 'fcd-c-owner', name: 'Fast Cyber Defense', author: true, logo: true }
];

const PHOTO = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEfixture/s35/photo.jpg';
const COMMENTS_HTML =
  '<ol class="fcd-comment-fixture">' +
  COMMENTERS.map(
    (c) =>
      `<li class="comment" id="${c.id}"><div class="avatar-image-container"><img src="${PHOTO}" alt="" width="35" height="35"></div>` +
      `<div class="comment-block"><div class="comment-header"><cite class="user${c.author ? ' blog-author' : ''}"><a href="#">${c.name}</a></cite></div>` +
      '<p class="comment-content">A comment.</p></div></li>'
  ).join('') +
  '</ol>';

// Runs before the theme script: adds the comments to the post's #comments
// (or a new one), as Blogger's server-rendered thread would be.
const ADD_COMMENTS = String.raw`
(() => {
  let section = document.getElementById('comments');
  if (!section) {
    section = document.createElement('section');
    section.id = 'comments';
    section.className = 'comments';
    const body = document.querySelector('.post-body');
    (body && body.parentElement ? body.parentElement : document.body).appendChild(section);
  }
  section.insertAdjacentHTML('beforeend', ${JSON.stringify(COMMENTS_HTML)});
})();
`;

const READ = String.raw`
(() => ${JSON.stringify(COMMENTERS.map((c) => c.id))}.map((id) => {
  const li = document.getElementById(id);
  const img = li ? li.querySelector('.avatar-image-container img') : null;
  const src = img ? img.getAttribute('src') || '' : '';
  let decoded = src;
  try { decoded = decodeURIComponent(src); } catch (e) { decoded = src; }
  return { id, found: !!img, logo: decoded.includes(${JSON.stringify(LOGO_MARK)}), alt: img ? img.getAttribute('alt') || '' : '', src: src.slice(0, 40) };
}))()
`;

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

interface Seen { id: string; found: boolean; logo: boolean; alt: string; src: string }

describe('Live blog, 2026-10-08: comment avatars', () => {
  it('shows the company logo only on comments Blogger marks as the blog author', async () => {
    expect(THEME_SCRIPT.length, 'theme script').toBeGreaterThan(10_000);
    const { body } = renderTheme(tree, { view: 'post' });
    const end = body.lastIndexOf('</body>');
    if (end < 0) throw new Error('the post view has no </body>');
    // String slicing, not replace(): the theme script contains $ patterns.
    const html =
      '<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">' +
      `<style>${SKIN}</style></head>` +
      body.slice(0, end) + `<script>${ADD_COMMENTS}</script><script>${THEME_SCRIPT}</script>` + body.slice(end) + '</html>';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (route) => route.abort());
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const seen = (await page.evaluate(READ)) as Seen[];
    await page.close();

    const problems: string[] = [];
    for (const c of COMMENTERS) {
      const s = seen.find((x) => x.id === c.id);
      if (!s || !s.found) {
        problems.push(`${c.name} (${c.id}): avatar not found`);
        continue;
      }
      if (s.logo !== c.logo) {
        problems.push(`${c.name}${c.author ? ' (blog author)' : ''}: ${s.logo ? 'shows' : 'does not show'} the company logo (alt "${s.alt}", src ${s.src})`);
      }
      if (!c.author && s.alt === 'Fast Cyber Defense') problems.push(`${c.name}: avatar alt claims "Fast Cyber Defense"`);
    }
    expect(problems, `page errors: ${errors.join(' | ') || 'none'}`).toEqual([]);
  }, 60_000);
});
