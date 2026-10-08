// US-L12c: Ledger v1.8.0 adds an image preview (initImageLightbox) to post
// views. It opens the clicked image, or the image file a wrapping link points
// to, and its download falls back to a plain link to that source. FCD accepts
// only http(s) sources there: a link such as javascript:...png must not reach
// the preview, its download or its fallback link. The dialog's keyboard
// contract is checked too: focus moves to Close on open, Escape closes, and
// focus returns to the image that opened it.
// The built theme script runs over the static post view
// (tests/fcd/blogger-static.ts) with two images added to the post body; every
// request is blocked.
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

const IMAGES_HTML =
  '<p><img id="fcd-lb-plain" src="https://img.fcd.test/plain.png" alt="Network map" width="320" height="180"></p>' +
  '<p><a id="fcd-lb-link" href="javascript:window.__fcdPwned=1;//x.png"><img id="fcd-lb-hostile" src="https://img.fcd.test/linked.png" alt="Linked image" width="320" height="180"></a></p>';

// Runs before the theme script: adds the images to the post body.
const ADD_IMAGES = String.raw`
(() => {
  const body = document.querySelector('.post-body');
  (body || document.body).insertAdjacentHTML('beforeend', ${JSON.stringify(IMAGES_HTML)});
})();
`;

const STATE = String.raw`
(() => {
  const d = document.getElementById('image-lightbox');
  const img = d ? d.querySelector('.image-lightbox-img') : null;
  const a = document.activeElement;
  return {
    found: !!d,
    open: !!d && (d.open || d.hasAttribute('open')),
    src: img ? img.getAttribute('src') || '' : '',
    active: a ? (a.id || String(a.className || '') || a.tagName) : '',
    pwned: window.__fcdPwned === 1
  };
})()
`;

interface State { found: boolean; open: boolean; src: string; active: string; pwned: boolean }

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

describe('Ledger v1.8.0 image preview on a post', () => {
  it('opens only http(s) images and keeps the dialog keyboard contract', async () => {
    expect(THEME_SCRIPT.length, 'theme script').toBeGreaterThan(10_000);
    const { body } = renderTheme(tree, { view: 'post' });
    const end = body.lastIndexOf('</body>');
    if (end < 0) throw new Error('the post view has no </body>');
    // String slicing, not replace(): the theme script contains $ patterns.
    const html =
      '<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8">' +
      `<style>${SKIN}</style></head>` +
      body.slice(0, end) + `<script>${ADD_IMAGES}</script><script>${THEME_SCRIPT}</script>` + body.slice(end) + '</html>';
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/*', (route) => route.abort());
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForTimeout(800);

    const problems: string[] = [];
    await page.evaluate('document.getElementById("fcd-lb-plain").click()');
    await page.waitForTimeout(300);
    const opened = (await page.evaluate(STATE)) as State;
    if (!opened.found) problems.push('no #image-lightbox dialog');
    if (!opened.open) problems.push('a plain post image did not open the preview');
    if (!opened.src.startsWith('https://img.fcd.test/')) problems.push(`preview src ${JSON.stringify(opened.src)}`);
    if (!opened.active.includes('image-lightbox-btn-close')) problems.push(`focus on open is ${JSON.stringify(opened.active)}, not Close`);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closed = (await page.evaluate(STATE)) as State;
    if (closed.open) problems.push('Escape did not close the preview');
    if (closed.active !== 'fcd-lb-plain') problems.push(`focus after close is ${JSON.stringify(closed.active)}, not the image`);

    await page.evaluate('document.getElementById("fcd-lb-hostile").click()');
    await page.waitForTimeout(300);
    const hostile = (await page.evaluate(STATE)) as State;
    if (hostile.open && !/^https?:\/\//.test(hostile.src)) problems.push(`a javascript: link reached the preview: src ${JSON.stringify(hostile.src.slice(0, 60))}`);
    if (hostile.open) {
      await page.evaluate('document.querySelector("#image-lightbox [data-action=download-image]")?.click()');
      await page.waitForTimeout(400);
    }
    const after = (await page.evaluate(STATE)) as State;
    if (after.pwned) problems.push('the hostile link ran script');
    await page.close();
    expect(problems, `page errors: ${errors.join(' | ') || 'none'}`).toEqual([]);
  }, 60_000);
});
