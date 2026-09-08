import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.beforeEach(async ({ page }) => {
  await page.route('https://blogs.fastcyberdefense.com/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/feeds/')) return route.fulfill({ contentType:'application/json',body:JSON.stringify({feed:{entry:[{title:{$t:'Latest security research'},link:[{rel:'alternate',href:'https://blogs.fastcyberdefense.com/article'}]}]}}) });
    await route.fulfill({contentType:'text/html',body:await readFile(`.preview/${url.pathname === '/article' ? 'article' : 'home'}.html`,'utf8')});
  });
});
for (const path of ['/', '/article']) test(`${path} fits the viewport with readable content`, async ({page}, info) => {
  await page.goto(path); await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#recent-posts a')).toHaveText('Latest security research');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.screenshot({path:info.outputPath(`${path === '/' ? 'home' : 'article'}.png`),fullPage:true});
});
test('core article survives JavaScript disabled', async ({browser}, info) => {
  const context=await browser.newContext({javaScriptEnabled:false,viewport:info.project.use.viewport}); const page=await context.newPage();
  await page.route('**/*',async route=>route.fulfill({contentType:'text/html',body:await readFile('.preview/article.html','utf8')}));
  await page.goto('https://blogs.fastcyberdefense.com/article');
  await expect(page.locator('#article-body')).toBeVisible(); await expect(page.locator('form[role="search"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true); await context.close();
});
