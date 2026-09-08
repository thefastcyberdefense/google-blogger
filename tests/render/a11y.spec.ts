import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
for(const view of ['home','article','paged','empty','error'])test(`${view}: accessible initial and expanded states`,async({page},info)=>{
 await page.route('https://blogs.fastcyberdefense.com/**',async route=>{
  if(route.request().url().includes('/feeds/'))return route.fulfill({contentType:'application/json',body:'{"feed":{"entry":[]}}'});
  await route.fulfill({status:view==='error'?404:200,contentType:'text/html',body:await readFile(`.preview/${view}.html`,'utf8')});
 });
 await page.goto('/');await expect(page.locator('#recent-status')).toContainText('No recent posts');
 for(const state of ['initial','expanded']){
  if(state==='expanded'){
   if(await page.locator('#menu-toggle').isVisible())await page.locator('#menu-toggle').click();
   if(view==='article')await page.locator('.article-toc summary').click();
   if(view==='home'||view==='paged'){
    await page.locator('#search-query').fill('no-match-for-accessibility-check');
    await expect(page.locator('#filter-status')).toContainText('0 of');
   }
  }
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  await info.attach(`axe-${view}-${state}`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.violations).toEqual([]);
 }
 if(view==='article'){
  await expect(page.getByRole('table')).toHaveCount(2);
  await expect(page.getByRole('columnheader',{name:'System 12',exact:true})).toHaveCount(1);
 }
});
