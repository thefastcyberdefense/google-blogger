import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Data-only module: no browser import, process execution, or network operation.
export const POLICY='n1-v1';export const SCHEMA=1;
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
export const CODES=['N1_UNEXPECTED_REQUEST','N1_BYPASS','N1_COUNT','N1_OPTIONS','N1_POLICY','N1_SETUP','N1_HANDLER','N1_CLOSE','N1_OBSERVER','N1_EARLY_CLOSE','N1_WORKER','N1_LIMIT','N1_WRITE','N1_TEST_FAILED'] as const;
export interface Stamp {schema:number;policy:string;source:string;run:string;attempt:string}
export interface Manifest extends Stamp {kind:'manifest'}
export interface Identity {stage:'unit'|'render';project:string;engine:string;title:string;test:string;worker:number;retry:number;pid:number}
export interface Start extends Stamp {kind:'start';id:string;identity:Identity;expectedErrors:string[]}
export interface RequestRecord {seq:number;kind:'http'|'websocket';rule:string|null;action:'fulfill'|'deny'|'unexpected'|'unhandled';observed:boolean;handled:boolean}
export interface RuleRecord {id:string;action:'fulfill'|'deny';count:number|null;hits:number}
export interface DocumentRecord {id:string;attempts:number;acknowledged:number;intact:boolean;flushed:boolean}
export interface End extends Omit<Start,'kind'> {kind:'end';setup:boolean;closed:boolean;outcome:'passed'|'failed';errors:string[];rules:RuleRecord[];requests:RequestRecord[];documents:DocumentRecord[]}
export interface TestEntry {key:string;title:string;project:string;engine:string}
export interface ResultEntry extends TestEntry {status:string;expectedStatus:string;retry:number;worker:number;contexts:string[]}
export interface Discovery extends Stamp {kind:'discovery';tests:TestEntry[]}
export interface Results extends Stamp {kind:'results';status:string;errors:number;tests:ResultEntry[]}
export interface Snapshot {manifest?:unknown;records?:unknown[];discovery?:unknown;results?:unknown;browser?:unknown;unit?:unknown;readErrors?:string[]}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA=/^[0-9a-f]{40}$/;const HASH=/^[0-9a-f]{64}$/;
const MAX_FILE=128*1024,MAX_RECORDS=4096,MAX_TOTAL=16*1024*1024;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const array=(v:unknown):unknown[]=>Array.isArray(v)?v:[];
const text=(v:unknown,max=200):v is string=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
const integer=(v:unknown,max=1000000):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<=max;
const keys=(v:Record<string,unknown>,allowed:string[])=>Object.keys(v).every(k=>allowed.includes(k))&&allowed.every(k=>Object.hasOwn(v,k));
const stampKeys=['schema','policy','source','run','attempt'];
const startKeys=[...stampKeys,'kind','id','identity','expectedErrors'];
const endKeys=[...startKeys,'setup','closed','outcome','errors','rules','requests','documents'];
const entryKeys=['key','title','project','engine'];
const resultKeys=[...entryKeys,'status','expectedStatus','retry','worker','contexts'];
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export const testKey=(project:string,title:string)=>createHash('sha256').update(`${project}\0${title}`).digest('hex');
export const engineFor=(project:string)=>project.startsWith('firefox-')?'firefox':project.startsWith('webkit-')?'webkit':'chromium';
const validStamp=(v:unknown):v is Stamp=>object(v)&&v.schema===SCHEMA&&v.policy===POLICY&&typeof v.source==='string'&&SHA.test(v.source)&&typeof v.run==='string'&&/^[1-9][0-9]{0,19}$/.test(v.run)&&typeof v.attempt==='string'&&/^[1-9][0-9]{0,5}$/.test(v.attempt);
const sameStamp=(a:Stamp,b:Stamp)=>stampKeys.every(k=>a[k as keyof Stamp]===b[k as keyof Stamp]);
const errorsValid=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=CODES.length&&v.every(x=>typeof x==='string'&&(CODES as readonly string[]).includes(x))&&new Set(v).size===v.length;
const validIdentity=(v:unknown):v is Identity=>object(v)&&keys(v,['stage','project','engine','title','test','worker','retry','pid'])&&['unit','render'].includes(String(v.stage))&&text(v.project)&&['chromium','firefox','webkit'].includes(String(v.engine))&&text(v.title)&&typeof v.test==='string'&&HASH.test(v.test)&&v.test===testKey(v.project,v.title)&&integer(v.worker)&&v.retry===0&&integer(v.pid)&&v.pid>0;
const validEntry=(v:unknown):v is TestEntry=>object(v)&&text(v.title)&&text(v.project)&&typeof v.key==='string'&&v.key===testKey(v.project,v.title)&&v.engine===engineFor(v.project);
const validManifest=(v:unknown):v is Manifest=>object(v)&&validStamp(v)&&keys(v,[...stampKeys,'kind'])&&v.kind==='manifest';
export function validRecord(value:unknown):value is Start|End {
  if(!object(value)||!validStamp(value)||!UUID.test(String(value.id))||!validIdentity(value.identity)||!errorsValid(value.expectedErrors))return false;
  if(value.kind==='start')return keys(value,startKeys);
  if(value.kind!=='end'||!keys(value,endKeys)||typeof value.setup!=='boolean'||typeof value.closed!=='boolean'||!['passed','failed'].includes(String(value.outcome))||!errorsValid(value.errors))return false;
  if(!Array.isArray(value.rules)||value.rules.length>64||!value.rules.every(r=>object(r)&&keys(r,['id','action','count','hits'])&&text(r.id,64)&&/^[a-z][a-z0-9-]*$/.test(r.id)&&['fulfill','deny'].includes(String(r.action))&&(r.count===null||(integer(r.count,32)&&r.count>0))&&(r.action!=='deny'||r.count!==null)&&integer(r.hits,128)))return false;
  if(!Array.isArray(value.requests)||value.requests.length>128||!value.requests.every((r,i)=>object(r)&&keys(r,['seq','kind','rule','action','observed','handled'])&&r.seq===i+1&&['http','websocket'].includes(String(r.kind))&&(r.rule===null||text(r.rule,64))&&['fulfill','deny','unexpected','unhandled'].includes(String(r.action))&&typeof r.observed==='boolean'&&typeof r.handled==='boolean'))return false;
  return Array.isArray(value.documents)&&value.documents.length<=128&&value.documents.every(d=>object(d)&&keys(d,['id','attempts','acknowledged','intact','flushed'])&&UUID.test(String(d.id))&&integer(d.attempts,128)&&integer(d.acknowledged,128)&&typeof d.intact==='boolean'&&typeof d.flushed==='boolean');
}
export function stageRoot():string {const base=process.env.FCD_ISOLATION_EVIDENCE;if(!base||!path.isAbsolute(base))throw new Error('N1_EVIDENCE_ENV');return `${base}-browser-network`;}
function readJson(file:string,limit=MAX_FILE):unknown {const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size<2||stat.size>limit)throw new Error('N1_FILE_BOUND');return JSON.parse(fs.readFileSync(file,'utf8')) as unknown;}
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
export function loadManifest(root=stageRoot()):Manifest {const value=readJson(path.join(root,'manifest.json'));if(!validManifest(value)||value.source!==process.env.FCD_SOURCE)throw new Error('N1_MANIFEST');return value;}

