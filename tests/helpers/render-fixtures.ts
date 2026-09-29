import { constants, type Stats } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { assets, pug, root } from '../../tools/generate.ts';
import { FIXTURE_ORIGIN, validateResponsePlan, type FixtureAsset, type FixtureRule, type ResponsePlan } from './browser-network.ts';
import { SUITES, renderContextModes, type Owner } from './browser-network-scope.ts';
import { MERMAID_ORIGIN, MERMAID_PREFIX, RESPONSE_LIMITS, validModulePath } from '../../tools/finalize-browser-network.ts';

export interface RenderPlan {rules:FixtureRule[];responsePlan:ResponsePlan}
const sha256=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
const sameFile=(a:Stats,b:Stats)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs&&a.ctimeMs===b.ctimeMs;

/** Registration-time reads only. Never called by a request handler.
 * Inspect every ancestor, reject symlinks/special files, compare lstat/open/
 * fstat identities, and read at most the original size plus one. This is
 * bounded fixture I/O, not a claim to sandbox a malicious filesystem.
 */
export async function readAssetText(base:string,relative:string,limit:number):Promise<string> {
  if(!path.isAbsolute(base)||path.resolve(base)!==base||relative.length>200||
      !/^[A-Za-z0-9_./-]+$/.test(relative)||relative.split('/').some(p=>!p||p==='.'||p==='..')||
      !Number.isSafeInteger(limit)||limit<1||limit>RESPONSE_LIMITS.module)throw new Error('N2A_ASSET_PATH');
  const file=path.join(base,relative),ancestors:{name:string;stat:Stats}[]=[];
  let current=path.parse(file).root;
  const parts=file.slice(current.length).split(path.sep);
  for(let i=0;i<parts.length;i++){
    current=path.join(current,parts[i]);const stat=await lstat(current);
    if(stat.isSymbolicLink()||(i===parts.length-1?!stat.isFile():!stat.isDirectory()))throw new Error('N2A_ASSET_TYPE');
    ancestors.push({name:current,stat});
  }
  const before=ancestors.at(-1)!.stat;
  if(before.size<1||before.size>limit)throw new Error('N2A_ASSET_LIMIT');
  const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{
    const opened=await handle.stat();
    if(!opened.isFile()||!sameFile(before,opened))throw new Error('N2A_ASSET_CHANGED');
    const buffer=Buffer.alloc(before.size+1);let length=0;
    while(length<buffer.length){
      const {bytesRead}=await handle.read(buffer,length,buffer.length-length,null);
      if(bytesRead===0)break;length+=bytesRead;
    }
    if(length!==before.size||!sameFile(before,await handle.stat()))throw new Error('N2A_ASSET_CHANGED');
    for(let i=0;i<ancestors.length;i++){
      const item=ancestors[i],after=await lstat(item.name);
      if(after.isSymbolicLink()||after.dev!==item.stat.dev||after.ino!==item.stat.ino||
          (i===ancestors.length-1?!after.isFile()||!sameFile(item.stat,after):!after.isDirectory()))throw new Error('N2A_ASSET_CHANGED');
    }
    const bytes=buffer.subarray(0,length),text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
    if(!Buffer.from(text,'utf8').equals(bytes))throw new Error('N2A_ASSET_UTF8');
    return text;
  }finally{await handle.close();}
}
export function htmlAsset(id:string,body:string):FixtureAsset {
  if(!/^[a-z][a-z0-9-]{0,63}$/.test(id)||typeof body!=='string'||!body.length||Buffer.byteLength(body)>RESPONSE_LIMITS.html)throw new Error('N2A_ASSET_LIMIT');
  return Object.freeze({id,kind:'html',body,bytes:Buffer.byteLength(body),sha256:sha256(body)});
}
const views=['home','article','paged','empty','error','state-error','state-label','state-search','state-archive','state-home','state-generic'] as const;
export async function fixtureHTML(view:string):Promise<string> {
  if(!(views as readonly string[]).includes(view))throw new Error('N2A_FIXTURE_NAME');
  return readAssetText(root,`.preview/${view}.html`,RESPONSE_LIMITS.html);
}
function imports(name:string,body:string):{statics:string[];dynamics:string[]} {
  const source=ts.createSourceFile(name,body,ts.ScriptTarget.ESNext,true,ts.ScriptKind.JS);
  const statics:string[]=[],dynamics:string[]=[];
  const target=(specifier:string)=>{
    if(!/^\.{1,2}\/[A-Za-z0-9_./-]+\.mjs$/.test(specifier))throw new Error('N2A_MODULE_IMPORT');
    const relative=path.posix.normalize(path.posix.join(path.posix.dirname(name),specifier));
    if(!validModulePath(relative))throw new Error('N2A_MODULE_IMPORT');
    return relative;
  };
  const visit=(node:ts.Node):void=>{
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier){
      if(!ts.isStringLiteral(node.moduleSpecifier))throw new Error('N2A_MODULE_IMPORT');
      statics.push(target(node.moduleSpecifier.text));
    }
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
      if(node.arguments.length!==1||!ts.isStringLiteral(node.arguments[0]))throw new Error('N2A_MODULE_IMPORT');
      dynamics.push(target(node.arguments[0].text));
    }
    ts.forEachChild(node,visit);
  };
  visit(source);return {statics,dynamics};
}
const ENTRY='mermaid.esm.min.mjs';
const FLOW='chunks/mermaid.esm.min/flowDiagram-YHGXBVSY.mjs';
const DAGRE='chunks/mermaid.esm.min/dagre-MPVFI544.mjs';
let catalog:Promise<readonly FixtureAsset[]>|undefined;
/** Exact installed entry/flowchart/dagre static closure, never all families. */
export function mermaidCatalog():Promise<readonly FixtureAsset[]> {
  return catalog??=(async()=>{
    const pkg=JSON.parse(await readAssetText(root,'node_modules/mermaid/package.json',65536)) as {version?:unknown};
    if(pkg.version!=='11.17.2')throw new Error('N2A_MODULE_VERSION');
    const found=new Map<string,string>(),dynamic=new Set<string>(),queue=[ENTRY];
    const drain=async()=>{
      while(queue.length){
        const name=queue.shift()!;if(found.has(name))continue;
        if(!validModulePath(name)||found.size>=62)throw new Error('N2A_MODULE_BOUND');
        const body=await readAssetText(root,`node_modules/mermaid/dist/${name}`,RESPONSE_LIMITS.module);
        found.set(name,body);const dependencies=imports(name,body);
        queue.push(...dependencies.statics);for(const target of dependencies.dynamics)dynamic.add(target);
      }
    };
    await drain();
    if(!dynamic.has(FLOW)||!dynamic.has(DAGRE))throw new Error('N2A_MODULE_CLOSURE');
    queue.push(FLOW,DAGRE);await drain();
    const values=[...found].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([modulePath,body],i):FixtureAsset=>Object.freeze({id:`module-${i}`,kind:'mermaid',modulePath,body,bytes:Buffer.byteLength(body),sha256:sha256(body)}));
    if(values.reduce((n,a)=>n+a.bytes,0)>RESPONSE_LIMITS.distinct)throw new Error('N2A_MODULE_BOUND');
    return Object.freeze(values);
  })();
}
let technical:Promise<string>|undefined;
export function technicalHTML():Promise<string> {
  return technical??=(async()=>{
    const compiled=await assets(),data=JSON.parse(await readAssetText(root,'fixtures/technical-content.json',65536)) as {diagrams:unknown[]};
    if(!Array.isArray(data.diagrams)||!data.diagrams.length)throw new Error('N2A_TECHNICAL_FIXTURE');
    data.diagrams=data.diagrams.slice(0,1);
    return htmlAsset('technical',pug.renderFile(path.join(root,'fixtures/technical-libraries.pug'),{...compiled,data})).body;
  })();
}
export async function mermaidPlan():Promise<RenderPlan> {
  const modules=await mermaidCatalog(),html=htmlAsset('technical',await technicalHTML());
  const responsePlan:ResponsePlan={assets:[html,...modules],phases:['ready','blocked'],transitions:[{from:'ready',to:'blocked'}],gates:[]};
  const rules:FixtureRule[]=[
    {id:'technical',path:'/technical',method:'GET',resource:'document',asset:html.id,count:2},
    ...modules.map((a):FixtureRule=>({id:a.id,path:MERMAID_PREFIX+a.modulePath,origin:MERMAID_ORIGIN,method:'GET',resource:'script',asset:a.id,phase:'ready'})),
    {id:'blocked-entry',path:MERMAID_PREFIX+ENTRY,origin:MERMAID_ORIGIN,method:'GET',resource:'script',action:'deny',abort:'failed',count:1,phase:'blocked'},
  ];
  validateResponsePlan(rules,responsePlan);return {rules,responsePlan};
}

