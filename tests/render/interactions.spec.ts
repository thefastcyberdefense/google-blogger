import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.beforeEach(async({page})=>{
  await page.route('https://blogs.fastcyberdefense.com/**',async route=>{
    if(route.request().url().includes('/feeds/')) return route.fulfill({status:503,body:'Unavailable'});
    await route.fulfill({contentType:'text/html',body:await readFile(`.preview/${new URL(route.request().url()).pathname==='/article'?'article':'home'}.html`,'utf8')});
  });
});
test('search shortcut, filtering, and feed failure remain usable',async({page})=>{
  await page.goto('/'); await page.keyboard.press('/'); await expect(page.locator('#search-query')).toBeFocused();
  await page.locator('#search-query').fill('remediation'); await expect(page.locator('[data-filter-card]:visible')).toHaveCount(1);
  await expect(page.locator('#filter-status')).toContainText('loaded articles');
  await expect(page.locator('#recent-status')).toContainText('could not be loaded');
  await page.locator('#search-query').fill(''); await expect(page.locator('[data-filter-card]:visible')).toHaveCount(4);
});
test('mobile disclosure returns focus on Escape',async({page})=>{
  await page.goto('/'); const button=page.locator('#menu-toggle');
  if(await button.isVisible()){await button.click();await expect(button).toHaveAttribute('aria-expanded','true');await page.locator('#search-query').focus();await page.keyboard.press('Escape');await expect(button).toBeFocused();await expect(page.locator('#primary-navigation')).toBeHidden();}
});
test('theme toggle, TOC and copy controls are enhanced',async({page})=>{
  await page.goto('/article');await page.locator('#theme-toggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme',/light|dark/);
  await page.locator('.article-toc summary').click();await page.locator('.article-toc a').first().click();await expect(page.locator('#article-body h2').first()).toBeFocused();
  await expect(page.getByRole('button',{name:'Copy bash code'})).toBeVisible();
});
