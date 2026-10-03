import { afterAll, beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';

// L1-nav (design v1): the shipped b:skin CSS applied to the shared home fixture without theme
// JavaScript. The fixture links model the LinkList1 defaults from the shared mixin; contract C6
// pins the production gadget. Blogger rendering of the Navigation gadget stays a native checkpoint.
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
const listRule='.nav-list{display:flex;flex-wrap:wrap;gap:.125rem .25rem;margin:0;padding:0;list-style:none}';
const names=['Latest','Topics','Guides','Company website'];
const home=(styles=css)=>pug.renderFile('fixtures/home.pug',{css:styles,script:'',pretty:true});
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
async function measure(html:string,width:number){
  const page=await browser.newPage({viewport:{width,height:900}});
  try{
    await page.setContent(html);
    return await page.evaluate(()=>{
      const box=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,middle:r.y+r.height/2};};
      const one=(selector:string)=>{const el=document.querySelector(selector);if(!el)throw new Error('N1L_NAV_MISSING '+selector);return box(el);};
      return {
        brand:one('#Header1 .brand'),header:one('.site-header'),drawer:one('#primary-navigation'),search:one('#site-search'),
        links:Array.from(document.querySelectorAll('#primary-navigation .nav-link')).map(a=>({name:(a.textContent??'').replace('\u2197','').trim(),...box(a)})),
        overflow:document.documentElement.scrollWidth>innerWidth+1,
      };
    });
  }finally{await page.close();}
}
it('desktop masthead keeps the brand, the Navigation gadget links and search on one row',async()=>{
  const view=await measure(home(),1280);
  expect(view.links.map(link=>link.name),'N1L_NAV_LINKS').toEqual(names);
  for(const target of [...view.links,{...view.search,name:'search'}])
    expect(Math.abs(target.middle-view.brand.middle),`N1L_NAV_ONE_ROW ${target.name}`).toBeLessThanOrEqual(6);
  for(const link of view.links)expect(link.height,`N1L_NAV_TARGET ${link.name}`).toBeGreaterThanOrEqual(44);
  expect(view.header.height,`N1L_NAV_HEADER_HEIGHT ${view.header.height}px`).toBeLessThanOrEqual(120);
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
},25000);
it('narrow drawer stacks the Navigation gadget links as full-width targets above search',async()=>{
  const view=await measure(home(),390);
  expect(view.links.map(link=>link.name),'N1L_NAV_LINKS').toEqual(names);
  view.links.forEach((link,i)=>{
    expect(link.height,`N1L_NAV_TARGET ${link.name}`).toBeGreaterThanOrEqual(44);
    expect(link.width,`N1L_NAV_FULL_WIDTH ${link.name}`).toBeGreaterThanOrEqual(view.drawer.width-1);
    if(i)expect(link.y,`N1L_NAV_STACK ${link.name}`).toBeGreaterThanOrEqual(view.links[i-1].y+view.links[i-1].height-1);
  });
  const last=view.links[view.links.length-1];
  expect(view.search.y,'N1L_NAV_SEARCH_BELOW').toBeGreaterThanOrEqual(last.y+last.height-1);
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
},25000);
it('negative control: without the shipped list rule the desktop links leave the row',async()=>{
  expect(css,'N1L_NAV_RULE').toContain(listRule);
  const view=await measure(home(css.replace(listRule,'')),1280);
  expect(view.links.some(link=>Math.abs(link.middle-view.brand.middle)>6)).toBe(true);
},25000);
