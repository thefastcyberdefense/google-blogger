import { expect, it } from 'vitest';
import { chromium } from 'playwright-core';
import { compile } from 'sass';
import { createRequire } from 'node:module';
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
it('a native twelve-column table scrolls locally with no theme JavaScript',async()=>{
 const css=compile('src/styles/main.scss').css;
 const html=pug.renderFile('fixtures/article.pug',{css,script:''});
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:900}});const page=await context.newPage();
  await page.setContent(html);
  const dimensions=await page.locator('#wide-table').evaluate(el=>({page:document.documentElement.scrollWidth,viewport:innerWidth,local:getComputedStyle(el).overflowX,width:el.clientWidth,scroll:el.scrollWidth}));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport+1);
  expect(['auto','scroll']).toContain(dimensions.local);
  expect(dimensions.scroll).toBeGreaterThan(dimensions.width);
 }finally{await browser.close();}
},20000);
