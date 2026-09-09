import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {assets,pug,root} from '../../tools/generate.ts';
import {MERMAID_URL} from '../../src/scripts/enhancement-loader.ts';
const origin='https://blogs.fastcyberdefense.com';const prefix='https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/';
let html:string;let plain:string;
test.beforeAll(async()=>{const compiled=await assets();const data=JSON.parse(await readFile('fixtures/technical-content.json','utf8'));html=pug.renderFile(path.join(root,'fixtures/technical-libraries.pug'),{...compiled,data});plain=pug.renderFile(path.join(root,'fixtures/technical-libraries.pug'),{...compiled,data:{...data,diagrams:[]}});});
async function setup(page:import('@playwright/test').Page,markup=html,blocked=false){
 const requests:string[]=[];
 await page.route(prefix+'**',async route=>{requests.push(route.request().url());if(blocked)return route.abort();const url=new URL(route.request().url());const relative=decodeURIComponent(url.pathname.split('/dist/')[1]||'');const base=path.resolve('node_modules/mermaid/dist');const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)||!file.endsWith('.mjs'))return route.abort();await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await readFile(file)});});
 await page.route(origin+'/**',r=>r.fulfill({contentType:'text/html',body:markup}));await page.goto(origin+'/technical');return requests;
}
test('real pinned libraries render safely with accessible controls and copy fidelity',async({page},info)=>{
 const requests=await setup(page);
 await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);
 await expect(page.locator('.fcd-diagram[data-state="rendered"]')).toHaveCount(3,{timeout:30000});
 expect(requests.filter(url=>url===MERMAID_URL)).toHaveLength(1);
 await expect(page.locator('.diagram-output svg')).toHaveCount(3);
 await expect(page.locator('.diagram-output script,.diagram-output foreignObject,.diagram-output a[href^="http"]')).toHaveCount(0);
 await page.getByRole('button',{name:'Zoom in',exact:true}).first().click();await expect(page.locator('.diagram-status').first()).toContainText('125%');
 await page.getByRole('button',{name:'Reset zoom',exact:true}).first().click();await expect(page.locator('.diagram-status').first()).toContainText('100%');
 const before=await page.locator('.diagram-source pre').allTextContents();await page.locator('#theme-toggle').click();
 await expect(page.locator('.diagram-status').first()).toContainText('Diagram ready',{timeout:30000});
 expect(await page.locator('.diagram-source pre').allTextContents()).toEqual(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach('technical-axe',{body:JSON.stringify(scan),contentType:'application/json'});expect(scan.violations).toEqual([]);
 await info.attach('library-requests',{body:JSON.stringify(requests),contentType:'application/json'});await page.screenshot({path:info.outputPath('technical-content.png'),fullPage:true});
});
test('code-only pages do not fetch Mermaid',async({page})=>{const requests=await setup(page,plain);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);expect(requests).toEqual([]);});
test('blocked Mermaid keeps original source and core highlighting usable',async({page})=>{await setup(page,html,true);await expect(page.locator('.fcd-diagram[data-state="error"]')).toHaveCount(3,{timeout:20000});await expect(page.locator('.diagram-source pre')).toHaveCount(3);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);await expect(page.locator('.diagram-source').first()).toBeVisible();});
