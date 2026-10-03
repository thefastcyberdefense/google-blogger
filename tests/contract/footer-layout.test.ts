import { afterAll, beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';

// L4-footer (design v1): the shipped b:skin CSS applied to the shared fixtures without theme JavaScript.
// The fixtures model the Footer gadget's default copy from the shared mixin; contract C9 pins the
// production gadget. Blogger rendering of the gadget and its saved copy stays a native checkpoint.
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
// The shipped two-column rule is found by selector and property, not by the compiler's exact spelling.
const columnRules=(css.match(/\.footer-grid\s*\{[^}]*\}/g)??[]).filter(rule=>/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/.test(rule));
const blurb='Security research and practical guidance from Fast Cyber Defense.';
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
async function measure(file:string,width:number,options:{styles?:string,colorScheme?:'light'|'dark'}={}){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:options.colorScheme??'light'});
  try{
    await page.setContent(pug.renderFile(file,{css:options.styles??css,script:'',pretty:true}));
    return await page.evaluate(blurb=>{
      const foot=document.querySelector('footer.site-footer'),grid=foot?.querySelector('.footer-grid'),base=foot?.querySelector('.footer-base');
      const brand=grid?.querySelector('.footer-brand'),nav=grid?.querySelector('nav.footer-links'),name=brand?.querySelector('.brand-name');
      const tagline=brand?.querySelector('.footer-tagline'),note=brand?.querySelector('.footer-blurb');
      if(!foot||!grid||!base||!brand||!nav||!name||!tagline||!note)throw new Error('N1L_FOOTER_MISSING brand, gadget copy, links and base row');
      const box=(e:Element)=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      const text=(e:Element|null)=>(e?.textContent??'').replace('\u2197','').replace(/\s+/g,' ').trim();
      const links=Array.from(nav.querySelectorAll('a'));
      const range=document.createRange();if(links[0]?.firstChild)range.selectNodeContents(links[0].firstChild);
      return {
        background:getComputedStyle(foot).backgroundColor,label:nav.getAttribute('aria-label'),
        name:text(name),tagline:text(tagline),blurb:text(note),blurbColor:getComputedStyle(note).color,
        links:links.map(a=>({text:text(a),href:a.getAttribute('href'),...box(a)})),
        firstText:range.getBoundingClientRect().left,
        brand:box(brand),nav:box(nav),grid:box(grid),base:box(base),baseBorder:getComputedStyle(base).borderTopWidth,
        copyright:text(base.querySelector('.footer-copyright')),
        headings:foot.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
        blurbs:Array.from(document.querySelectorAll('p,div')).filter(e=>text(e)===blurb).length,
        overflow:document.documentElement.scrollWidth>innerWidth+1,
      };
    },blurb);
  }finally{await page.close();}
}
type View=Awaited<ReturnType<typeof measure>>;
function common(view:View){
  expect([view.name,view.tagline,view.blurb],'N1L_FOOTER_COPY').toEqual(['Fast Cyber Defense','Quick to Act, Strong to Protect.',blurb]);
  expect(view.label,'N1L_FOOTER_NAV').toBe('Footer');
  expect(view.links.map(l=>[l.text,l.href]),'N1L_FOOTER_LINKS').toEqual([['Company website','https://fastcyberdefense.com/'],['Publication feed','/feeds/posts/default'],['Back to top','#top']]);
  for(const link of view.links)expect(link.height,'N1L_FOOTER_TARGET').toBeGreaterThanOrEqual(44);
  expect(view.base.top,'N1L_FOOTER_BASE').toBeGreaterThanOrEqual(view.grid.bottom-1);
  expect([view.baseBorder,view.copyright],'N1L_FOOTER_BASE').toEqual(['1px','\u00a9 Fast Cyber Defense']);
  expect([view.headings,view.blurbs],'N1L_FOOTER_ONE_BLURB').toEqual([0,1]);
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
}
it('home at 1280px: brand and copy on the left, the links on one row at the right',async()=>{
  const view=await measure('fixtures/home.pug',1280);common(view);
  expect([view.background,view.blurbColor],'N1L_FOOTER_SURFACE').toEqual(['rgb(255, 255, 255)','rgb(83, 98, 123)']);
  expect(view.nav.left,'N1L_FOOTER_COLUMNS').toBeGreaterThanOrEqual(view.brand.right);
  expect(new Set(view.links.map(l=>Math.round(l.top))).size,'N1L_FOOTER_ROW').toBe(1);
  expect(Math.abs(view.nav.bottom-view.brand.bottom),'N1L_FOOTER_ALIGN').toBeLessThanOrEqual(1);
},25000);
it('article at 390px in dark mode: the links stack under the copy, aligned with the brand',async()=>{
  const view=await measure('fixtures/article.pug',390,{colorScheme:'dark'});common(view);
  expect([view.background,view.blurbColor],'N1L_FOOTER_DARK').toEqual(['rgb(23, 33, 57)','rgb(180, 193, 212)']);
  expect(view.nav.top,'N1L_FOOTER_STACK').toBeGreaterThanOrEqual(view.brand.bottom);
  expect(Math.abs(view.firstText-view.brand.left),'N1L_FOOTER_ALIGN').toBeLessThanOrEqual(1);
},25000);
it('negative control: without the shipped column rule the links fall under the brand',async()=>{
  expect(columnRules.length,'N1L_FOOTER_RULE').toBe(1);
  const view=await measure('fixtures/home.pug',1280,{styles:css.replace(columnRules[0],'')});
  expect(view.nav.top).toBeGreaterThanOrEqual(view.brand.bottom);
},25000);
