import { test, expect } from '../helpers/isolated-test.ts';
import { guardedAxe } from '../helpers/guarded-axe.ts';
for(const view of ['home','article','paged','empty','error'])test(`${view}: accessible initial and expanded states`,async({page,network},info)=>{
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
  const result=await guardedAxe(network,page).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
  await info.attach(`axe-${view}-${state}`,{body:JSON.stringify(result),contentType:'application/json'});
  expect(result.violations).toEqual([]);
 }
 if(view==='article'){
  await expect(page.getByRole('table')).toHaveCount(2);
  await expect(page.getByRole('columnheader',{name:'System 12',exact:true})).toHaveCount(1);
 }
});
