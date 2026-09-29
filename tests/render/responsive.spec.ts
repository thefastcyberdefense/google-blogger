import { test, expect, FIXTURE_ORIGIN } from '../helpers/isolated-test.ts';
const origin=FIXTURE_ORIGIN;
const recent=['cloud-security','incident-response','zero-trust'];
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
test.describe(()=>{
  test.use({javaScriptEnabled:false});
  for(const view of ['home','article','paged','empty','error'])test(`${view} core content survives theme JavaScript disabled`,async({page})=>{
    await page.goto(`${origin}/${view}`);
    await expect(page.locator('main#content')).toBeVisible();await expect(page.locator('#site-search[role="search"]')).toBeVisible();
    await expect(page.locator('label[for="search-query"]')).toHaveText('Search articles');
    if(view==='article')await expect(page.locator('#article-body')).toBeVisible();
    if(view==='home'||view==='paged')await expect(page.locator('.post-card')).toHaveCount(4);
    if(view==='empty'||view==='error'){
      await expect(page.locator('.empty-state')).toBeVisible();
      const recovery=page.getByRole('search',{name:'Recovery search',exact:true});
      await expect(recovery).toBeVisible();await expect(recovery).toHaveAttribute('method','get');await expect(recovery).toHaveAttribute('action','/search');
      await expect(recovery.getByRole('searchbox',{name:'Search the publication',exact:true})).toBeVisible();
      await expect(page.locator('form[role="search"]')).toHaveCount(2);
    }else await expect(page.locator('form[role="search"]')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  });
});
