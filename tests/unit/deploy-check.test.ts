import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
const expected = '0.1.0+' + 'a'.repeat(40);
const staging = 'https://staging.example/';
function run(html: string, status = 200, redirected = false, finalUrl = staging) {
  const mock = `globalThis.fetch=async()=>{const r=new Response(${JSON.stringify(html)},{status:${status}});Object.defineProperty(r,'url',{value:${JSON.stringify(finalUrl)}});Object.defineProperty(r,'redirected',{value:${redirected}});return r;};`;
  return spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(mock)}`, 'tools/deploy-check.ts'], { env: {...process.env, STAGING_URL:staging, EXPECTED_THEME_BUILD:expected}, encoding:'utf8', timeout:20000 });
}
const stamp = `<meta name="theme-build" content="${expected}">`;
const valid = `<html><head>${stamp}</head><body><main id="content"><article class="post-card"><h2 class="post-title"><a href="/2026/09/cloud-security.html">Cloud security guidance</a></h2></article></main></body></html>`;
it('accepts stamped, populated catalog DOM', () => { const r=run(valid); expect(r.status, r.stderr).toBe(0); }, 25000);
it.each([
 ['CSS-only empty body', `<head>${stamp}<style>.post-title{color:red}</style></head><body></body>`],
 ['build text outside metadata', `<div>${expected}</div><main id="content"><article class="post-card"><h2 class="post-title"><a href="/post">Article</a></h2></article></main>`],
 ['duplicate build metadata', valid.replace(stamp, stamp+stamp)],
 ['empty article', `<head>${stamp}</head><main id="content"><article class="article-view"><h1 class="post-title">Title only</h1><div id="article-body"></div></article></main>`],
 ['unusable catalog link', valid.replace('/2026/09/cloud-security.html', 'javascript:alert(1)')],
 ['hidden article', valid.replace('class="post-card"', 'class="post-card" hidden')],
 ['login page', `<head>${stamp}</head><body><style>.post-title{}</style><form><input type="password"></form></body>`]
])('rejects %s', (_name, html) => { const r=run(html); expect(r.status, r.stdout).not.toBe(0); }, 25000);
it('rejects redirects to another destination even if markup matches', () => { expect(run(valid, 200, true, 'https://accounts.example/login').status).not.toBe(0); }, 25000);
it('rejects failed HTTP responses', () => expect(run(valid, 503).status).not.toBe(0), 25000);
