import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
const origin='https://blogs.fastcyberdefense.com';
test.beforeEach(async({page})=>{
 await page.route(origin+'/**',async route=>{
  const url=new URL(route.request().url());if(url.pathname.startsWith('/feeds/'))return route.fulfill({contentType:'application/json',body:'{"feed":{"entry":[]}}'});
  const name=url.pathname.slice(1)||'home';const allowed=/^(home|article|paged|label|search|archive|editorial-(direct|grouped)-(0|1|2|3|8))$/.test(name)?name:'home';
  await route.fulfill({contentType:'text/html',body:await readFile(`.preview/${allowed}.html`,'utf8')});
 });
});
test('initial homepage identifies one lead and two secondary cards in native order',async({page},info)=>{
 await page.goto('/home');
 await expect(page.locator('[data-editorial-role="lead"]')).toHaveCount(1);await expect(page.locator('[data-editorial-role="secondary"]')).toHaveCount(2);await expect(page.locator('[data-editorial-role="standard"]')).toHaveCount(1);
 const urls=await page.locator('.post-card h2 a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));expect(new Set(urls).size).toBe(urls.length);
 expect(urls).toEqual([0,1,2,3].map(i=>`/2026/09/fixture-${i}.html`));
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach('editorial-axe',{body:JSON.stringify(scan),contentType:'application/json'});expect(scan.violations).toEqual([]);
 await page.screenshot({path:info.outputPath('editorial-home.png'),fullPage:true});
});
test('homepage lead image is eager and the only high-priority image',async({page})=>{
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));await page.goto('/home');const image=page.locator('.post-card').first().locator('img');
 await expect(image).toHaveAttribute('loading','eager');await expect(image).toHaveAttribute('fetchpriority','high');await expect(image).toHaveAttribute('width','800');await expect(image).toHaveAttribute('height','450');await expect(image).toHaveAttribute('srcset',/1200w/);
 await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(1);await expect(page.locator('.post-card').nth(2).locator('img')).toHaveAttribute('loading','lazy');
 expect(requests.filter(url=>!url.startsWith(origin)&&!url.startsWith('data:'))).toEqual([]);
});
test('filtering switches out of editorial composition and clearing restores it',async({page},info)=>{
 await page.goto('/home');await page.keyboard.press('/');const input=page.locator('#search-query');await expect(input).toBeFocused();await input.fill('incident');
 await expect(page.locator('.blog-posts')).toHaveAttribute('data-filter-active','true');await expect(page.locator('[data-filter-card]:visible')).toHaveCount(1);await expect(page.locator('#filter-status')).toContainText('1 of 4');
 await page.screenshot({path:info.outputPath('editorial-filtered.png'),fullPage:true});
 await input.fill('');await expect(page.locator('.blog-posts')).toHaveAttribute('data-filter-active','false');await expect(page.locator('[data-filter-card]:visible')).toHaveCount(4);
 await input.fill('no-matching-phrase');await expect(page.locator('[data-filter-card]:visible')).toHaveCount(0);await expect(page.locator('#filter-status')).toContainText('0 of 4');
 await page.locator('form[role="search"]').evaluate(form=>(form as HTMLFormElement).reset());await expect(page.locator('[data-filter-card]:visible')).toHaveCount(4);
 await input.fill('cloud');await input.press('Enter');await expect(page).toHaveURL(/\/search\?q=cloud/);
});
test('paginated catalog never advertises homepage lead roles or image priority',async({page})=>{
 for(const view of ['paged','label','search','archive']){await page.goto('/'+view);await expect(page.locator('[data-editorial-role="lead"],[data-editorial-role="secondary"]')).toHaveCount(0);await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(0);}
 await page.goto('/paged');await expect(page.locator('.blog-pager-older-link')).toHaveAttribute('href','/search?updated-max=2026-09-01');
});
test('print retains article content but removes interactive and promotional chrome',async({page},info)=>{
 await page.goto('/article');await page.emulateMedia({media:'print'});
 await expect(page.locator('#article-body')).toBeVisible();await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.sidebar')).toBeHidden();await expect(page.locator('.article-cta')).toBeHidden();await expect(page.locator('.code-toolbar')).toBeHidden();
 expect(await page.locator('#article-body pre').first().evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('pre-wrap');await page.screenshot({path:info.outputPath('article-print.png'),fullPage:true});
});
test('small catalogs and grouped native-wrapper models preserve every post',async({page})=>{
 for(const wrapper of ['direct','grouped'])for(const count of [0,1,2,3,8]){
  await page.goto(`/editorial-${wrapper}-${count}`);await expect(page.locator('.post-card')).toHaveCount(count);await expect(page.locator('[data-editorial-role="lead"]')).toHaveCount(count?1:0);await expect(page.locator('[data-editorial-role="secondary"]')).toHaveCount(Math.min(2,Math.max(0,count-1)));
  const urls=await page.locator('.post-card h2 a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));expect(urls).toEqual(Array.from({length:count},(_,i)=>`/2026/09/editorial-${i}.html`));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(count===0)await expect(page.locator('.empty-state')).toBeVisible();
 }
});
test('grouped filtering hides empty dates without flattening native groups',async({page})=>{
 await page.goto('/editorial-grouped-8');await page.keyboard.press('/');await page.locator('#search-query').fill('Keeping recovery');await expect(page.locator('.post-card:visible')).toHaveCount(1);await expect(page.locator('.date-outer:visible')).toHaveCount(1);
 expect(await page.locator('.date-posts').last().evaluate(el=>getComputedStyle(el).display)).not.toBe('contents');
 await page.locator('#search-query').fill('');await expect(page.locator('.date-outer:visible')).toHaveCount(4);
});
test('author cover is preserved once and long text reflows without theme JS',async({browser},info)=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:info.project.use.viewport,colorScheme:info.project.use.colorScheme});
 try{const page=await context.newPage();const html=await readFile('.preview/article.html','utf8');
 const cover='<figure class="fcd-article-cover"><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22450%22/%3E" width="800" height="450" alt="Identity boundary diagram"><figcaption>Author supplied cover caption</figcaption></figure>';
 await page.route(origin+'/**',r=>r.fulfill({contentType:'text/html',body:html.replace(/(<div[^>]*id="article-body"[^>]*>)/,'$1'+cover)}));await page.goto(origin+'/article');await expect(page.locator('.fcd-article-cover')).toHaveCount(1);await expect(page.getByAltText('Identity boundary diagram')).toHaveAttribute('alt','Identity boundary diagram');await expect(page.locator('.fcd-article-cover figcaption')).toHaveText('Author supplied cover caption');
 await page.addStyleTag({content:'html{font-size:200%}p{letter-spacing:.12em;word-spacing:.16em;line-height:1.5}'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('article-cover-enlarged.png'),fullPage:true});
 }finally{await context.close();}
});
