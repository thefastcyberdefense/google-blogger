import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
const origin='https://blogs.fastcyberdefense.com';
const hostile='<img src=x onerror=alert(1)> & "quoted"';
const cases=[
 ['error','Page not found'],['label','No articles under this label'],
 ['search','No matching articles'],['archive','No articles in this period'],
 ['home','No articles published yet'],['generic','No articles on this page']
] as const;
for(const [state,heading] of cases)for(const javaScriptEnabled of [true,false]){
 test(`${state}: distinct safe recovery with JS ${javaScriptEnabled}`,async({browser},info)=>{
  const context=await browser.newContext({javaScriptEnabled,viewport:info.project.use.viewport,colorScheme:info.project.use.colorScheme});
  const page=await context.newPage();const requests:string[]=[];let dialogs=0;
  page.on('dialog',async d=>{dialogs++;await d.dismiss();});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());requests.push(url.href);
   if(url.origin!==origin)return route.abort();
   if(url.pathname.startsWith('/feeds/'))return route.fulfill({contentType:'application/json',body:'{"feed":{"entry":[]}}'});
   if(url.pathname===`/state-${state}`)return route.fulfill({status:state==='error'?404:200,contentType:'text/html',body:await readFile(`.preview/state-${state}.html`,'utf8')});
   if(url.pathname==='/search'||url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="en"><title>Recovery destination</title><body><h1>Recovery destination</h1></body></html>'});
   return route.abort();
  });
  try{
   const response=await page.goto(`${origin}/state-${state}`);expect(response?.status()).toBe(state==='error'?404:200);
   const section=page.locator('section.empty-state');await expect(section).toHaveCount(1);
   await expect(section).toHaveAttribute('data-empty-state',state);
   await expect(section.getByRole('heading',{level:2})).toHaveText(heading);
   await expect(page.locator('main h1')).toHaveCount(1);
   await expect(page.locator('[data-filter-card], .pagination')).toHaveCount(0);
   if(['label','search','archive'].includes(state))await expect(section.locator('.empty-context')).toHaveText(hostile);
   await expect(section.locator('img,script')).toHaveCount(0);expect(dialogs).toBe(0);
   expect(requests.some(url=>url.includes('/x')||!url.startsWith(origin+'/'))).toBe(false);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   if(javaScriptEnabled){
    const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    await info.attach(`axe-native-${state}`,{body:JSON.stringify(results,null,2),contentType:'application/json'});
    expect(results.violations).toEqual([]);
   }
   const input=section.getByRole('searchbox',{name:'Search the publication',exact:true});await input.fill('cloud & identity');
   await input.press('Enter');await expect(page).toHaveURL(origin+'/search?q=cloud+%26+identity');
   await page.goto(`${origin}/state-${state}`);
   const home=page.locator('section.empty-state').getByRole('link',{name:'Return to publication',exact:true});
   await home.focus();await expect(home).toBeFocused();await home.press('Enter');await expect(page).toHaveURL(origin+'/');
  }finally{await context.close();}
 });
}