/** Reconcile independent discovery, runner results, and paired lifecycle data. */
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
    // A deliberately asserted inner failure is not an unexpected failing owner.
    // Both the exact declared codes and the independent owner result must pass.
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
    if(end.documents.some(d=>!d.flushed||!d.intact||d.attempts!==d.acknowledged)&&!end.errors.includes('N1_OBSERVER')&&!end.errors.includes('N1_EARLY_CLOSE'))fail('N1_ACCOUNTING');
  }
  for(const id of ends.keys())if(!starts.has(id))fail('N1_UNFINISHED');
  const d=object(s.discovery)?s.discovery:{},r=object(s.results)?s.results:{};
  if(!validStamp(d)||!manifest||!sameStamp(d,manifest)||d.kind!=='discovery'||!keys(d,[...stampKeys,'kind','tests']))fail('N1_DISCOVERY');
  if(!validStamp(r)||!manifest||!sameStamp(r,manifest)||r.kind!=='results'||r.status!=='passed'||r.errors!==0||!keys(r,[...stampKeys,'kind','status','errors','tests']))fail('N1_RESULTS');
  const discovered=array(d.tests),resultEntries=array(r.tests);
  const wanted=PROJECTS.flatMap(project=>CASES.map(title=>testKey(project,title))).sort();
  if(!discovered.length||!discovered.every(e=>validEntry(e)&&object(e)&&keys(e,entryKeys))||!same(discovered.filter(validEntry).map(t=>t.key).sort(),wanted))fail('N1_DISCOVERY');
  if(!resultEntries.every(e=>validEntry(e)&&object(e)&&keys(e,resultKeys))||!same(resultEntries.filter(validEntry).map(t=>t.key).sort(),wanted))fail('N1_RESULTS');
  const referenced=new Set<string>();
  for(const entry of resultEntries) {
    if(!validEntry(entry)||!object(entry)||entry.status!=='passed'||entry.expectedStatus!=='passed'||entry.retry!==0||!integer(entry.worker)||!Array.isArray(entry.contexts)||entry.contexts.length<1||entry.contexts.length>16){fail('N1_RESULTS');continue;}
    for(const id of entry.contexts) {
      if(typeof id!=='string'||!UUID.test(id)||referenced.has(id)){fail('N1_DUPLICATE');continue;}
      referenced.add(id);const end=ends.get(id);
      if(!end||end.identity.stage!=='render'||end.identity.test!==entry.key||end.identity.worker!==entry.worker||end.identity.project!==entry.project||end.identity.engine!==entry.engine||end.identity.title!==entry.title)fail('N1_MISSING_CONTEXT');
    }
  }
  for(const end of ends.values())if(end.identity.stage==='render'&&!referenced.has(end.id))fail('N1_EXTRA_CONTEXT');
  const browser=object(s.browser)?s.browser:{},stats=object(browser.stats)?browser.stats:{};
  if(stats.unexpected!==0||stats.skipped!==0||stats.flaky!==0||array(browser.errors).length)fail('N1_BROWSER');
  const browserKeys:string[]=[];
  function visit(suites:unknown,depth=0,inheritedFile=''):void {
    if(depth>32){fail('N1_BROWSER');return;}
    for(const suite of array(suites)) {
      if(!object(suite)){fail('N1_BROWSER');continue;}
      const file=typeof suite.file==='string'?suite.file:inheritedFile;
      for(const spec of array(suite.specs)) {
        if(!object(spec))continue;const specFile=typeof spec.file==='string'?spec.file:file;
        if(!specFile.replaceAll('\\','/').endsWith('network-isolation.spec.ts'))continue;
        for(const test of array(spec.tests)) {
          if(!object(test)||!text(test.projectName)||!text(spec.title)){fail('N1_BROWSER');continue;}
          browserKeys.push(testKey(test.projectName,spec.title));const results=array(test.results);
          if(test.expectedStatus!=='passed'||test.status!=='expected'||results.length!==1||!object(results[0])||results[0].status!=='passed'||results[0].retry!==0)fail('N1_BROWSER');
        }
      }
      visit(suite.suites,depth+1,file);
    }
  }
  visit(browser.suites);if(!same(browserKeys.sort(),wanted))fail('N1_BROWSER');
  const unit=object(s.unit)?s.unit:{};
  if(unit.numFailedTests!==0||unit.numPendingTests!==0||!integer(unit.numPassedTests)||unit.numPassedTests<211)fail('N1_UNIT');
  const assertions:Record<string,unknown>[]=[];
  for(const suite of array(unit.testResults))if(object(suite)&&typeof suite.name==='string'&&suite.name.replaceAll('\\','/').endsWith('/tests/unit/browser-network.test.ts'))for(const a of array(suite.assertionResults))if(object(a))assertions.push(a);
  if(assertions.filter(a=>a.fullName===UNIT_CONSUMER&&a.status==='passed').length!==1)fail('N1_UNIT_CONSUMER');
  const consumers=[...ends.values()].filter(e=>e.identity.stage==='unit'&&e.identity.title===UNIT_CONSUMER);
  if(consumers.length!==1||consumers[0].errors.length||!consumers[0].setup||!consumers[0].requests.some(q=>q.action==='fulfill'&&q.observed&&q.handled))fail('N1_UNIT_CONSUMER');
  for(const end of ends.values())if(end.identity.stage==='unit'&&assertions.filter(a=>a.fullName===end.identity.title&&a.status==='passed').length!==1)fail('N1_UNIT_CONTEXT');
  return [...failures].sort();
}
export function finalizeEvidence(root:string,output:string,expected:Stamp,unitFile='unit-report.json',browserFile='test-results/browser.json') {
  const snapshot:Snapshot={records:[],readErrors:[]};const files=new Map<string,unknown>();let total=0;
  try {
    const stat=fs.lstatSync(root);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('N1_ROOT');
    const names=fs.readdirSync(root);if(names.length>MAX_RECORDS+4)throw new Error('N1_LIMIT');
    for(const name of names.sort()) {
      if(!/^(manifest|discovery|results|reporter-error|[0-9a-f-]{36}\.(start|end))\.json$/.test(name)){snapshot.readErrors!.push('N1_FILENAME');continue;}
      try {
        const file=path.join(root,name);total+=fs.lstatSync(file).size;if(total>MAX_TOTAL)throw new Error('N1_LIMIT');
        const value=readJson(file);files.set(name,value);
        if(name==='manifest.json')snapshot.manifest=value;
        else if(name==='discovery.json')snapshot.discovery=value;
        else if(name==='results.json')snapshot.results=value;
        else if(name==='reporter-error.json')snapshot.readErrors!.push('N1_REPORTER');
        else {if(!validRecord(value)||name!==`${value.id}.${value.kind}.json`)snapshot.readErrors!.push('N1_RECORD_SCHEMA');snapshot.records!.push(value);}
      } catch {snapshot.readErrors!.push('N1_PARSE');}
    }
  } catch {snapshot.readErrors!.push('N1_ROOT');}
  try{snapshot.unit=readJson(unitFile,16*1024*1024);}catch{snapshot.readErrors!.push('N1_UNIT_READ');}
  try{snapshot.browser=readJson(browserFile,80*1024*1024);}catch{snapshot.readErrors!.push('N1_BROWSER_READ');}
  const errors=validateSnapshot(snapshot,expected);
  const summary={...expected,kind:'summary',accepted:errors.length===0,errors,contexts:array(snapshot.records).filter(v=>object(v)&&v.kind==='end').length,discovered:object(snapshot.discovery)?array(snapshot.discovery.tests).length:0,nonAdopted:'All suites other than network-isolation.spec.ts and the explicitly recorded Vitest contexts remain N0-only.'};
  fs.mkdirSync(path.dirname(output),{recursive:true});fs.mkdirSync(output,{mode:0o700});
  for(const [name,value] of files)if(validRecord(value))writeEvidence(output,name,value);
  writeEvidence(output,'summary.json',summary);
  if(validManifest(snapshot.manifest))writeEvidence(output,'manifest.json',snapshot.manifest);
  if(!errors.includes('N1_DISCOVERY'))writeEvidence(output,'discovery.json',snapshot.discovery);
  if(!errors.includes('N1_RESULTS'))writeEvidence(output,'results.json',snapshot.results);
  return summary;
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
