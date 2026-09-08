import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
for (const view of ['home','article']) test(`${view}: axe checks closed and open navigation`, async ({page},info)=>{
  await page.route('https://blogs.fastcyberdefense.com/**',async route=>{
    if(route.request().url().includes('/feeds/')) return route.fulfill({contentType:'application/json',body:'{"feed":{"entry":[]}}'});
    await route.fulfill({contentType:'text/html',body:await readFile(`.preview/${view}.html`,'utf8')});
  });
  await page.goto('/');
  for(const state of ['initial','expanded']){
    if(state==='expanded' && await page.locator('#menu-toggle').isVisible()) await page.locator('#menu-toggle').click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
    await info.attach(`axe-${state}`,{body:JSON.stringify(result,null,2),contentType:'application/json'});
    expect(result.violations).toEqual([]);
  }
});
