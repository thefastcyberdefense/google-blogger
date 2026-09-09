import {test,expect} from '@playwright/test';

test('initial homepage identifies one lead and two secondary cards in native order',async({page})=>{
 await page.goto('/home');
 await expect(page.locator('[data-editorial-role="lead"]')).toHaveCount(1);
 await expect(page.locator('[data-editorial-role="secondary"]')).toHaveCount(2);
 await expect(page.locator('[data-editorial-role="standard"]')).toHaveCount(1);
 const urls=await page.locator('.post-card h2 a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
 expect(new Set(urls).size).toBe(urls.length);
});
test('homepage lead image is eager and the only high-priority image',async({page})=>{
 await page.goto('/home');const image=page.locator('.post-card').first().locator('img');
 await expect(image).toHaveAttribute('loading','eager');await expect(image).toHaveAttribute('fetchpriority','high');
 await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(1);
});
test('filtering switches out of editorial composition and clearing restores it',async({page})=>{
 await page.goto('/home');const input=page.locator('#search-query');await input.fill('incident');
 await expect(page.locator('.blog-posts')).toHaveAttribute('data-filter-active','true');
 await expect(page.locator('[data-filter-card]:visible')).toHaveCount(1);
 await input.fill('');await expect(page.locator('.blog-posts')).toHaveAttribute('data-filter-active','false');
 await expect(page.locator('[data-filter-card]:visible')).toHaveCount(4);
});
test('paginated catalog never advertises homepage lead roles or image priority',async({page})=>{
 await page.goto('/paged');await expect(page.locator('[data-editorial-role="lead"],[data-editorial-role="secondary"]')).toHaveCount(0);
 await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(0);await expect(page.locator('.blog-pager-older-link')).toHaveAttribute('href','/search?updated-max=2026-09-01');
});
test('print retains article content but removes interactive and promotional chrome',async({page})=>{
 await page.goto('/article');await page.emulateMedia({media:'print'});
 await expect(page.locator('#article-body')).toBeVisible();await expect(page.locator('.site-header')).toBeHidden();
 await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('.article-cta')).toBeHidden();await expect(page.locator('.code-toolbar')).toBeHidden();
 expect(await page.locator('#article-body pre').first().evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
});
