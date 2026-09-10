import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {inspectDeploymentHtml} from './deploy-check.ts';
import {validateMetadata} from './metadata-check.ts';
type ViewType='home'|'article'|'label'|'search'|'archive'|'static'|'error'|'paged';
type Manifest={origin:string;build:string;views:{type:ViewType;url:string;expectedText?:string;expectedCanonical?:string}[]};
const required:ViewType[]=['home','article','label','search','archive','static','error','paged'];
export function validateManifest(value:unknown):Manifest{
 if(!value||typeof value!=='object')throw new Error('BLOCKED: staging manifest required');
 const m=value as Manifest;let origin:URL;try{origin=new URL(m.origin);}catch{throw new Error('BLOCKED: staging origin missing');}
 if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||!/^0\.1\.0\+[a-f0-9]{40}$/i.test(m.build||''))throw new Error('BLOCKED: HTTPS origin and full expected build required');
 if(!Array.isArray(m.views)||m.views.length!==required.length||new Set(m.views.map(v=>v.type)).size!==required.length)throw new Error('BLOCKED: all eight native view types required exactly once');
 for(const type of required){
  const v=m.views.find(v=>v.type===type);if(!v)throw new Error('Missing view '+type);const url=new URL(v.url);
  if(url.origin!==origin.origin||url.username||url.password||url.hash)throw new Error('Staging views must use the exact configured origin');
  if(['search','error','static'].includes(type)&&!v.expectedText?.trim())throw new Error('Expected text required for '+type);
  if(v.expectedCanonical!==undefined){
   if(typeof v.expectedCanonical!=='string'||!v.expectedCanonical.trim()||Array.from(v.expectedCanonical).some(c=>c.charCodeAt(0)<=31||c.charCodeAt(0)===127))throw new Error('Invalid expected canonical');
   const expected=new URL(v.expectedCanonical);if(expected.protocol!=='https:'||expected.origin!==origin.origin||expected.username||expected.password||expected.hash)throw new Error('Expected canonical must be credential-free same-origin HTTPS without fragment');
  }
 }
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
   const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
   try{
    await context.route('**/*',r=>r.abort());const page=await context.newPage();await page.setContent(html,{waitUntil:'domcontentloaded',timeout:10000});
    const data=await page.evaluate(()=>{
     const visible=(el:Element|null):el is HTMLElement=>{
      if(!(el instanceof HTMLElement)||el.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
      for(let parent:HTMLElement|null=el;parent;parent=parent.parentElement){const css=getComputedStyle(parent);if(css.display==='none'||css.visibility==='hidden'||css.visibility==='collapse'||css.contentVisibility==='hidden'||Number(css.opacity)===0)return false;}
      return Array.from(el.getClientRects()).some(rect=>rect.width>0&&rect.height>0);
     };
     const visibleText=(root:Element|null):string=>{
      if(!root)return '';const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const text:string[]=[];
      for(let node=walker.nextNode();node;node=walker.nextNode()){const parent=node.parentElement;if(!parent||parent.closest('script,style,template,noscript')||!visible(parent)||!node.textContent?.trim())continue;const range=document.createRange();range.selectNodeContents(node);if(Array.from(range.getClientRects()).some(rect=>rect.width>0&&rect.height>0))text.push(node.textContent);}
      return text.join(' ').replace(/\s+/g,' ').trim();
     };
     const mains=document.querySelectorAll('main#content');const main=mains[0]||null;const headings=Array.from(main?.querySelectorAll('h1')||[]);const articles=Array.from(main?.querySelectorAll('article.article-view')||[]);const article=articles.length===1?articles[0]:null;const articleHeading=article?.querySelector('h1.post-title')||null;const articleBody=article?.querySelector('#article-body')||null;
     return {stamp:Array.from(document.querySelectorAll('head meta[name="theme-build"]'),m=>m.getAttribute('content')),mainValid:mains.length===1&&visible(main),mainText:visibleText(main),headingValid:headings.length===1&&visible(headings[0])&&!!visibleText(headings[0]),articleValid:visible(article)&&visible(articleHeading)&&!!visibleText(articleHeading)&&visible(articleBody)&&!!visibleText(articleBody),canonical:Array.from(document.querySelectorAll('link[rel="canonical"]'),l=>l.getAttribute('href')),older:!!document.querySelector('a.blog-pager-older-link,a.blog-pager-newer-link')};
    });
    if(data.stamp.length!==1||data.stamp[0]!==manifest.build||!data.mainValid||!data.mainText||!data.headingValid)throw new Error(view.type+': invalid visible native content/stamp/headings');
    if(view.type==='article'&&!data.articleValid)throw new Error('article: visible article-view, post title and populated article-body required');
    if(view.type!=='error'&&(data.canonical.length!==1||!data.canonical[0]||new URL(data.canonical[0],view.url).origin!==manifest.origin.replace(/\/$/,'')))throw new Error(view.type+': invalid canonical');
    if(view.expectedText&&!data.mainText.includes(view.expectedText.replace(/\s+/g,' ').trim()))throw new Error(view.type+': expected visible content not found');
    if(view.type==='paged'&&!data.older)throw new Error('Native pagination links missing');
    const metadataErrors=await page.evaluate(validateMetadata,{html,view:view.type,url:view.url,expectedCanonical:view.expectedCanonical});if(metadataErrors.length)throw new Error(view.type+': '+metadataErrors.join('; '));
    console.log(`PASS ${view.type}: HTTP, source stamp, visible native content and parsed metadata`);
   }finally{await context.close();}
  }
 }finally{await browser.close();}
 console.log('Automated eight-view read-only checks passed. Owner import/save, comments interaction, Layout editor and human accessibility remain separate.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const file=process.env.STAGING_MANIFEST||'fixtures/staging-views.example.json';await runStaging(validateManifest(JSON.parse(await readFile(file,'utf8'))));}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}
}
