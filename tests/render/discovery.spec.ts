import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {assets,pug,root} from '../../tools/generate.ts';
import path from 'node:path';
const origin='https://blogs.fastcyberdefense.com';
let postHtml:string,staticHtml:string,repeatedHtml:string;
let entries:unknown[];
test.beforeAll(async()=>{
 const a=await assets();const data=JSON.parse(await readFile('fixtures/discovery-content.json','utf8'));
 entries=data.posts.map((p:{url:string;id:string;title:string;labels:string[];date:string})=>({id:{$t:p.id},title:{$t:p.title},link:[{rel:'alternate',href:origin+p.url}],category:p.labels.map(term=>({term})),published:{$t:p.date}}));
 postHtml=await readFile('.preview/article.html','utf8');
 // Same production mixin with explicit static-page context, not a stripped post shell.
 staticHtml=pug.renderFile(path.join(root,'fixtures/article.pug'),{...a,fixtureIsPost:false});
 const repeat=await build({stdin:{contents:"import {initDiscovery} from './src/scripts/main.ts'; import {initSearch} from './src/scripts/search.ts'; initDiscovery();initDiscovery();initSearch();initSearch();",resolveDir:root},bundle:true,write:false,format:'iife',platform:'browser'});
 repeatedHtml=pug.renderFile(path.join(root,'fixtures/article.pug'),{...a,script:repeat.outputFiles[0].text});
});
async function route(page:import('@playwright/test').Page,html=postHtml,mode='success'){
 const requests:string[]=[];await page.route(origin+'/**',async r=>{const url=r.request().url();if(url.includes('/feeds/')){requests.push(url);if(mode==='error')return r.abort();if(mode==='redirect')return r.fulfill({status:302,headers:{location:'https://evil.example/feed'}});let feed=entries;if(mode==='empty')feed=[];if(mode==='unrelated')feed=[{title:{$t:'Latest only'},link:[{rel:'alternate',href:origin+'/latest'}]}];if(mode==='unsafe')feed=[{title:{$t:'<img src=x onerror=alert(1)>'},link:[{rel:'alternate',href:origin+'/safe'}],category:[{term:'<script>alert(1)</script>'}]},{title:{$t:'Bad'},link:[{rel:'alternate',href:'javascript:alert(1)'}]}];return r.fulfill({contentType:'application/json',body:JSON.stringify({feed:{entry:feed}})});}return r.fulfill({contentType:'text/html',body:html});});return requests;
}
test('post recommendations share one request, exclude current and preserve fallback',async({page},info)=>{
 const req=await route(page);await page.goto('/article');await expect(page.locator('[data-related-list] a')).toHaveCount(2);expect(await page.locator('[data-related-list] a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')))).toEqual([origin+'/strong',origin+'/one']);await expect(page.locator('[data-related-heading]')).toHaveText('Related articles');await expect(page.locator('#recent-posts a')).toHaveCount(3);expect(req).toHaveLength(1);expect(req[0]).toContain('max-results=50');await expect(page.locator('.related-fallback')).toBeVisible();await expect(page.locator('.related-articles')).toHaveAttribute('aria-busy','false');
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(scan.violations).toEqual([]);await info.attach('discovery-axe',{body:JSON.stringify(scan),contentType:'application/json'});await page.screenshot({path:info.outputPath('related.png'),fullPage:true});
});
test('unrelated and empty feeds are labeled honestly',async({page})=>{
 for(const mode of ['unrelated','empty']){await route(page,postHtml,mode);await page.goto('/article');await expect(page.locator('.related-articles')).toHaveAttribute('aria-busy','false');await expect(page.locator('[data-related-heading]')).toHaveText('Latest articles');await expect(page.locator('[data-related-list] a')).toHaveCount(mode==='empty'?0:1);await expect(page.locator('.related-fallback')).toBeVisible();}
});
test('network failure and redirects get one explicit shared retry only',async({page},info)=>{
 for(const mode of ['error','redirect']){let foreign=0;await page.route('https://evil.example/**',r=>{foreign++;return r.abort();});const req=await route(page,postHtml,mode);await page.goto('/article');await expect(page.getByRole('button',{name:'Retry publications'})).toHaveCount(2);expect(req).toHaveLength(1);await page.getByRole('button',{name:'Retry publications'}).first().click();await expect(page.getByRole('button',{name:'Retry used'})).toHaveCount(2);expect(req).toHaveLength(2);expect(foreign).toBe(0);await expect(page.locator('#article-body')).toBeVisible();await expect(page.locator('.related-fallback')).toBeVisible();await page.screenshot({path:info.outputPath(mode+'.png'),fullPage:true});}
});
test('untrusted fields are text, never executable HTML',async({page})=>{
 let dialogs=0;page.on('dialog',d=>{dialogs++;void d.dismiss();});await route(page,postHtml,'unsafe');await page.goto('/article');await expect(page.locator('[data-related-list] a')).toHaveText('<img src=x onerror=alert(1)>');await expect(page.locator('[data-related-list] script,[data-related-list] img,[data-related-list] [onclick]')).toHaveCount(0);expect(dialogs).toBe(0);
});
test('static pages have no related shell and repeated initialization does not duplicate consumers',async({page})=>{
 const staticRequests=await route(page,staticHtml);await page.goto('/static');await expect(page.locator('[data-related-post]')).toHaveCount(0);await expect(page.locator('#recent-posts a')).toHaveCount(4);expect(staticRequests).toHaveLength(1);expect(staticRequests[0]).toContain('max-results=8');
 const repeatRequests=await route(page,repeatedHtml);await page.goto('/article');await expect(page.locator('[data-related-list] a')).toHaveCount(2);expect(repeatRequests).toHaveLength(1);await expect(page.locator('[data-related-post]')).toHaveCount(1);
});
test('clear filter restores editorial order and focus before hiding',async({page})=>{
 const home=await readFile('.preview/home.html','utf8');const req=await route(page,home);await page.goto('/home');await page.keyboard.press('/');await page.locator('#search-query').fill('incident');await expect(page.getByRole('button',{name:'Clear filter'})).toBeVisible();await page.getByRole('button',{name:'Clear filter'}).click();await expect(page.locator('#search-query')).toBeFocused();await expect(page.locator('.clear-filter')).toBeHidden();await expect(page.locator('.post-card:visible')).toHaveCount(4);await expect(page.locator('.blog-posts')).toHaveAttribute('data-filter-active','false');expect(req).toHaveLength(1);expect(req[0]).toContain('max-results=8');
});
test('native fallback survives no JS and recommendations are omitted from print',async({browser,page},info)=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:info.project.use.viewport,colorScheme:info.project.use.colorScheme});try{const p=await context.newPage();const req=await route(p,postHtml.replace('</head>','<style>html{font-size:200%}p{letter-spacing:.12em;word-spacing:.16em}</style></head>'));await p.goto(origin+'/article');await expect(p.locator('.related-fallback')).toBeVisible();await expect(p.locator('[data-related-list] a')).toHaveCount(0);expect(req).toHaveLength(0);expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}finally{await context.close();}
 await route(page);await page.goto('/article');await expect(page.locator('[data-related-list] a')).toHaveCount(2);await page.emulateMedia({media:'print'});await expect(page.locator('.related-articles')).toBeHidden();await expect(page.locator('#article-body')).toBeVisible();
});
