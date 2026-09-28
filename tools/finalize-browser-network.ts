import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ADOPTED_FILES, TARGET_FILES, N1_FILE, UNIT_FILE, ADOPTION_UNIT_FILE, UNIT_CONSUMER, CASES, PROJECTS, OWNER_FIELDS, testKey, engineFor, validOwner, makeOwner, expectedOwners, displayTitle, normalRenderFile, isControlOwner, type Owner } from '../tests/helpers/browser-network-scope.ts';
export { UNIT_CONSUMER, CASES, PROJECTS, testKey, engineFor };
// Data-only: the scope dependency has no browser, filesystem, process or network I/O.
export const POLICY='n2a-v1';export const SCHEMA=2;
export const CODES=['N1_UNEXPECTED_REQUEST','N1_BYPASS','N1_COUNT','N1_OPTIONS','N1_POLICY','N1_SETUP','N1_HANDLER','N1_CLOSE','N1_OBSERVER','N1_EARLY_CLOSE','N1_WORKER','N1_LIMIT','N1_WRITE','N1_TEST_FAILED','N2A_PHASE','N2A_GATE'] as const;
export const RESPONSE_LIMITS=Object.freeze({html:500000,module:2097152,distinct:8388608,fulfilled:16777216,inline:65536,gate:3000});
export const MERMAID_ORIGIN='https://cdn.jsdelivr.net',MERMAID_PREFIX='/npm/mermaid@11.17.2/dist/';
export interface AssetRecord {id:string;kind:'html'|'mermaid';bytes:number;sha256:string;modulePath:string|null}
export interface PlanRuleRecord {id:string;phase:string|null;gate:string|null;asset:string|null;origin:'fixture'|'mermaid';match:string;resource:string;action:'fulfill'|'deny';count:number|null;bytes:number;sha256:string|null;status:number|null;abort:'failed'|'blockedbyclient'|null}
export interface PlanRecord {assets:AssetRecord[];phases:string[];transitions:{from:string;to:string}[];gates:string[];rules:PlanRuleRecord[];distinctBytes:number}
export interface ResponseRecord {seq:number;phase:string;rule:string|null;asset:string|null;gate:string|null;waited:boolean;bytes:number;sha256:string|null;status:number|null;outcome:'fulfilled'|'aborted'|'failed'}
export interface ResponseLedger {phase:string;transitions:{from:string;to:string;after:number}[];gates:{id:string;released:boolean;expired:boolean;waits:number;settled:number}[];responses:ResponseRecord[];chargedBytes:number;fulfilledBytes:number}
export interface Stamp {schema:number;policy:string;source:string;run:string;attempt:string}
export interface Manifest extends Stamp {kind:'manifest'}
export interface Identity extends Owner {engine:string;title:string;test:string;worker:number;retry:number;pid:number}
export interface Start extends Stamp {kind:'start';id:string;identity:Identity;expectedErrors:string[];plan?:PlanRecord|null}
export interface RequestRecord {seq:number;kind:'http'|'websocket';rule:string|null;action:'fulfill'|'deny'|'unexpected'|'unhandled';observed:boolean;handled:boolean}
export interface RuleRecord {id:string;action:'fulfill'|'deny';count:number|null;hits:number}
export interface DocumentRecord {id:string;attempts:number;acknowledged:number;intact:boolean;flushed:boolean}
export interface End extends Omit<Start,'kind'> {kind:'end';setup:boolean;closed:boolean;outcome:'passed'|'failed';errors:string[];rules:RuleRecord[];requests:RequestRecord[];documents:DocumentRecord[];response?:ResponseLedger|null}
export interface TestEntry extends Owner {key:string;title:string;engine:string}
export interface ResultEntry extends TestEntry {status:string;expectedStatus:string;retry:number;worker:number;contexts:string[]}
// Logical in-memory reports. On disk they MUST be a schema-2 index and pages.
export interface Discovery extends Stamp {kind:'discovery';tests:TestEntry[]}
export interface Results extends Stamp {kind:'results';status:string;errors:number;tests:ResultEntry[]}
export interface IndexPage {name:string;bytes:number;sha256:string;count:number}
export interface EvidenceIndex extends Stamp {kind:'discovery-index'|'results-index';pages:IndexPage[];total:number;status?:string;errors?:number}
export interface Snapshot {manifest?:unknown;records?:unknown[];discovery?:unknown;results?:unknown;browser?:unknown;unit?:unknown;readErrors?:string[]}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[0-9a-f]{40}$/;const HASH=/^[0-9a-f]{64}$/;
export const MAX_FILE=128*1024,MAX_RECORDS=4096,MAX_FILES=4100,MAX_TOTAL=16*1024*1024,PAGE_SIZE=64,MAX_PAGES=32;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const array=(v:unknown):unknown[]=>Array.isArray(v)?v:[];
const text=(v:unknown,max=200):v is string=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
const integer=(v:unknown,max=1000000):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=max;
const keys=(v:Record<string,unknown>,allowed:string[])=>Object.keys(v).every(k=>allowed.includes(k))&&allowed.every(k=>Object.hasOwn(v,k));
const stampKeys=['schema','policy','source','run','attempt'];
const startKeys=[...stampKeys,'kind','id','identity','expectedErrors'];
const endKeys=[...startKeys,'setup','closed','outcome','errors','rules','requests','documents'];
const entryKeys=[...OWNER_FIELDS,'key','title','engine'];
const resultKeys=[...entryKeys,'status','expectedStatus','retry','worker','contexts'];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const validStamp=(v:unknown):v is Stamp=>object(v)&&v.schema===SCHEMA&&v.policy===POLICY&&typeof v.source==='string'&&SHA.test(v.source)&&typeof v.run==='string'&&/^[1-9][0-9]{0,19}$/.test(v.run)&&typeof v.attempt==='string'&&/^[1-9][0-9]{0,5}$/.test(v.attempt);
const sameStamp=(a:Stamp,b:Stamp)=>stampKeys.every(k=>a[k as keyof Stamp]===b[k as keyof Stamp]);
const stamp=(s:Stamp):Stamp=>({schema:s.schema,policy:s.policy,source:s.source,run:s.run,attempt:s.attempt});
const errorsValid=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=CODES.length&&v.every(x=>typeof x==='string'&&(CODES as readonly string[]).includes(x))&&new Set(v).size===v.length;
const validIdentity=(v:unknown):v is Identity=>object(v)&&keys(v,[...OWNER_FIELDS,'engine','title','test','worker','retry','pid'])&&validOwner(v)&&v.engine===engineFor(v.project)&&v.title===displayTitle(v)&&typeof v.test==='string'&&HASH.test(v.test)&&v.test===testKey(v)&&integer(v.worker)&&v.retry===0&&integer(v.pid)&&v.pid>0;
const validEntry=(v:unknown):v is TestEntry=>object(v)&&validOwner(v)&&v.stage==='render'&&v.title===displayTitle(v)&&typeof v.key==='string'&&v.key===testKey(v)&&v.engine===engineFor(v.project);
const validManifest=(v:unknown):v is Manifest=>object(v)&&validStamp(v)&&keys(v,[...stampKeys,'kind'])&&v.kind==='manifest';
const label=(v:unknown):v is string=>text(v,64)&&/^[a-z][a-z0-9-]*$/.test(v);
const digest=(v:unknown):v is string=>typeof v==='string'&&HASH.test(v);
export function validModulePath(v:unknown):v is string {return text(v,180)&&/^[A-Za-z0-9_./-]+\.mjs$/.test(v)&&v.split('/').every(p=>p!==''&&p!=='.'&&p!=='..');}
export function responseOwner(owner:Owner):boolean {return owner.stage==='unit'?owner.file===ADOPTION_UNIT_FILE:TARGET_FILES.includes(owner.file)&&owner.file!==N1_FILE;}
export function validPlanRecord(v:unknown):v is PlanRecord {
  if(!object(v)||!keys(v,['assets','phases','transitions','gates','rules','distinctBytes'])||!Array.isArray(v.assets)||v.assets.length>64||!Array.isArray(v.phases)||v.phases.length<1||v.phases.length>8||!v.phases.every(label)||new Set(v.phases).size!==v.phases.length||!Array.isArray(v.gates)||v.gates.length>8||!v.gates.every(label)||new Set(v.gates).size!==v.gates.length||!Array.isArray(v.transitions)||v.transitions.length>28||!Array.isArray(v.rules)||v.rules.length>64||!integer(v.distinctBytes,RESPONSE_LIMITS.distinct))return false;
  const phases=v.phases as string[],gates=v.gates as string[];
  if(!v.transitions.every(e=>object(e)&&keys(e,['from','to'])&&typeof e.from==='string'&&typeof e.to==='string'&&phases.indexOf(e.from)>=0&&phases.indexOf(e.to)>phases.indexOf(e.from))||new Set(v.transitions.map(e=>JSON.stringify(e))).size!==v.transitions.length)return false;
  const reachable=new Set([phases[0]]);for(const phase of phases)if(reachable.has(phase))for(const edge of v.transitions as {from:string;to:string}[])if(edge.from===phase)reachable.add(edge.to);
  if(reachable.size!==phases.length)return false;
  if(!v.assets.every(a=>object(a)&&keys(a,['id','kind','bytes','sha256','modulePath'])&&label(a.id)&&['html','mermaid'].includes(String(a.kind))&&integer(a.bytes,a.kind==='html'?RESPONSE_LIMITS.html:RESPONSE_LIMITS.module)&&a.bytes>0&&digest(a.sha256)&&(a.kind==='html'?a.modulePath===null:validModulePath(a.modulePath))))return false;
  const assets=v.assets as AssetRecord[];
  if(new Set(assets.map(a=>a.id)).size!==assets.length||new Set(assets.filter(a=>a.kind==='mermaid').map(a=>a.modulePath)).size!==assets.filter(a=>a.kind==='mermaid').length||assets.reduce((n,a)=>n+a.bytes,0)!==v.distinctBytes)return false;
  if(!v.rules.every(r=>{
    if(!object(r)||!keys(r,['id','phase','gate','asset','origin','match','resource','action','count','bytes','sha256','status','abort'])||!label(r.id)||(r.phase!==null&&!phases.includes(String(r.phase)))||(r.gate!==null&&!gates.includes(String(r.gate)))||!['fixture','mermaid'].includes(String(r.origin))||!digest(r.match)||!['document','stylesheet','image','media','font','script','texttrack','xhr','fetch','eventsource','manifest','other'].includes(String(r.resource))||!['fulfill','deny'].includes(String(r.action))||(r.count!==null&&(!integer(r.count,32)||r.count===0))||!integer(r.bytes,RESPONSE_LIMITS.module))return false;
    const asset=r.asset===null?undefined:assets.find(a=>a.id===r.asset);
    if(r.asset!==null&&!asset)return false;
    if(r.action==='deny')return r.count!==null&&r.asset===null&&r.bytes===0&&r.sha256===null&&r.status===null&&r.gate===null&&['failed','blockedbyclient'].includes(String(r.abort));
    if(!digest(r.sha256)||!integer(r.status,599)||r.status<200||(r.status>=300&&r.status<400)||r.abort!==null)return false;
    if(asset&&(r.bytes!==asset.bytes||r.sha256!==asset.sha256))return false;
    if(r.origin==='mermaid')return asset?.kind==='mermaid'&&r.resource==='script'&&r.status===200;
    return asset?asset.kind==='html'&&r.resource==='document':r.bytes<=RESPONSE_LIMITS.inline;
  }))return false;
  const rules=v.rules as PlanRuleRecord[];
  return new Set(rules.map(r=>r.id)).size===rules.length&&assets.every(a=>rules.some(r=>r.asset===a.id))&&gates.every(g=>rules.some(r=>r.gate===g))&&!rules.some((r,i)=>rules.slice(0,i).some(p=>p.match===r.match&&(p.phase===null||r.phase===null||p.phase===r.phase)));
}
function validResponseLedger(v:unknown):v is ResponseLedger {
  return object(v)&&keys(v,['phase','transitions','gates','responses','chargedBytes','fulfilledBytes'])&&label(v.phase)&&Array.isArray(v.transitions)&&v.transitions.length<=7&&v.transitions.every(e=>object(e)&&keys(e,['from','to','after'])&&label(e.from)&&label(e.to)&&integer(e.after,128))&&Array.isArray(v.gates)&&v.gates.length<=8&&v.gates.every(g=>object(g)&&keys(g,['id','released','expired','waits','settled'])&&label(g.id)&&typeof g.released==='boolean'&&typeof g.expired==='boolean'&&integer(g.waits,128)&&integer(g.settled,128))&&Array.isArray(v.responses)&&v.responses.length<=128&&v.responses.every(r=>object(r)&&keys(r,['seq','phase','rule','asset','gate','waited','bytes','sha256','status','outcome'])&&integer(r.seq,128)&&r.seq>0&&label(r.phase)&&(r.rule===null||label(r.rule))&&(r.asset===null||label(r.asset))&&(r.gate===null||label(r.gate))&&typeof r.waited==='boolean'&&integer(r.bytes,RESPONSE_LIMITS.module)&&(r.sha256===null||digest(r.sha256))&&(r.status===null||integer(r.status,599)&&r.status>=200)&&['fulfilled','aborted','failed'].includes(String(r.outcome)))&&integer(v.chargedBytes,RESPONSE_LIMITS.fulfilled)&&integer(v.fulfilledBytes,RESPONSE_LIMITS.fulfilled);
}
export function validateResponseEvidence(start:Start,end:End):boolean {
  if(!Object.hasOwn(start,'plan'))return !Object.hasOwn(end,'plan')&&!Object.hasOwn(end,'response');
  if(!same(start.plan,end.plan)||!responseOwner(start.identity))return false;
  if(start.plan===null)return end.response===null&&!end.setup&&end.errors.includes('N1_POLICY');
  const p=start.plan,l=end.response;if(!p||!l||!validPlanRecord(p)||!validResponseLedger(l))return false;
  if(!same(end.rules.map(({id,action,count})=>({id,action,count})),p.rules.map(({id,action,count})=>({id,action,count}))))return false;
  let phase=p.phases[0],after=-1;const visited=new Set([phase]);
  for(const e of l.transitions){if(e.from!==phase||visited.has(e.to)||e.after<after||e.after>end.requests.length||!p.transitions.some(a=>a.from===e.from&&a.to===e.to))return false;phase=e.to;after=e.after;visited.add(phase);}
  if(phase!==l.phase||new Set(l.responses.map(r=>r.seq)).size!==l.responses.length||l.responses.some((r,i)=>i>0&&l.responses[i-1].seq>=r.seq))return false;
  if(!same(l.responses.map(r=>r.seq),end.requests.filter(r=>r.kind==='http'&&r.handled).map(r=>r.seq)))return false;
  for(const r of l.responses){
    const q=end.requests[r.seq-1],rule=p.rules.find(a=>a.id===r.rule),active=l.transitions.filter(e=>e.after<r.seq).at(-1)?.to??p.phases[0];
    if(!q||q.rule!==r.rule||r.phase!==active||!p.phases.includes(r.phase))return false;
    if(rule){
      if(rule.phase!==null&&rule.phase!==r.phase||r.asset!==rule.asset||r.gate!==rule.gate)return false;
      if(q.action!==rule.action)return false;
      if(rule.action==='fulfill'&&r.bytes>0&&(r.bytes!==rule.bytes||r.sha256!==rule.sha256||r.status!==rule.status))return false;
      if(rule.action==='fulfill'&&r.outcome==='fulfilled'&&(r.bytes!==rule.bytes||r.sha256!==rule.sha256||r.status!==rule.status))return false;
      if(rule.action==='deny'&&(r.outcome==='fulfilled'?(rule.resource!=='document'||r.status!==451||r.bytes>RESPONSE_LIMITS.inline||!digest(r.sha256)):r.outcome!=='aborted'&&r.outcome!=='failed'))return false;
    }else if(q.action!=='unexpected'||r.asset!==null||r.gate!==null)return false;
    if(r.outcome==='aborted'&&(r.bytes!==0||r.sha256!==null||r.status!==null))return false;
    if(r.outcome==='failed'&&!end.errors.some(c=>['N1_HANDLER','N1_LIMIT','N1_CLOSE','N2A_GATE'].includes(c)))return false;
    if(r.bytes===0&&r.sha256!==null&&r.outcome!=='fulfilled'&&r.outcome!=='failed')return false;
    if(r.waited&&r.gate===null)return false;
  }
  if(l.chargedBytes!==l.responses.reduce((n,r)=>n+r.bytes,0)||l.fulfilledBytes!==l.responses.filter(r=>r.outcome==='fulfilled').reduce((n,r)=>n+r.bytes,0))return false;
  if(!same(l.gates.map(g=>g.id),p.gates))return false;
  for(const g of l.gates){const waited=l.responses.filter(r=>r.gate===g.id&&r.waited).length;if(g.waits!==waited||g.settled!==waited||g.expired&&g.released||(!g.released||g.expired)&&!end.errors.includes('N2A_GATE'))return false;}
  return true;
}
export function entryFor(owner:Owner):TestEntry {return {...owner,key:testKey(owner),title:displayTitle(owner),engine:engineFor(owner.project)};}
export function validRecord(value:unknown):value is Start|End {
  if(!object(value)||!validStamp(value)||!UUID.test(String(value.id))||!validIdentity(value.identity)||!errorsValid(value.expectedErrors)||(value.expectedErrors.length>0&&!isControlOwner(value.identity)))return false;
  const planned=Object.hasOwn(value,'plan');
  if(planned&&(!responseOwner(value.identity)||(value.plan!==null&&!validPlanRecord(value.plan))))return false;
  if(value.kind==='start')return keys(value,[...startKeys,...(planned?['plan']:[])]);
  if(value.kind!=='end'||!keys(value,[...endKeys,...(planned?['plan','response']:[])])||typeof value.setup!=='boolean'||typeof value.closed!=='boolean'||!['passed','failed'].includes(String(value.outcome))||!errorsValid(value.errors)||(planned&&value.response!==null&&!validResponseLedger(value.response)))return false;
  if(!Array.isArray(value.rules)||value.rules.length>64||!value.rules.every(r=>object(r)&&keys(r,['id','action','count','hits'])&&text(r.id,64)&&/^[a-z][a-z0-9-]*$/.test(r.id)&&['fulfill','deny'].includes(String(r.action))&&(r.count===null||(integer(r.count,32)&&r.count>0))&&(r.action!=='deny'||r.count!==null)&&integer(r.hits,128)))return false;
  if(!Array.isArray(value.requests)||value.requests.length>128||!value.requests.every((r,i)=>object(r)&&keys(r,['seq','kind','rule','action','observed','handled'])&&r.seq===i+1&&['http','websocket'].includes(String(r.kind))&&(r.rule===null||text(r.rule,64))&&['fulfill','deny','unexpected','unhandled'].includes(String(r.action))&&typeof r.observed==='boolean'&&typeof r.handled==='boolean'))return false;
  return Array.isArray(value.documents)&&value.documents.length<=128&&value.documents.every(d=>object(d)&&keys(d,['id','attempts','acknowledged','intact','flushed'])&&UUID.test(String(d.id))&&integer(d.attempts,128)&&integer(d.acknowledged,128)&&typeof d.intact==='boolean'&&typeof d.flushed==='boolean');
}
export function stageRoot():string {const base=process.env.FCD_ISOLATION_EVIDENCE;if(!base||!path.isAbsolute(base))throw new Error('N1_EVIDENCE_ENV');return `${base}-browser-network`;}
function readJson(file:string,limit=MAX_FILE,owned=false):unknown {
  const before=fs.lstatSync(file);if(!before.isFile()||before.isSymbolicLink()||before.size<2||before.size>limit)throw new Error('N1_FILE_BOUND');
  const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try{
    const opened=fs.fstatSync(fd);
    if(!opened.isFile()||opened.dev!==before.dev||opened.ino!==before.ino||opened.size!==before.size)throw new Error('N1_FILE_CHANGED');
    const buffer=Buffer.alloc(before.size+1);let length=0;
    while(length<buffer.length){const n=fs.readSync(fd,buffer,length,buffer.length-length,null);if(n===0)break;length+=n;}
    const after=fs.fstatSync(fd);
    if(length!==before.size||after.size!==before.size||after.mtimeMs!==before.mtimeMs)throw new Error('N1_FILE_CHANGED');
    const bytes=buffer.subarray(0,length),value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    // Exact self-owned writer round trip, not a general RFC 8785 claim.
    if(owned&&!Buffer.from(JSON.stringify(value)).equals(bytes))throw new Error('N1_JSON_FORM');
    return value;
  }finally{fs.closeSync(fd);}
}
export function writeEvidence(root:string,name:string,value:unknown):void {
  if(!/^[a-z0-9][a-z0-9.-]{0,100}\.json$/.test(name))throw new Error('N1_WRITE');
  const stat=fs.lstatSync(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('N1_WRITE');
  const bytes=JSON.stringify(value);if(Buffer.byteLength(bytes)>MAX_FILE)throw new Error('N1_LIMIT');
  fs.writeFileSync(path.join(root,name),bytes,{flag:'wx',mode:0o600});
}
export function initializeEvidence(root:string,source:string,run:string,attempt:string):Manifest {
  const manifest:Manifest={schema:SCHEMA,policy:POLICY,source,run,attempt,kind:'manifest'};
  if(!path.isAbsolute(root)||!validManifest(manifest))throw new Error('N1_MANIFEST');
  fs.mkdirSync(root,{mode:0o700});writeEvidence(root,'manifest.json',manifest);return manifest;
}
export function loadManifest(root=stageRoot()):Manifest {const value=readJson(path.join(root,'manifest.json'),MAX_FILE,true);if(!validManifest(value)||value.source!==process.env.FCD_SOURCE)throw new Error('N1_MANIFEST');return value;}
export function writeIndexedEvidence(root:string,data:Discovery|Results):EvidenceIndex {
  if(!validStamp(data)||!['discovery','results'].includes(data.kind)||!Array.isArray(data.tests)||data.tests.length<1||data.tests.length>PAGE_SIZE*MAX_PAGES||data.tests.some(e=>!validEntry(e)||!object(e)||!keys(e,data.kind==='results'?resultKeys:entryKeys)))throw new Error('N2A_INDEX_SCHEMA');
  const tests=[...data.tests].sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);
  if(new Set(tests.map(t=>t.key)).size!==tests.length)throw new Error('N2A_INDEX_DUPLICATE');
  const pages:IndexPage[]=[];
  for(let offset=0;offset<tests.length;offset+=PAGE_SIZE){
    const page=offset/PAGE_SIZE,name=`${data.kind}-${String(page).padStart(4,'0')}.json`;
    const value={...stamp(data),kind:`${data.kind}-page`,page,tests:tests.slice(offset,offset+PAGE_SIZE)};
    const bytes=JSON.stringify(value);writeEvidence(root,name,value);
    pages.push({name,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),count:value.tests.length});
  }
  const index:EvidenceIndex={...stamp(data),kind:`${data.kind}-index`,pages,total:tests.length,...(data.kind==='results'?{status:data.status,errors:data.errors}:{})};
  writeEvidence(root,`${data.kind}.json`,index);return index;
}
export function readIndexedEvidence(files:ReadonlyMap<string,unknown>,kind:'discovery'|'results',manifest:Stamp):Discovery|Results {
  const index=files.get(`${kind}.json`);
  if(!object(index)||!validStamp(index)||!sameStamp(index,manifest)||index.kind!==`${kind}-index`||!keys(index,[...stampKeys,'kind','pages','total',...(kind==='results'?['status','errors']:[])])||!Array.isArray(index.pages)||index.pages.length<1||index.pages.length>MAX_PAGES||!integer(index.total,PAGE_SIZE*MAX_PAGES)||index.total<1)throw new Error('N2A_INDEX_SCHEMA');
  if(kind==='results'&&(!text(index.status,32)||!integer(index.errors)))throw new Error('N2A_INDEX_SCHEMA');
  const tests:TestEntry[]=[];const referenced:string[]=[];
  for(let n=0;n<index.pages.length;n++){
    const p=index.pages[n],name=`${kind}-${String(n).padStart(4,'0')}.json`;
    if(!object(p)||!keys(p,['name','bytes','sha256','count'])||p.name!==name||!integer(p.bytes,MAX_FILE)||p.bytes<2||typeof p.sha256!=='string'||!HASH.test(p.sha256)||!integer(p.count,PAGE_SIZE)||p.count<1||(n<index.pages.length-1&&p.count!==PAGE_SIZE))throw new Error('N2A_INDEX_PAGE');
    const value=files.get(name);
    if(!object(value)||!validStamp(value)||!sameStamp(value,manifest)||value.kind!==`${kind}-page`||value.page!==n||!keys(value,[...stampKeys,'kind','page','tests'])||!Array.isArray(value.tests)||value.tests.length!==p.count||value.tests.some(e=>!validEntry(e)||!object(e)||!keys(e,kind==='results'?resultKeys:entryKeys)))throw new Error('N2A_INDEX_PAGE');
    const bytes=JSON.stringify(value);
    if(Buffer.byteLength(bytes)!==p.bytes||hash(bytes)!==p.sha256)throw new Error('N2A_INDEX_DIGEST');
    tests.push(...value.tests as TestEntry[]);referenced.push(name);
  }
  const actual=[...files.keys()].filter(n=>n.startsWith(`${kind}-`)&&n.endsWith('.json')).sort();
  if(!same(actual,referenced)||tests.length!==index.total||tests.some((t,i)=>i>0&&tests[i-1].key>=t.key))throw new Error('N2A_INDEX_MEMBERSHIP');
  return kind==='discovery'?{...stamp(manifest),kind,tests}:{...stamp(manifest),kind,status:String(index.status),errors:Number(index.errors),tests:tests as ResultEntry[]};
}
/** Reconcile independently derived owners, runner results and paired records. */
export function validateSnapshot(raw:unknown,expected?:Stamp):string[] {
  const failures=new Set<string>();const fail=(code:string)=>{failures.add(code);};
  const s:Snapshot=object(raw)?raw:{};
  if(!s.manifest)fail('N1_MISSING_MANIFEST');if(!validManifest(s.manifest))fail('N1_MANIFEST');
  if(array(s.readErrors).length)fail('N1_READ');
  const manifest=validStamp(s.manifest)?s.manifest:undefined;
  if(manifest&&expected&&!sameStamp(manifest,expected))fail('N1_STALE');
  const starts=new Map<string,Start>(),ends=new Map<string,End>();
  if(!Array.isArray(s.records)||s.records.length===0||s.records.length>MAX_RECORDS)fail('N1_RECORDS');
  for(const value of array(s.records)) {
    if(!validRecord(value)){fail('N1_RECORD_SCHEMA');continue;}
    if(!manifest||!sameStamp(value,manifest))fail('N1_STALE');
    const map=value.kind==='start'?starts:ends;if(map.has(value.id))fail('N1_DUPLICATE');
    if(value.kind==='start')starts.set(value.id,value);else ends.set(value.id,value);
  }
  for(const [id,start] of starts) {
    const end=ends.get(id);if(!end){fail('N1_UNFINISHED');continue;}
    if(!same(start.identity,end.identity)||!same(start.expectedErrors,end.expectedErrors))fail('N1_IDENTITY');
    if(!validateResponseEvidence(start,end))fail('N2A_RESPONSE_ACCOUNTING');
    const assertedFailure=end.outcome==='failed'&&start.expectedErrors.includes('N1_TEST_FAILED')&&end.errors.includes('N1_TEST_FAILED');
    if(!end.closed||(end.outcome!=='passed'&&!assertedFailure)||(!end.setup&&!end.errors.includes('N1_SETUP')&&!end.errors.includes('N1_OPTIONS')&&!end.errors.includes('N1_POLICY')))fail('N1_LIFECYCLE');
    if(!same([...end.errors].sort(),[...end.expectedErrors].sort()))fail('N1_VIOLATION');
    const ids=new Set(end.rules.map(r=>r.id));if(ids.size!==end.rules.length)fail('N1_DUPLICATE');
    for(const r of end.rules) {
      const hits=end.requests.filter(q=>q.rule===r.id&&q.handled).length;
      if(hits!==r.hits)fail('N1_ACCOUNTING');
      if(r.count!==null&&r.count!==hits&&!end.errors.includes('N1_COUNT'))fail('N1_ACCOUNTING');
    }
    for(const r of end.requests) {
      if(!r.handled&&!end.errors.includes('N1_BYPASS'))fail('N1_ACCOUNTING');
      if(!r.observed&&!end.errors.includes('N1_OBSERVER'))fail('N1_ACCOUNTING');
      if(r.action==='unexpected'&&(!end.errors.includes('N1_UNEXPECTED_REQUEST')||r.rule!==null))fail('N1_ACCOUNTING');
      if(r.handled&&r.action==='unhandled')fail('N1_ACCOUNTING');
      if(!r.handled&&(r.action!=='unhandled'||r.rule!==null))fail('N1_ACCOUNTING');
      if(['fulfill','deny'].includes(r.action)&&r.rule===null)fail('N1_ACCOUNTING');
      if(r.rule!==null&&!ids.has(r.rule))fail('N1_ACCOUNTING');
      if(r.rule!==null&&r.handled&&r.action!==end.rules.find(q=>q.id===r.rule)?.action)fail('N1_ACCOUNTING');
    }
    if(new Set(end.documents.map(d=>d.id)).size!==end.documents.length)fail('N1_DUPLICATE');
    const acknowledged=end.documents.reduce((total,d)=>total+d.acknowledged,0);
    const observedSockets=end.requests.filter(r=>r.kind==='websocket'&&r.observed).length;
    if(acknowledged!==observedSockets)fail('N1_ACCOUNTING');
    if(end.documents.some(d=>!d.flushed||!d.intact||d.attempts!==d.acknowledged)&&!end.errors.includes('N1_OBSERVER')&&!end.errors.includes('N1_EARLY_CLOSE'))fail('N1_ACCOUNTING');
  }
  for(const id of ends.keys())if(!starts.has(id))fail('N1_UNFINISHED');
  const d=object(s.discovery)?s.discovery:{},r=object(s.results)?s.results:{};
  if(!validStamp(d)||!manifest||!sameStamp(d,manifest)||d.kind!=='discovery'||!keys(d,[...stampKeys,'kind','tests']))fail('N1_DISCOVERY');
  if(!validStamp(r)||!manifest||!sameStamp(r,manifest)||r.kind!=='results'||r.status!=='passed'||r.errors!==0||!keys(r,[...stampKeys,'kind','status','errors','tests']))fail('N1_RESULTS');
  const discovered=array(d.tests),resultEntries=array(r.tests);
  const wanted=expectedOwners().map(testKey).sort();
  if(!discovered.length||!discovered.every(e=>validEntry(e)&&object(e)&&keys(e,entryKeys))||!same(discovered.filter(validEntry).map(t=>t.key).sort(),wanted))fail('N1_DISCOVERY');
  if(!resultEntries.every(e=>validEntry(e)&&object(e)&&keys(e,resultKeys))||!same(resultEntries.filter(validEntry).map(t=>t.key).sort(),wanted))fail('N1_RESULTS');
  const referenced=new Set<string>(),reported=new Map<string,ResultEntry>();
  for(const entry of resultEntries) {
    if(!validEntry(entry)||!object(entry)||entry.status!=='passed'||entry.expectedStatus!=='passed'||entry.retry!==0||!integer(entry.worker)||!Array.isArray(entry.contexts)||entry.contexts.length<1||entry.contexts.length>16){fail('N1_RESULTS');continue;}
    reported.set(entry.key,entry as unknown as ResultEntry);
    for(const id of entry.contexts) {
      if(typeof id!=='string'||!UUID.test(id)||referenced.has(id)){fail('N1_DUPLICATE');continue;}
      referenced.add(id);const end=ends.get(id);
      if(!end||end.identity.stage!=='render'||end.identity.test!==entry.key||end.identity.worker!==entry.worker||end.identity.project!==entry.project||end.identity.engine!==entry.engine||end.identity.title!==entry.title||end.identity.file!==entry.file||!same(end.identity.titlePath,entry.titlePath))fail('N1_MISSING_CONTEXT');
    }
  }
  for(const end of ends.values())if(end.identity.stage==='render'&&!referenced.has(end.id))fail('N1_EXTRA_CONTEXT');
  const browser=object(s.browser)?s.browser:{},stats=object(browser.stats)?browser.stats:{};
  if(stats.unexpected!==0||stats.skipped!==0||stats.flaky!==0||stats.expected!==1674||array(browser.errors).length)fail('N1_BROWSER');
  const browserKeys:string[]=[];let totalBrowser=0,visited=0;
  function visit(suites:unknown,depth=0,inheritedFile='',ancestry:string[]=[]):void {
    if(depth>32){fail('N1_BROWSER');return;}
    for(const suite of array(suites)) {
      if(++visited>10000||!object(suite)){fail('N1_BROWSER');return;}
      const rawFile=typeof suite.file==='string'?suite.file:inheritedFile;
      const title=typeof suite.title==='string'?suite.title:'';
      const fileHeader=depth===0&&rawFile!==''&&[rawFile,rawFile.replaceAll('\\','/').split('/').at(-1)].includes(title);
      const titles=title&&!fileHeader?[...ancestry,title]:ancestry;
      for(const spec of array(suite.specs)) {
        if(!object(spec)){fail('N1_BROWSER');continue;}
        const rawSpecFile=typeof spec.file==='string'?spec.file:rawFile;
        let file:string;try{file=normalRenderFile(rawSpecFile);}catch{fail('N1_BROWSER');continue;}
        for(const test of array(spec.tests)) {
          totalBrowser++;
          if(totalBrowser>2000||!object(test)||!text(test.projectName)||!text(spec.title)){fail('N1_BROWSER');continue;}
          const results=array(test.results),result=object(results[0])?results[0]:{};
          if(test.expectedStatus!=='passed'||test.status!=='expected'||results.length!==1||result.status!=='passed'||result.retry!==0||(test.repeatEachIndex!==undefined&&test.repeatEachIndex!==0))fail('N1_BROWSER');
          if(!ADOPTED_FILES.includes(file))continue;
          let key:string;try{key=testKey(makeOwner('render',file,[...titles,spec.title],test.projectName));}catch{fail('N1_BROWSER');continue;}
          browserKeys.push(key);const entry=reported.get(key);
          const contexts=array(test.annotations).filter(a=>object(a)&&a.type==='n1-context').map(a=>(a as Record<string,unknown>).description);
          if(!entry||!integer(result.workerIndex)||result.workerIndex!==entry.worker||!same(contexts,entry.contexts))fail('N1_BROWSER');
        }
      }
      visit(suite.suites,depth+1,rawFile,titles);
    }
  }
  visit(browser.suites);if(totalBrowser!==1674||!same(browserKeys.sort(),wanted))fail('N1_BROWSER');
  const unit=object(s.unit)?s.unit:{};
  if(unit.numFailedTests!==0||unit.numPendingTests!==0||!integer(unit.numPassedTests)||unit.numPassedTests<297)fail('N1_UNIT');
  const assertions:{file:string;titlePath:string[];fullName:string;status:unknown}[]=[];
  for(const suite of array(unit.testResults))if(object(suite)&&typeof suite.name==='string'){
    const name=suite.name.replaceAll('\\','/');const file=[UNIT_FILE,ADOPTION_UNIT_FILE].find(f=>name===f||name.endsWith('/'+f));
    if(!file)continue;
    for(const a of array(suite.assertionResults)){
      if(!object(a)||!Array.isArray(a.ancestorTitles)||!a.ancestorTitles.every(t=>text(t))||!text(a.title)||typeof a.fullName!=='string'){fail('N1_UNIT');continue;}
      const titlePath=[...a.ancestorTitles as string[],a.title];
      if(titlePath.join(' ')!==a.fullName){fail('N1_UNIT');continue;}
      assertions.push({file,titlePath,fullName:a.fullName,status:a.status});
    }
  }
  if(assertions.filter(a=>a.file===UNIT_FILE&&a.fullName===UNIT_CONSUMER&&a.status==='passed').length!==1)fail('N1_UNIT_CONSUMER');
  const consumers=[...ends.values()].filter(e=>e.identity.stage==='unit'&&e.identity.file===UNIT_FILE&&e.identity.title===UNIT_CONSUMER);
  if(consumers.length!==1||consumers[0].errors.length||!consumers[0].setup||!consumers[0].requests.some(q=>q.action==='fulfill'&&q.observed&&q.handled))fail('N1_UNIT_CONSUMER');
  for(const end of ends.values())if(end.identity.stage==='unit'&&assertions.filter(a=>a.file===end.identity.file&&same(a.titlePath,end.identity.titlePath)&&a.status==='passed').length!==1)fail('N1_UNIT_CONTEXT');
  return [...failures].sort();
}
export function finalizeEvidence(root:string,output:string,expected:Stamp,unitFile='unit-report.json',browserFile='test-results/browser.json') {
  const snapshot:Snapshot={records:[],readErrors:[]};const files=new Map<string,unknown>();let total=0;
  try {
    const stat=fs.lstatSync(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('N1_ROOT');
    const names=fs.readdirSync(root);if(names.length>MAX_FILES)throw new Error('N1_LIMIT');
    for(const name of names.sort()) {
      if(!/^(manifest|discovery|results|reporter-error|(?:discovery|results)-[0-9]{4}|[0-9a-f-]{36}\.(?:start|end))\.json$/.test(name)){snapshot.readErrors!.push('N1_FILENAME');continue;}
      try {
        const file=path.join(root,name);total+=fs.lstatSync(file).size;if(total>MAX_TOTAL)throw new Error('N1_LIMIT');
        const value=readJson(file,MAX_FILE,true);files.set(name,value);
        if(name==='manifest.json')snapshot.manifest=value;
        else if(name==='reporter-error.json')snapshot.readErrors!.push('N1_REPORTER');
        else if(/\.(start|end)\.json$/.test(name)){if(!validRecord(value)||name!==`${value.id}.${value.kind}.json`)snapshot.readErrors!.push('N1_RECORD_SCHEMA');snapshot.records!.push(value);}
      } catch {snapshot.readErrors!.push('N1_PARSE');}
    }
  } catch {snapshot.readErrors!.push('N1_ROOT');}
  for(const kind of ['discovery','results'] as const)try{snapshot[kind]=readIndexedEvidence(files,kind,expected);}catch{snapshot.readErrors!.push(`N2A_${kind.toUpperCase()}_INDEX`);}
  try{snapshot.unit=readJson(unitFile,16*1024*1024);}catch{snapshot.readErrors!.push('N1_UNIT_READ');}
  try{snapshot.browser=readJson(browserFile,80*1024*1024);}catch{snapshot.readErrors!.push('N1_BROWSER_READ');}
  const errors=validateSnapshot(snapshot,expected);
  const ends=array(snapshot.records).filter((v):v is End=>validRecord(v)&&v.kind==='end');
  const planned=ends.filter(e=>e.plan&&e.response);
  const responseCapacity={plannedContexts:planned.length,maxDistinctBytes:Math.max(0,...planned.map(e=>e.plan!.distinctBytes)),maxChargedBytes:Math.max(0,...planned.map(e=>e.response!.chargedBytes)),maxFulfilledBytes:Math.max(0,...planned.map(e=>e.response!.fulfilledBytes)),maxRules:Math.max(0,...planned.map(e=>e.rules.length)),responses:planned.reduce((n,e)=>n+e.response!.responses.length,0),transitions:planned.reduce((n,e)=>n+e.response!.transitions.length,0),gates:planned.reduce((n,e)=>n+e.response!.gates.length,0)};
  const summary={...expected,kind:'summary',accepted:errors.length===0,errors,readErrors:[...new Set(snapshot.readErrors)],stagedBytes:total,stagedFiles:files.size,contexts:array(snapshot.records).filter(v=>object(v)&&v.kind==='end').length,discovered:object(snapshot.discovery)?array(snapshot.discovery.tests).length:0,indexPages:[...files.keys()].filter(n=>/^(discovery|results)-[0-9]{4}\.json$/.test(n)).length,adoptedFiles:ADOPTED_FILES,n2aScopeComplete:ADOPTED_FILES.length===TARGET_FILES.length,responseCapacity,nonAdopted:'Only the explicit adoptedFiles and recorded owners in the two approved unit files have browser-layer attribution; other browsers remain N0-only.'};
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(output,{mode:0o700});
  // Preserve complete valid raw pages/indexes as diagnostics, even on rejection.
  // Only summary.accepted establishes a reconciled set. No invalid file is fixed.
  for(const [name,value] of files)if(validRecord(value)||validManifest(value)||(object(value)&&validStamp(value)&&sameStamp(value,expected)&&/^(discovery|results)(-[0-9]{4})?\.json$/.test(name)))writeEvidence(output,name,value);
  writeEvidence(output,'summary.json',summary);return summary;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  try {
    const [mode,root,outputOrSource,sourceOrRun,runOrAttempt,attempt,unit,browser]=process.argv.slice(2);
    if(mode==='init'&&root&&outputOrSource&&sourceOrRun&&runOrAttempt&&!attempt){initializeEvidence(root,outputOrSource,sourceOrRun,runOrAttempt);console.log('N1_MANIFEST_INITIALIZED');}
    else if(mode==='finalize'&&root&&outputOrSource&&sourceOrRun&&runOrAttempt&&attempt){
      const expected:Stamp={schema:SCHEMA,policy:POLICY,source:sourceOrRun,run:runOrAttempt,attempt};if(!validStamp(expected))throw new Error('N1_MANIFEST');
      const result=finalizeEvidence(root,outputOrSource,expected,unit,browser);console.log(`::notice title=N1 evidence::${JSON.stringify(result)}`);
      if(!result.accepted){console.error(result.errors.join(','));process.exitCode=1;}
    }else throw new Error('N1_ARGUMENTS');
  }catch{console.error('N1_FINALIZER_FAILED');process.exitCode=1;}
}
