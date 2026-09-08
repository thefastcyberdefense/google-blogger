import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const origin='https://blogs.fastcyberdefense.com';
test.beforeEach(async({page})=>{
 await page.route(`${origin}/**`,async route=>{
  if(route.request().url().includes('/feeds/'))return route.fulfill({status:503,body:'Unavailable'});
  await route.fulfill({contentType:'text/html',body:await readFile(`.preview/${new URL(route.request().url()).pathname==='/article'?'article':'home'}.html`,'utf8')});
 });
});
test('search shortcuts filter honestly and preserve native full-blog submission',async({page})=>{
 await page.goto('/');await page.keyboard.press('/');await expect(page.locator('#search-query')).toBeFocused();
 await page.locator('#search-query').fill('remediation');await expect(page.locator('[data-filter-card]:visible')).toHaveCount(1);
 await expect(page.locator('#filter-status')).toContainText('loaded articles');await expect(page.locator('#recent-status')).toContainText('could not be loaded');
 await page.locator('#search-query').fill('');await page.keyboard.type('/');await expect(page.locator('#search-query')).toHaveValue('/');
 await page.locator('#search-query').fill('cloud defense');
 const request=page.waitForRequest(r=>r.isNavigationRequest()&&new URL(r.url()).pathname==='/search');
 await page.getByRole('button',{name:'Search blog',exact:true}).click();
 const sent=await request;expect(sent.method()).toBe('GET');expect(new URL(sent.url()).searchParams.get('q')).toBe('cloud defense');
 await page.locator('#theme-toggle').focus();await page.keyboard.press('Control+k');await expect(page.locator('#search-query')).toBeFocused();
});
test('navigation adapts to viewport and Escape returns focus',async({page})=>{
 await page.goto('/');const button=page.locator('#menu-toggle');
 if(page.viewportSize()!.width<640){
  await expect(button).toBeVisible();await expect(page.locator('#primary-navigation')).toBeHidden();
  await button.click();await expect(button).toHaveAttribute('aria-expanded','true');await page.locator('#search-query').focus();await page.keyboard.press('Escape');
  await expect(button).toBeFocused();await expect(page.locator('#primary-navigation')).toBeHidden();
  await page.keyboard.press('Tab');expect(await page.locator('#primary-navigation').evaluate(el=>el.contains(document.activeElement))).toBe(false);
 }else{await expect(button).toBeHidden();await expect(page.locator('#primary-navigation')).toBeVisible();}
});
test('theme persists normally and TOC moves keyboard focus',async({page})=>{
 await page.goto('/article');const toggle=page.locator('#theme-toggle');const before=await toggle.getAttribute('aria-label');
 await toggle.click();expect(await toggle.getAttribute('aria-label')).not.toBe(before);const selected=await page.locator('html').getAttribute('data-theme');
 expect(await page.evaluate(()=>localStorage.getItem('fcd-theme'))).toBe(selected);
 await page.locator('.article-toc summary').click();await page.locator('.article-toc a').first().click();await expect(page.locator('#article-body h2').first()).toBeFocused();
 await expect(page.getByRole('button',{name:'Copy bash code'})).toBeVisible();
});
test('copy controls report success and denial with accurate payloads',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{
   if(document.documentElement.dataset.denyClipboard==='true')throw new Error('Permission denied');
   document.documentElement.dataset.copied=text;
  }}});
 });
 await page.goto('/article');const code=await page.locator('pre code').first().textContent();
 await page.getByRole('button',{name:'Copy bash code'}).click();await expect(page.locator('#fcd-status')).toHaveText('Code copied');
 expect(await page.locator('html').getAttribute('data-copied')).toBe(code);
 await page.locator('#copy-link').click();await expect(page.locator('#fcd-status')).toHaveText('Article link copied');
 expect(await page.locator('html').getAttribute('data-copied')).toBe(`${origin}/article`);
 await page.evaluate(()=>{document.documentElement.dataset.denyClipboard='true';});
 await page.getByRole('button',{name:'Copy bash code'}).click();await expect(page.locator('#fcd-status')).toContainText('Copy unavailable');
 await page.locator('#copy-link').click();await expect(page.locator('#fcd-status')).toContainText('Copy unavailable');
});
test('storage failure and reduced motion do not disable essential controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('Storage blocked');};Storage.prototype.getItem=function(){throw new Error('Storage blocked');};});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/article');await page.locator('#theme-toggle').click();await expect(page.locator('html')).toHaveAttribute('data-theme',/light|dark/);
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
 await page.locator('.article-toc summary').click();await page.locator('.article-toc a').first().click();await expect(page.locator('#article-body h2').first()).toBeFocused();expect(errors).toEqual([]);
});
test('wide evidence tables retain local keyboard scrolling and semantics',async({page})=>{
 await page.goto('/article');const table=page.locator('#wide-table');const region=table.locator('..');
 await expect(page.getByRole('columnheader',{name:'System 12',exact:true})).toHaveCount(1);
 await region.focus();await expect(region).toBeFocused();
 const widths=await region.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
 // ArrowRight is the native horizontal-scroll key; End targets vertical scrolling in Chromium.
 if(widths.scroll>widths.client){await page.keyboard.press('ArrowRight');await expect.poll(()=>region.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('skip link works and 200 percent text retains page reflow',async({page})=>{
 await page.goto('/article');await page.keyboard.press('Tab');await expect(page.locator('.skip-link')).toBeFocused();await page.keyboard.press('Enter');await expect(page.locator('main#content')).toBeFocused();
 await page.addStyleTag({content:'html{font-size:200%}'});
 const reflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,overflow:Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1&&!el.closest('pre,table,.table-scroll')).map(el=>el.tagName+'.'+el.className)}));
 expect(reflow.width,JSON.stringify(reflow)).toBeLessThanOrEqual(reflow.viewport+1);
 await expect(page.locator('#article-body')).toBeVisible();
 // Text scaling is not a claim of browser 400% zoom or human screen-reader validation.
});
