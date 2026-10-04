import { afterAll, beforeAll, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';

// L1 US-004b: the shipped b:skin CSS applied to MODELS of Blogger Version 2 gadget output
// inside the production gadget homes (sidebar Profile and Archive, footer Attribution and
// Report Abuse). Contract checks C3, C4 and C10 pin the production wrappers; the inner gadget
// markup is modeled, not Blogger-rendered, so the native checkpoint remains required.
// US-016: the Profile list follows the first native upload (2026-10-04), where Blogger's own team
// list placed each avatar beside, not inside, the name link; the default avatar is the theme's.
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
const hideEmpty='.sidebar-widgets .gadget-card:not(.has-items){display:none}';
const avatar=(n:number)=>`data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22${n}%22%20height=%22${n}%22%3E%3Crect%20width=%22${n}%22%20height=%22${n}%22%20fill=%22%2353627b%22/%3E%3C/svg%3E`;
const model=(archive:boolean,styles=css)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Gadget homes model</title><style>${styles}</style></head><body>
<main class="container"><div class="fcd-layout"><div class="publication-stream"><p>Stream</p></div>
<aside class="sidebar" aria-label="Publication sidebar"><div class="sidebar-widgets section" id="sidebar">
<div class="widget Profile" data-version="2" id="Profile1"><div class="profile-card wrapper"><h2 class="widget-title">Authors</h2>
<div class="widget-content team"><ul>
<li><span class="default-avatar-wrapper fcd-avatar" aria-hidden="true"></span><a class="profile-name-link g-profile" href="/profile/a">Contributor A</a></li>
<li><img class="profile-img author-avatar" src="${avatar(113)}" width="64" height="64" alt=""><a class="profile-name-link g-profile" href="/profile/b">Contributor B</a></li>
</ul></div></div></div>
<div class="widget BlogArchive" data-version="2" id="BlogArchive1"><div class="gadget-card${archive?' has-items':''}"><h2 class="widget-title">Archive</h2>
<div class="widget-content">${archive?'<ul class="hierarchy"><li><a href="/2026/">2026</a> (3)</li></ul>':''}</div></div></div>
</div></aside></div></main>
<footer class="site-footer"><div class="container footer-grid"><div><p class="brand-name">Fast Cyber Defense</p></div></div>
<div class="footer-gadgets section" id="footer-gadgets">
<div class="widget Attribution" data-version="2" id="Attribution1"><p class="fcd-attribution"><a href="https://www.blogger.com" rel="nofollow">Powered by Blogger</a></p></div>
<div class="widget ReportAbuse" data-version="2" id="ReportAbuse1"><h3 class="title"><a class="report_abuse" href="https://www.blogger.com/go/report-abuse" rel="noopener nofollow" target="_blank">Report Abuse</a></h3></div>
</div></footer></body></html>`;
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
async function measure(html:string,width:number){
  const page=await browser.newPage({viewport:{width,height:900}});
  try{
    await page.setContent(html);
    return await page.evaluate(()=>{
      const box=(selector:string)=>{
        const el=document.querySelector(selector);if(!el)throw new Error('N1L_MODEL_MISSING '+selector);
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return {height:r.height,right:r.right,display:s.display,border:parseFloat(s.borderTopWidth)};
      };
      const fallback=document.querySelector('#Profile1 .fcd-avatar');if(!fallback)throw new Error('N1L_MODEL_MISSING default avatar');
      const fallbackBox=fallback.getBoundingClientRect();
      return {
        archive:box('#BlogArchive1 .gadget-card'),profile:box('#Profile1'),sidebar:box('#sidebar'),footer:box('#footer-gadgets'),
        avatars:Array.from(document.querySelectorAll('#Profile1 img')).map(img=>{const r=img.getBoundingClientRect();return Math.max(r.width,r.height);}),
        rows:Array.from(document.querySelectorAll('#Profile1 li')).map(li=>{
          const face=li.querySelector('img,.fcd-avatar'),name=li.querySelector('a');if(!face||!name)throw new Error('N1L_MODEL_MISSING profile row');
          const f=face.getBoundingClientRect(),n=name.getBoundingClientRect();
          return {offset:Math.abs((f.top+f.bottom)/2-(n.top+n.bottom)/2),beside:f.right<=n.left+1,marker:getComputedStyle(li).listStyleType};
        }),
        defaultAvatar:{min:Math.min(fallbackBox.width,fallbackBox.height),max:Math.max(fallbackBox.width,fallbackBox.height),fill:getComputedStyle(fallback).backgroundColor},
        footerText:Array.from(document.querySelectorAll('#footer-gadgets a')).map(a=>parseFloat(getComputedStyle(a).fontSize)),
        overflow:document.documentElement.scrollWidth>innerWidth+1,
      };
    });
  }finally{await page.close();}
}
it('ships the compiled skin the gadget homes depend on',()=>{
  expect(css.length).toBeGreaterThan(1000);expect(css,'N1L_ARCHIVE_RULE').toContain(hideEmpty);
});
for(const width of [390,1280])it(`gadget homes stay compact and honest at ${width}px`,async()=>{
  const empty=await measure(model(false),width),full=await measure(model(true),width);
  expect(empty.archive.display,'N1L_ARCHIVE_EMPTY_VISIBLE').toBe('none');
  expect(full.archive.display,'N1L_ARCHIVE_ITEMS_HIDDEN').not.toBe('none');
  expect(full.archive.height,'N1L_ARCHIVE_ITEMS_HIDDEN').toBeGreaterThan(0);
  expect(full.archive.border,'N1L_ARCHIVE_CARD').toBeGreaterThan(0);
  for(const view of [empty,full]){
    expect(view.avatars).toHaveLength(1);
    for(const size of view.avatars)expect(size,'N1L_PROFILE_AVATAR').toBeLessThanOrEqual(32.01);
    expect(view.rows).toHaveLength(2);
    for(const row of view.rows){
      expect(row.marker,'N1L_PROFILE_MARKERS').toBe('none');
      expect(row.beside,'N1L_PROFILE_ROW').toBe(true);
      expect(row.offset,'N1L_PROFILE_ROW').toBeLessThanOrEqual(4);
    }
    expect(view.defaultAvatar.min,'N1L_PROFILE_DEFAULT_AVATAR').toBeGreaterThanOrEqual(24);
    expect(view.defaultAvatar.max,'N1L_PROFILE_DEFAULT_AVATAR').toBeLessThanOrEqual(32.01);
    expect(view.defaultAvatar.fill,'N1L_PROFILE_DEFAULT_AVATAR').not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
    expect(view.profile.border,'N1L_PROFILE_CARD').toBeGreaterThan(0);
    expect(view.profile.right,'N1L_PROFILE_CONTAINMENT').toBeLessThanOrEqual(view.sidebar.right+1);
    expect(view.footerText).toHaveLength(2);
    for(const size of view.footerText)expect(size,'N1L_FOOTER_GADGET_TEXT').toBeLessThanOrEqual(14.01);
    expect(view.footer.height,'N1L_FOOTER_GADGET_HEIGHT').toBeLessThanOrEqual(48);
    expect(view.overflow,'N1L_OVERFLOW').toBe(false);
  }
},25000);
it('negative control: dropping the empty-archive rule is detected',async()=>{
  const view=await measure(model(false,css.replace(hideEmpty,'')),1280);
  expect(view.archive.display).not.toBe('none');expect(view.archive.height).toBeGreaterThan(0);
},25000);