const emptyFeed='{"feed":{"entry":[]}}';
const recovery='<!doctype html><html lang="en"><title>Recovery destination</title><body><h1>Recovery destination</h1></body></html>';
const image='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#175f9e"/></svg>';
const displacement='<!doctype html><html><head><title>Recorder control</title><style>body{margin:0}#spacer{height:0}#anchor{width:200px;height:200px;background:#175f9e}</style></head><body><div id="spacer"></div><div id="anchor">Visible displacement control</div></body></html>';
/** Selected by complete canonical identity before page creation, never a URL. */
export async function casePlan(owner:Owner,contextIndex=0):Promise<RenderPlan> {
  const modes=renderContextModes(owner);
  if(!Number.isSafeInteger(contextIndex)||contextIndex<0||contextIndex>=modes.length)throw new Error('N2A_CASE_OWNER');
  const index=SUITES[owner.file].indexOf(owner.titlePath[0]),javascript=modes[contextIndex];
  const rules:FixtureRule[]=[],responsePlan:ResponsePlan={assets:[],phases:['ready'],transitions:[],gates:[]};
  const document=(id:string,address:string,body:string,count=1,status=200,query?:string)=>{
    const value=htmlAsset(id,body);responsePlan.assets.push(value);
    rules.push({id,path:address,method:'GET',resource:'document',asset:id,count,status,...(query===undefined?{}:{query})});
  };
  const feed=(maximum:8|50,body:string,count?:number,extra:Partial<FixtureRule>={})=>rules.push({id:'feed',path:'/feeds/posts/default',query:`alt=json&max-results=${maximum}`,method:'GET',resource:'fetch',contentType:'application/json',body,...(count===undefined?{}:{count}),...extra});
  if(owner.file==='tests/render/a11y.spec.ts'){
    const view=views[index];document('view','/',await fixtureHTML(view),1,view==='error'?404:200);
    feed(view==='article'?50:8,emptyFeed,1);
  }else if(owner.file==='tests/render/interactions.spec.ts'){
    const view=index<2?'home':'article';document('view',view==='home'?'/':'/article',await fixtureHTML(view));
    if(index===0)document('search','/search',await fixtureHTML('home'),1,200,'q=cloud+defense');
    // Keep all interaction failures HTTP 503, not a network abort. Background
    // requests after search navigation remain completely counted, not guessed.
    feed(view==='article'?50:8,'Unavailable',undefined,{status:503,contentType:'text/html'});
  }else if(owner.file==='tests/render/native-states.spec.ts'){
    const state=['error','label','search','archive','home','generic'][Math.floor(index/2)];
    document('state',`/state-${state}`,await fixtureHTML(`state-${state}`),2,state==='error'?404:200);
    document('search','/search',recovery,1,200,'q=cloud+%26+identity');document('home','/',recovery);
    if(javascript)feed(8,emptyFeed);
  }else if(owner.file==='tests/render/responsive.spec.ts'){
    const view=views[Math.floor(index/2)];document('view',javascript&&view==='home'?'/':`/${view}`,await fixtureHTML(view),1,view==='error'?404:200);
    if(javascript)feed(view==='article'?50:8,JSON.stringify({feed:{entry:['cloud-security','incident-response','zero-trust'].map(slug=>({title:{$t:slug},link:[{rel:'alternate',href:`${FIXTURE_ORIGIN}/2026/09/${slug}.html`}]}))}}),1);
  }else if(owner.file==='tests/render/publication-acceptance.spec.ts'){
    if(index===3)return mermaidPlan();
    if(index===5)document('displacement','/shift-control',displacement);
    else if(index===4){
      document('profile','/profile',(await fixtureHTML('home')).replace(/data:image\/svg\+xml,[^"\s]+/g,FIXTURE_ORIGIN+'/profile-image.svg'));
      responsePlan.gates.push('completion');
      feed(8,JSON.stringify({feed:{entry:[{title:{$t:'Controlled feed completion'},link:[{rel:'alternate',href:FIXTURE_ORIGIN+'/controlled'}]}]}}),1,{gate:'completion'});
      rules.push({id:'image',path:'/profile-image.svg',method:'GET',resource:'image',contentType:'image/svg+xml',body:image,gate:'completion'});
    }else{
      const view=index===0?'home':'article';let html=await fixtureHTML(view);
      if(contextIndex===1)html=html.replace('</head>','<style>html{font-size:200%}p{letter-spacing:.12em;word-spacing:.16em}</style></head>');
      document('view',index===0?'/':'/article',html);
      if(index===0)document('search','/search',html,1,200,'q=cloud');
      if(javascript){
        if(index===2)rules.push({id:'feed',path:'/feeds/posts/default',query:'alt=json&max-results=50',method:'GET',resource:'fetch',action:'deny',abort:'failed',count:1});
        else feed(index===0?8:50,JSON.stringify({feed:{entry:[{title:{$t:'Cloud publication'},link:[{rel:'alternate',href:FIXTURE_ORIGIN+'/other'}],category:[{term:'Research'}]}]}}),index===1?1:undefined);
      }
    }
  }else throw new Error('N2A_CASE_OWNER');
  validateResponsePlan(rules,responsePlan);return {rules,responsePlan};
}
