import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {assets,pug,root} from '../../tools/generate.ts';
import {MERMAID_URL} from '../../src/scripts/enhancement-loader.ts';
const origin='https://blogs.fastcyberdefense.com';const prefix='https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/';
let html:string;let plain:string;let unsafe:string;
test.beforeAll(async()=>{
 const compiled=await assets();const data=JSON.parse(await readFile('fixtures/technical-content.json','utf8'));const render=(value:unknown)=>pug.renderFile(path.join(root,'fixtures/technical-libraries.pug'),{...compiled,data:value});
 html=render(data);plain=render({...data,diagrams:[]});
 unsafe=render({...data,diagrams:[
 {source:'%%{init: {"securityLevel":"loose"}}%%\n'+data.diagrams[0].source},
 {source:'flowchart TD\naccTitle: Invalid diagram\naccDescr: Invalid syntax should preserve source\nA['},
 {source:data.diagrams[0].source+'\n%%'+ 'x'.repeat(20001)},
 {source:'flowchart TD\naccTitle: External links\naccDescr: Links cannot execute code or navigate\nA[Policy]-->B[Service]\nclick A "javascript:alert(1)"'},
 data.diagrams[1]
 ]});
});
async function setup(page:import('@playwright/test').Page,markup=html,blocked=false,delayEntry=false){
 const requests:string[]=[];let bytes=0;let release:()=>void=()=>{};const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route(prefix+'**',async route=>{
  requests.push(route.request().url());if(blocked)return route.abort();if(delayEntry&&route.request().url()===MERMAID_URL)await hold;
  const url=new URL(route.request().url());const relative=decodeURIComponent(url.pathname.split('/dist/')[1]||'');const base=path.resolve('node_modules/mermaid/dist');const file=path.resolve(base,relative);
  if(!file.startsWith(base+path.sep)||!file.endsWith('.mjs'))return route.abort();const body=await readFile(file);bytes+=body.length;
  await route.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body});
 });
 await page.route(origin+'/**',r=>r.fulfill({contentType:'text/html',body:markup}));await page.goto(origin+'/technical',{waitUntil:'domcontentloaded'});
 return {requests,release,bytes:()=>bytes};
}
test('real pinned libraries render safely with accessible controls and copy fidelity',async({page},info)=>{
 const load=await setup(page);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);
 await expect.poll(()=>page.locator('.fcd-diagram[data-state="rendered"],.fcd-diagram[data-state="error"]').count(),{timeout:30000}).toBe(3);
 expect(await page.locator('.fcd-diagram[data-state="error"] .diagram-status').allTextContents()).toEqual([]);
 await expect(page.locator('.diagram-output svg')).toHaveCount(3);expect(load.requests.filter(url=>url===MERMAID_URL)).toHaveLength(1);
 await expect(page.locator('.diagram-output script,.diagram-output foreignObject,.diagram-output a[href^="http"]')).toHaveCount(0);
 const source=page.locator('.diagram-source pre').first();await source.focus();await expect(source).toBeFocused();await expect(source).toHaveAttribute('role','region');
 const original=await page.locator('.diagram-source pre').allTextContents();
 await page.getByRole('button',{name:'Zoom in',exact:true}).first().click();await expect(page.locator('.diagram-status').first()).toContainText('125%');
 await page.getByRole('button',{name:'Reset zoom',exact:true}).first().click();await expect(page.locator('.diagram-status').first()).toContainText('100%');
 await page.locator('#theme-toggle').click();const theme=await page.locator('html').getAttribute('data-theme');
 await expect(page.locator(`.fcd-diagram[data-state="rendered"][data-rendered-theme="${theme}"]`)).toHaveCount(3,{timeout:30000});
 expect(await page.locator('.diagram-source pre').allTextContents()).toEqual(original);
 await page.getByRole('button',{name:'Render again',exact:true}).first().click();await expect(page.locator('.fcd-diagram[data-state="rendered"]')).toHaveCount(3,{timeout:30000});
 await expect(page.locator('.diagram-controls')).toHaveCount(3);expect(await page.locator('.diagram-source pre').allTextContents()).toEqual(original);
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{document.documentElement.dataset.copied=text;}}}));
 const text=await page.locator('code.language-xml').textContent();await page.getByRole('button',{name:'Copy xml code',exact:true}).click();expect(await page.locator('html').getAttribute('data-copied')).toBe(text);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();await info.attach('technical-axe',{body:JSON.stringify(scan),contentType:'application/json'});expect(scan.violations).toEqual([]);
 await info.attach('library-requests',{body:JSON.stringify({urls:load.requests,uncompressedBytes:load.bytes()}),contentType:'application/json'});await page.screenshot({path:info.outputPath('technical-content.png'),fullPage:true});
});
test('code-only pages do not fetch Mermaid',async({page})=>{const load=await setup(page,plain);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);expect(load.requests).toEqual([]);});
test('blocked Mermaid keeps original source and core highlighting usable',async({page})=>{
 await setup(page,html,true);await expect(page.locator('.fcd-diagram[data-state="error"]')).toHaveCount(3,{timeout:20000});await expect(page.locator('.diagram-source pre')).toHaveCount(3);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);
 const pre=page.locator('.diagram-source pre').first();await pre.focus();await expect(pre).toBeFocused();await page.getByRole('button',{name:'Render again',exact:true}).first().click();await expect(page.locator('.fcd-diagram[data-state="error"]')).toHaveCount(3,{timeout:20000});
});
test('latest theme wins while the library is loading',async({page})=>{
 const load=await setup(page,html,false,true);await expect.poll(()=>load.requests.filter(x=>x===MERMAID_URL).length).toBe(1);
 await page.locator('#theme-toggle').click();await page.locator('#theme-toggle').click();await page.locator('#theme-toggle').click();const wanted=await page.locator('html').getAttribute('data-theme');load.release();
 await expect(page.locator(`.fcd-diagram[data-state="rendered"][data-rendered-theme="${wanted}"]`)).toHaveCount(3,{timeout:30000});expect(load.requests.filter(x=>x===MERMAID_URL)).toHaveLength(1);
});
test('invalid, oversized and configured diagrams do not compromise sibling rendering',async({page})=>{
 let dialogs=0;page.on('dialog',d=>{dialogs++;void d.dismiss();});await setup(page,unsafe);
 await expect.poll(()=>page.locator('.fcd-diagram[data-state="rendered"],.fcd-diagram[data-state="error"]').count(),{timeout:30000}).toBe(5);
 const messages=await page.locator('.fcd-diagram[data-state="error"] .diagram-status').allTextContents();
 expect(messages.some(x=>x.includes('configuration'))).toBe(true);expect(messages.some(x=>x.includes('20,000'))).toBe(true);
 await expect(page.locator('.fcd-diagram').last()).toHaveAttribute('data-state','rendered');
 await expect(page.locator('.diagram-output [href^="javascript:"],.diagram-output script,.diagram-output [onclick]')).toHaveCount(0);expect(dialogs).toBe(0);
 await expect(page.locator('.diagram-source pre')).toHaveCount(5);await expect(page.locator('code[data-highlighted="true"]')).toHaveCount(11);
});
