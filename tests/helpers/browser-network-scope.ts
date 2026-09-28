import { createHash } from 'node:crypto';

// Pure inventory/identity data. No browser, filesystem, process or network I/O.
export const N1_FILE='tests/render/network-isolation.spec.ts';
export const UNIT_FILE='tests/unit/browser-network.test.ts';
export const ADOPTION_UNIT_FILE='tests/unit/browser-network-adoption.test.ts';
export const UNIT_CONSUMER='N1 real guarded factory consumer';
export const CASES=[
  'first document, frames, popup and reload are guarded',
  'unexpected HTTP and resource requests remain attributable',
  'declared denials require exact counts',
  'page HTTP and WebSocket overrides are detected',
  'redirect destinations and worker resources are observed',
  'no-JS and context options are preserved',
  'parallel and zero-request contexts retain evidence',
  'early close and observer replacement fail closed',
] as const;
export const PROJECTS=[...[320,360,375,390,430,640,768,1024,1280,1440,1920].flatMap(w=>['light','dark'].map(t=>`${w}-${t}`)),...['firefox','webkit'].flatMap(e=>[390,1280].flatMap(w=>['light','dark'].map(t=>`${e}-${w}-${t}`)))];
const views=['home','article','paged','empty','error'];
export const SUITES:Readonly<Record<string,readonly string[]>>=Object.freeze({
  [N1_FILE]:CASES,
  'tests/render/a11y.spec.ts':views.map(v=>`${v}: accessible initial and expanded states`),
  'tests/render/interactions.spec.ts':[
    'search shortcuts filter honestly and preserve native full-blog submission',
    'navigation adapts to viewport and Escape returns focus',
    'theme persists normally and TOC moves keyboard focus',
    'copy controls report success and denial with accurate payloads',
    'storage failure and reduced motion do not disable essential controls',
    'wide evidence tables retain local keyboard scrolling and semantics',
    'skip link works and 200 percent text retains page reflow',
  ],
  'tests/render/native-states.spec.ts':['error','label','search','archive','home','generic'].flatMap(s=>[true,false].map(js=>`${s}: distinct safe recovery with JS ${js}`)),
  'tests/render/responsive.spec.ts':views.flatMap(v=>[`${v} shared presentation fits with native-wrapper fixtures`,`${v} core content survives theme JavaScript disabled`]),
  'tests/render/publication-acceptance.spec.ts':[
    'catalog navigation, filtering, focus and image dimensions survive all engines',
    'article discovery, copy success/failure and print remain usable',
    'fallback, menu escape and no-JS enlarged text retain native navigation',
    'actual pinned Mermaid renders and preserves source when blocked',
    'records controlled feed/image completion shifts and filter-to-frame interactions',
    'layout-shift recorder detects a deliberate displacement control',
  ],
});
export const TARGET_FILES=Object.freeze(Object.keys(SUITES));
// Each suite is added atomically with its guarded consumer migration.
// No environment switch can reduce this list. Final N2A requires all six files.
export const ADOPTED_FILES:readonly string[]=Object.freeze([N1_FILE,'tests/render/native-states.spec.ts','tests/render/responsive.spec.ts']);
export interface Owner {stage:'unit'|'render';file:string;titlePath:string[];project:string;repeatEachIndex:number}
export const OWNER_FIELDS=['stage','file','titlePath','project','repeatEachIndex'];
const safeText=(v:unknown,max=200):v is string=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
export function canonicalFile(value:string,stage:'unit'|'render'):string {
  const file=value.replaceAll('\\','/');
  if(file.length>200||!new RegExp(`^tests/${stage}/[A-Za-z0-9_./-]+\\.ts$`).test(file)||file.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('N2A_OWNER_FILE');
  return file;
}
export function engineFor(project:string):'chromium'|'firefox'|'webkit' {
  if(project==='vitest-firefox'||project.startsWith('firefox-'))return 'firefox';
  if(project==='vitest-webkit'||project.startsWith('webkit-'))return 'webkit';
  return 'chromium';
}
export function validOwner(value:unknown):value is Owner {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const v=value as Record<string,unknown>;
  if((v.stage!=='unit'&&v.stage!=='render')||typeof v.file!=='string'||!safeText(v.project)||v.repeatEachIndex!==0||!Array.isArray(v.titlePath)||v.titlePath.length<1||v.titlePath.length>16||!v.titlePath.every(t=>safeText(t)))return false;
  try{if(canonicalFile(v.file,v.stage)!==v.file)return false;}catch{return false;}
  return v.stage==='render'?PROJECTS.includes(v.project):['vitest-chromium','vitest-firefox','vitest-webkit'].includes(v.project)&&[UNIT_FILE,ADOPTION_UNIT_FILE].includes(v.file);
}
export function makeOwner(stage:Owner['stage'],file:string,titlePath:readonly string[],project:string,repeatEachIndex=0):Owner {
  const owner:Owner={stage,file:canonicalFile(file,stage),titlePath:[...titlePath],project,repeatEachIndex};
  if(!validOwner(owner))throw new Error('N2A_OWNER');
  return owner;
}
export function testKey(owner:Owner):string {
  if(!validOwner(owner))throw new Error('N2A_OWNER');
  return createHash('sha256').update(JSON.stringify([owner.stage,owner.file,owner.titlePath,owner.project,owner.repeatEachIndex])).digest('hex');
}
export const displayTitle=(owner:Owner)=>owner.stage==='unit'?owner.titlePath.join(' '):owner.titlePath.at(-1)!;
export function expectedOwners(files:readonly string[]=ADOPTED_FILES):Owner[] {
  if(new Set(files).size!==files.length||files.some(f=>!TARGET_FILES.includes(f)))throw new Error('N2A_SCOPE');
  return files.flatMap(file=>PROJECTS.filter(p=>file===N1_FILE||file==='tests/render/publication-acceptance.spec.ts'||!p.startsWith('firefox-')&&!p.startsWith('webkit-')).flatMap(project=>SUITES[file].map(title=>makeOwner('render',file,[title],project))));
}
/** Exact primary/secondary modes, independent of consumer-supplied options. */
export function renderContextModes(owner:Owner):readonly boolean[] {
  if(!validOwner(owner)||owner.stage!=='render'||owner.file===N1_FILE||owner.titlePath.length!==1||!SUITES[owner.file]?.includes(owner.titlePath[0]))return [];
  const index=SUITES[owner.file].indexOf(owner.titlePath[0]);
  if(owner.file==='tests/render/publication-acceptance.spec.ts')return index===2?[true,false]:[true];
  if(engineFor(owner.project)!=='chromium')return [];
  if(owner.file==='tests/render/responsive.spec.ts'||owner.file==='tests/render/native-states.spec.ts')return [index%2===0];
  return [true];
}
export function repositoryFile(file:string,repositoryRoot:string,stage:Owner['stage']):string {
  const normalized=file.replaceAll('\\','/'),root=repositoryRoot.replaceAll('\\','/').replace(/\/$/,'');
  return canonicalFile(normalized.startsWith(root+'/')?normalized.slice(root.length+1):normalized,stage);
}
export function infoOwner(data:{file:string;repositoryRoot:string;titlePath:readonly string[];project:string;repeatEachIndex:number}):Owner {
  const file=repositoryFile(data.file,data.repositoryRoot,'render');
  const [header,...titles]=data.titlePath;
  const allowed=[file,file.slice('tests/render/'.length),data.file.replaceAll('\\','/')];
  if(typeof header!=='string'||!allowed.includes(header.replaceAll('\\','/')))throw new Error('N2A_INFO_ANCESTRY');
  return makeOwner('render',file,titles.filter(t=>t!==''),data.project,data.repeatEachIndex);
}
export function reporterOwner(data:{file:string;repositoryRoot:string;title:string;project:string;repeatEachIndex:number;ancestry:{type:string;title:string;file?:string}[]}):Owner {
  const file=repositoryFile(data.file,data.repositoryRoot,'render');
  const nodes=data.ancestry;
  if(nodes.length<3||nodes[0].type!=='root'||nodes[1].type!=='project'||nodes[1].title!==data.project||nodes[2].type!=='file'||nodes.slice(3).some(n=>n.type!=='describe')||!nodes[2].file||repositoryFile(nodes[2].file,data.repositoryRoot,'render')!==file)throw new Error('N2A_REPORTER_ANCESTRY');
  return makeOwner('render',file,[...nodes.slice(3).map(n=>n.title).filter(t=>t!==''),data.title],data.project,data.repeatEachIndex);
}
export function normalRenderFile(file:string):string {
  const normalized=file.replaceAll('\\','/');
  return canonicalFile(normalized.startsWith('tests/render/')?normalized:`tests/render/${normalized}`,'render');
}
export function isControlOwner(owner:Owner):boolean {
  if(owner.stage==='render')return owner.file===N1_FILE&&owner.titlePath.length===1&&(CASES as readonly string[]).includes(owner.titlePath[0]);
  if(owner.file===UNIT_FILE)return [
    'N1 attributes an unexpected request even when the caller handles navigation',
    'N1 setup failure still writes a paired lifecycle',
    'N1 caller assertion outcome remains a failure after cleanup',
    'N1 handler failure is attributed despite a caught resource error',
    'N1 close failure is retained after fallback cleanup succeeds',
    'N1 invalid options are rejected before browser context creation',
    'N1 evidence write failure throws after closing the real context',
  ].includes(displayTitle(owner));
  // Exact controls only, never a filename-wide or prefix-wide waiver.
  return owner.file===ADOPTION_UNIT_FILE&&owner.titlePath.length===1&&[
    'N2A bounded response controls retain real failures',
    'N2A cumulative fulfilled bytes cannot reset across phases',
    'N2A owned axe controls retain real failures',
  ].includes(displayTitle(owner));
}
