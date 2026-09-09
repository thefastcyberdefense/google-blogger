import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {inspectDeploymentHtml} from './deploy-check.ts';
type ViewType='home'|'article'|'label'|'search'|'archive'|'static'|'error'|'paged';
type Manifest={origin:string;build:string;views:{type:ViewType;url:string;expectedText?:string}[]};
const required:ViewType[]=['home','article','label','search','archive','static','error','paged'];
export function validateManifest(value:unknown):Manifest{
 if(!value||typeof value!=='object')throw new Error('BLOCKED: staging manifest required');
 const m=value as Manifest;let origin:URL;try{origin=new URL(m.origin);}catch{throw new Error('BLOCKED: staging origin missing');}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||!/^0\.1\.0\+[a-f0-9]{40}$/i.test(m.build||''))throw new Error('BLOCKED: HTTPS origin and full expected build required');
 if(!Array.isArray(m.views)||m.views.length!==required.length||new Set(m.views.map(v=>v.type)).size!==required.length)throw new Error('BLOCKED: all eight native view types required exactly once');
 for(const type of required){const v=m.views.find(v=>v.type===type);if(!v)throw new Error('Missing view '+type);const url=new URL(v.url);if(url.origin!==origin.origin||url.username||url.password||url.hash)throw new Error('Staging views must use the exact configured origin');if(['search','error','static'].includes(type)&&!v.expectedText?.trim())throw new Error('Expected text required for '+type);}
 return m;
}
export async function runStaging(manifest:Manifest){
 const browser=await chromium.launch();
 try{
  for(const view of manifest.views){
   const res=await fetch(view.url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
   const wanted=view.type==='error'?404:200;if(res.status!==wanted||res.redirected)throw new Error(`${view.type}: expected HTTP ${wanted}, got ${res.status}`);
   const reader=res.body?.getReader();if(!reader)throw new Error('No response body');const chunks:Uint8Array[]=[];let count=0;
   while(true){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>2000000){await reader.cancel();throw new Error('Staging response too large');}chunks.push(value);}
   const html=Buffer.concat(chunks).toString('utf8');
   if(['home','article','label','archive','paged'].includes(view.type))await inspectDeploymentHtml(html,manifest.build,view.url);
   const context=await browser.newContext({javaScriptEnabled:false});await context.route('**/*',r=>r.abort());const page=await context.newPage();await page.setContent(html,{waitUntil:'domcontentloaded'});
   const data=await page.evaluate(()=>({stamp:Array.from(document.querySelectorAll('head meta[name="theme-build"]'),m=>m.getAttribute('content')),main:document.querySelector('main#content')?.textContent||'',h1:document.querySelectorAll('main#content h1').length,canonical:Array.from(document.querySelectorAll('link[rel="canonical"]'),l=>l.getAttribute('href')),older:!!document.querySelector('a.blog-pager-older-link,a.blog-pager-newer-link')}));
   if(data.stamp.length!==1||data.stamp[0]!==manifest.build||!data.main.trim()||data.h1!==1)throw new Error(view.type+': invalid native content/stamp/headings');
   if(view.type!=='error'&&(data.canonical.length!==1||!data.canonical[0]||new URL(data.canonical[0],view.url).origin!==manifest.origin.replace(/\/$/,'')))throw new Error(view.type+': invalid canonical');
   if(view.expectedText&&!data.main.includes(view.expectedText))throw new Error(view.type+': expected content not found');
   if(view.type==='paged'&&!data.older)throw new Error('Native pagination links missing');
   console.log(`PASS ${view.type}: expected HTTP, source stamp, native content and metadata`);await context.close();
  }
 }finally{await browser.close();}
 console.log('Automated eight-view read-only checks passed. Owner import/save evidence, comments interaction, Layout editor and human accessibility remain separate.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const file=process.env.STAGING_MANIFEST||'fixtures/staging-views.example.json';await runStaging(validateManifest(JSON.parse(await readFile(file,'utf8'))));}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
}
