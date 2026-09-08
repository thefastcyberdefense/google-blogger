import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const origin='https://blogs.fastcyberdefense.com';
const recent=['cloud-security','incident-response','zero-trust'];
test.beforeEach(async({page})=>{
  await page.route(`${origin}/**`,async route=>{
    const url=new URL(route.request().url());
    if(url.pathname.startsWith('/feeds/'))return route.fulfill({contentType:'application/json',body:JSON.stringify({feed:{entry:recent.map(slug=>({title:{$t:slug},link:[{rel:'alternate',href:`${origin}/2026/09/${slug}.html`}]}))}})});
    const view=['article','paged','empty','error'].includes(url.pathname.slice(1))?url.pathname.slice(1):'home';
    await route.fulfill({status:view==='error'?404:200,contentType:'text/html',body:await readFile(`.preview/${view}.html`,'utf8')});
  });
});
for(const view of ['home','article','paged','empty','error'])test(`${view} shared presentation fits with native-wrapper fixtures`,async({page},info)=>{
  const response=await page.goto(view==='home'?'/':`/${view}`);
  expect(response?.status()).toBe(view==='error'?404:200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#recent-posts a')).toHaveCount(3);
  for(let i=0;i<recent.length;i++)await expect(page.locator('#recent-posts a').nth(i)).toHaveAttribute('href',`${origin}/2026/09/${recent[i]}.html`);
  await expect(page.locator('#header #Header1 .brand')).toBeVisible();await expect(page.locator('#page_body #Blog1')).toBeVisible();
  if(view==='article'){await expect(page.locator('body')).toHaveClass('is-single');await expect(page.locator('.article-view #article-body')).toBeVisible();}
  if(view==='home'||view==='paged'){
    await expect(page.locator('.post-outer-container .post-card')).toHaveCount(4);
    await expect(page.locator('.card-image img')).toHaveCount(2);
    await expect.poll(()=>page.locator('.card-image img').evaluateAll(images=>images.every(img=>(img as HTMLImageElement).complete&&(img as HTMLImageElement).naturalWidth>0))).toBe(true);
  }
  if(view==='empty'||view==='error'){await expect(page.locator('.empty-state')).toBeVisible();await expect(page.locator('.post-card')).toHaveCount(0);}
  if(view==='paged'){await expect(page.locator('.pagination a[rel="prev"]')).toHaveAttribute('href','/');await expect(page.locator('.pagination a[rel="next"]')).toHaveAttribute('href',/updated-max/);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:info.outputPath(`${view}.png`),fullPage:true});
});
for(const view of ['home','article','paged','empty','error'])test(`${view} core content survives theme JavaScript disabled`,async({browser},info)=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:info.project.use.viewport,colorScheme:info.project.use.colorScheme});const page=await context.newPage();
  await page.route(`${origin}/**`,async route=>route.fulfill({status:view==='error'?404:200,contentType:'text/html',body:await readFile(`.preview/${view}.html`,'utf8')}));
  await page.goto(`${origin}/${view}`);
  await expect(page.locator('main#content')).toBeVisible();await expect(page.locator('form[role="search"]')).toBeVisible();
  await expect(page.locator('label[for="search-query"]')).toHaveText('Search articles');
  if(view==='article')await expect(page.locator('#article-body')).toBeVisible();
  if(view==='home'||view==='paged')await expect(page.locator('.post-card')).toHaveCount(4);
  if(view==='empty'||view==='error')await expect(page.locator('.empty-state')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);await context.close();
});
