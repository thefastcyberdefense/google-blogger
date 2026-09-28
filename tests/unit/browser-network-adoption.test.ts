import { expect, test } from 'vitest';
import AxeBuilder from '@axe-core/playwright';
import { chromium, firefox, webkit, type Browser, type BrowserContext, type BrowserContextOptions, type Route, type Response } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import fs, { constants } from 'node:fs';
import { lstat, open, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ts from 'typescript';
import { assets, pug, root } from '../../tools/generate.ts';
import { createGuardedContext, FIXTURE_ORIGIN, validateFixtureRules, validateResponsePlan, matchFixtureRule, type FixtureAsset, type ResponsePlan, type FixtureRule, type GuardedContext, type GuardOptions } from '../helpers/browser-network.ts';
import { readAssetText, htmlAsset, fixtureHTML, mermaidCatalog, mermaidPlan } from '../helpers/render-fixtures.ts';
import { POLICY, SCHEMA, UNIT_CONSUMER, engineFor, testKey, loadManifest, stageRoot, validateSnapshot, initializeEvidence, writeIndexedEvidence, readIndexedEvidence, entryFor, MAX_FILE, MERMAID_ORIGIN, MERMAID_PREFIX, RESPONSE_LIMITS, validateResponseEvidence, validRecord, type Manifest, type Start, type End, type TestEntry, type ResultEntry, type EvidenceIndex } from '../../tools/finalize-browser-network.ts';
import { N1_FILE, UNIT_FILE, ADOPTION_UNIT_FILE, TARGET_FILES, ADOPTED_FILES, makeOwner, expectedOwners, infoOwner, reporterOwner } from '../helpers/browser-network-scope.ts';

// N2A-01 characterization only. This does not register routes or adopt suites.
// Runs under the existing Actions unit stage and its mandatory N0 boundary.
const limits = { html: 500000, module: 2097152, distinct: 8388608, fulfilled: 16777216, rules: 64 } as const;
const sha256 = (body: Buffer | string) => createHash('sha256').update(body).digest('hex');
type Measurement = { name: string; bytes: number; sha256: string };
function report(kind: string, value: unknown): void {
  const text = JSON.stringify(value);
  if (Buffer.byteLength(text) > 12000) throw new Error('N2A_PREFLIGHT_DIAGNOSTIC_BOUND');
  console.log(`::warning title=N2A preflight ${kind}::${text.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
}
let fixtureMeasurements: Promise<Measurement[]> | undefined;
function measureFixtures(): Promise<Measurement[]> {
  return fixtureMeasurements ??= (async () => {
    const compiled = await assets();
    const values: { name: string; html: string }[] = [];
    for (const view of ['home','article','paged','empty','error']) {
      values.push({name: view, html: pug.renderFile(path.join(root, `fixtures/${view === 'article' ? 'article' : 'home'}.pug`), {...compiled, fixtureView: view, pretty: true})});
    }
    for (const state of ['error','label','search','archive','home','generic']) {
      values.push({name: `state-${state}`, html: pug.renderFile(path.join(root, 'fixtures/home.pug'), {...compiled, fixtureView: state === 'generic' ? 'paged' : state, fixturePosts: [], fixtureEmptyState: state, fixtureEmptyContext: '<img src=x onerror=alert(1)> & "quoted"', pretty: true})});
    }
    const home = values.find(v => v.name === 'home')!;
    const article = values.find(v => v.name === 'article')!;
    values.push({name: 'profile', html: home.html.replace(/data:image\/svg\+xml,[^"\s]+/g, 'https://fcd-fixture.invalid/profile-image.svg')});
    values.push({name: 'article-enlarged', html: article.html.replace('</head>', '<style>html{font-size:200%}p{letter-spacing:.12em;word-spacing:.16em}</style></head>')});
    const data = JSON.parse(await readFile(path.join(root, 'fixtures/technical-content.json'), 'utf8'));
    expect(Array.isArray(data.diagrams)).toBe(true);
    expect(data.diagrams.length).toBeGreaterThan(0);
    data.diagrams = data.diagrams.slice(0, 1);
    values.push({name: 'technical', html: pug.renderFile(path.join(root, 'fixtures/technical-libraries.pug'), {...compiled, data})});
    return values.map(({name, html}) => ({name, bytes: Buffer.byteLength(html), sha256: sha256(html)}));
  })();
}
test('N2A preflight measures every adopted HTML variant without changing producers', async () => {
  const rows = await measureFixtures();report('HTML', rows);
  expect(rows).toHaveLength(14);expect(new Set(rows.map(row => row.name)).size).toBe(rows.length);
  for (const row of rows) {expect(row.bytes, row.name).toBeGreaterThan(0);expect(row.bytes, `N2A_HTML_LIMIT ${row.name}: ${row.bytes}`).toBeLessThanOrEqual(limits.html);}
}, 20000);
/** Read a locked installed module, never a request-derived path. No execution. */
async function readModule(base: string, relative: string): Promise<Buffer> {
  if (!/^[A-Za-z0-9_./-]+\.mjs$/.test(relative) || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('N2A_MODULE_PATH');
  let current = base;const parts = relative.split('/');
  for (let i = 0; i < parts.length; i++) {
    current = path.join(current, parts[i]);const stat = await lstat(current);
    if (stat.isSymbolicLink() || (i < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new Error('N2A_MODULE_TYPE');
  }
  const resolved = await realpath(current);if (!resolved.startsWith(base + path.sep)) throw new Error('N2A_MODULE_ESCAPE');
  const handle = await open(current, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > limits.module) throw new Error(`N2A_MODULE_LIMIT ${relative}: ${before.size}`);
    const body = await handle.readFile();const after = await handle.stat();
    if (body.length !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ino !== before.ino || after.dev !== before.dev) throw new Error('N2A_MODULE_CHANGED');
    return body;
  } finally { await handle.close(); }
}
function moduleImports(name: string, body: Buffer): { staticImports: string[]; dynamicImports: string[] } {
  const text = new TextDecoder('utf-8', {fatal: true}).decode(body);
  const source = ts.createSourceFile(name, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const staticImports: string[] = [], dynamicImports: string[] = [];
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      if (!ts.isStringLiteral(node.moduleSpecifier)) throw new Error('N2A_MODULE_NONLITERAL_STATIC');staticImports.push(node.moduleSpecifier.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const argument = node.arguments[0];
      if (node.arguments.length !== 1 || !argument || !ts.isStringLiteral(argument)) throw new Error(`N2A_MODULE_NONLITERAL_DYNAMIC ${name}`);dynamicImports.push(argument.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);return {staticImports, dynamicImports};
}
function relativeImport(parent: string, specifier: string): string {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) throw new Error(`N2A_MODULE_EXTERNAL_IMPORT ${parent}`);
  if (!/^[A-Za-z0-9_./-]+\.mjs$/.test(specifier)) throw new Error('N2A_MODULE_IMPORT_PATH');
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(parent), specifier));
  if (target.startsWith('../') || target.startsWith('/') || target === '..') throw new Error('N2A_MODULE_IMPORT_ESCAPE');return target;
}
test('N2A preflight measures the locked entry and flowchart closure against approved limits', async () => {
  const packageRoot = path.join(root, 'node_modules/mermaid');
  const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));expect(pkg.version).toBe('11.17.2');
  const base = await realpath(path.join(packageRoot, 'dist'));expect((await lstat(path.join(packageRoot, 'dist'))).isSymbolicLink()).toBe(false);
  const catalog = new Map<string, Measurement>(),dynamics = new Set<string>(),queue = ['mermaid.esm.min.mjs'];
  async function drain(): Promise<void> {
    while (queue.length) {
      const name = queue.shift()!;if (catalog.has(name)) continue;
      if (catalog.size >= limits.rules) throw new Error('N2A_MODULE_RULE_LIMIT');
      const body = await readModule(base, name);catalog.set(name, {name, bytes: body.length, sha256: sha256(body)});
      const imports = moduleImports(name, body);
      for (const specifier of imports.staticImports) queue.push(relativeImport(name, specifier));
      for (const specifier of imports.dynamicImports) dynamics.add(relativeImport(name, specifier));
    }
  }
  await drain();const entryStaticModules = catalog.size;
  const flow = [...dynamics].filter(name => /(?:^|\/)flowDiagram-[A-Za-z0-9_-]+\.mjs$/.test(name));
  report('dynamic inventory', {entryStaticModules, candidates: [...dynamics].sort(), selectedFlow: flow});
  expect(flow, 'exactly one flowchart dynamic entry is required; no guessed family expansion').toHaveLength(1);
  queue.push(flow[0]);await drain();
  const rows = [...catalog.values()].sort((a,b) => a.name.localeCompare(b.name));
  for (let i = 0; i < rows.length; i += 16) report(`module page ${i / 16}`, rows.slice(i, i + 16));
  const fixtures = await measureFixtures(),technical = fixtures.find(row => row.name === 'technical')!;
  const moduleBytes = rows.reduce((sum, row) => sum + row.bytes, 0),rules = rows.length + 2;
  const distinctBytes = moduleBytes + technical.bytes,estimatedFulfilledBytes = moduleBytes + technical.bytes * 2;
  const capacity = {version: pkg.version, entryStaticModules, modules: rows.length, moduleBytes, maxModuleBytes: Math.max(...rows.map(row => row.bytes)), rules, distinctBytes, estimatedFulfilledBytes, limits, caveat: 'Static preflight only; actual browser imports, repeats, response phases, contexts and evidence remain unverified.'};
  report('capacity', capacity);
  expect(rules, 'N2A_RULE_LIMIT').toBeLessThanOrEqual(limits.rules);expect(distinctBytes, 'N2A_DISTINCT_LIMIT').toBeLessThanOrEqual(limits.distinct);expect(estimatedFulfilledBytes, 'N2A_FULFILLED_LIMIT').toBeLessThanOrEqual(limits.fulfilled);
  const evidence = {...loadManifest(), kind: 'n2a-preflight', html: fixtures, modules: rows, dynamic: {entryStaticModules, candidates: [...dynamics].sort(), selectedFlow: flow}, capacity};
  await writeFile(`${stageRoot()}-preflight.json`, JSON.stringify(evidence), {flag:'wx', mode:0o600});
}, 20000);

// AC-02: complete runnable data, then change exactly one independent dimension.
function ownershipFixture() {
  const manifest:Manifest={schema:SCHEMA,policy:POLICY,kind:'manifest',source:'a'.repeat(40),run:'17',attempt:'1'};
  const records:(Start|End)[]=[], entries:TestEntry[]=[], results:ResultEntry[]=[];
  type Spec={file:string;title:string;tests:{projectName:string;expectedStatus:string;status:string;annotations:{type:string;description:string}[];results:{status:string;retry:number;workerIndex:number}[]}[]};
  type Suite={file?:string;title?:string;specs:Spec[];suites?:Suite[]};
  const specs:Spec[]=[];
  for(const owner of expectedOwners()){
    const id=randomUUID(),entry=entryFor(owner),title=entry.title;
    const start:Start={...manifest,kind:'start',id,identity:{...owner,engine:entry.engine,title,test:entry.key,worker:1,retry:0,pid:10},expectedErrors:[]};
    records.push(start,{...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[],requests:[],documents:[]});
    entries.push(entry);results.push({...entry,status:'passed',expectedStatus:'passed',retry:0,worker:1,contexts:[id]});
    specs.push({file:owner.file,title,tests:[{projectName:owner.project,expectedStatus:'passed',status:'expected',annotations:[{type:'n1-context',description:id}],results:[{status:'passed',retry:0,workerIndex:1}]}]});
  }
  const owner=makeOwner('unit',UNIT_FILE,[UNIT_CONSUMER],'vitest-chromium');
  const start:Start={...manifest,kind:'start',id:randomUUID(),identity:{...owner,engine:'chromium',title:UNIT_CONSUMER,test:testKey(owner),worker:0,retry:0,pid:11},expectedErrors:[]};
  records.push(start,{...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[{id:'home',action:'fulfill',count:1,hits:1}],requests:[{seq:1,kind:'http',rule:'home',action:'fulfill',observed:true,handled:true}],documents:[]});
  const unadopted:Spec[]=Array.from({length:1674-specs.length},(_,i)=>({file:'tests/render/unadopted-control.spec.ts',title:`unadopted ${i}`,tests:[{projectName:'390-light',expectedStatus:'passed',status:'expected',annotations:[],results:[{status:'passed',retry:0,workerIndex:1}]}]}));
  const suites:Suite[]=[{specs},{specs:unadopted}];
  return {manifest,records,discovery:{...manifest,kind:'discovery' as const,tests:entries},results:{...manifest,kind:'results' as const,status:'passed',errors:0,tests:results},browser:{stats:{expected:1674,unexpected:0,skipped:0,flaky:0},errors:[],suites},unit:{numFailedTests:0,numPendingTests:0,numPassedTests:299,testResults:[{name:'/fixture/tests/unit/browser-network.test.ts',assertionResults:[{fullName:UNIT_CONSUMER,title:UNIT_CONSUMER,ancestorTitles:[] as string[],status:'passed'}]}]}};
}
test('N2A ownership regression positive fixture is complete',()=>expect(validateSnapshot(ownershipFixture())).toEqual([]));
test('N2A normal report rejects a same-leaf file outside the approved owner',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].file='tests/render/foreign/network-isolation.spec.ts';
  expect(validateSnapshot(s),'N2A_FOREIGN_FILE_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects a different describe ancestry for the same leaf',()=>{
  const s=ownershipFixture(),spec=s.browser.suites[0].specs.shift()!;
  s.browser.suites[0].suites=[{file:spec.file,title:'different owner',specs:[spec]}];
  expect(validateSnapshot(s),'N2A_ANCESTRY_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects an independent worker mismatch',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].tests[0].results[0].workerIndex=7;
  expect(validateSnapshot(s),'N2A_WORKER_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A normal report rejects a swapped context annotation',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].tests[0].annotations=s.browser.suites[0].specs[1].tests[0].annotations;
  expect(validateSnapshot(s),'N2A_CONTEXT_FALSE_GREEN').toContain('N1_BROWSER');
});
test('N2A unit evidence rejects a project and engine disagreement',()=>{
  const s=ownershipFixture();for(const record of s.records)if(record.identity.stage==='unit')record.identity.engine='firefox';
  expect(validateSnapshot(s),'N2A_UNIT_ENGINE_FALSE_GREEN').toContain('N1_RECORD_SCHEMA');
});
test('N2A normal report requires context annotations and no missing baseline rows',()=>{
  const s=ownershipFixture();s.browser.suites[0].specs[0].tests[0].annotations=[];expect(validateSnapshot(s)).toContain('N1_BROWSER');
  const baseline=ownershipFixture();baseline.browser.suites[1].specs.pop();expect(validateSnapshot(baseline)).toContain('N1_BROWSER');
});
test('N2A ordinary adopted owners cannot declare expected guard violations',()=>{
  const s=ownershipFixture(),owner=makeOwner('render','tests/render/a11y.spec.ts',['home: accessible initial and expanded states'],'390-light');
  s.records[0].identity={...s.records[0].identity,...owner,title:owner.titlePath[0],test:testKey(owner)};s.records[0].expectedErrors=['N1_OBSERVER'];
  expect(validateSnapshot(s)).toContain('N1_RECORD_SCHEMA');
});
test('N2A target inventory is fixed at 1168 without claiming current complete adoption',()=>{
  const target=expectedOwners(TARGET_FILES);expect(target).toHaveLength(1168);expect(new Set(target.map(testKey)).size).toBe(1168);
  expect(expectedOwners().every(o=>ADOPTED_FILES.includes(o.file))).toBe(true);
});
test('N2A owner keys distinguish files title ancestry projects and stages',()=>{
  const owners=[makeOwner('render',N1_FILE,['same'],'390-light'),makeOwner('render','tests/render/a11y.spec.ts',['same'],'390-light'),makeOwner('render',N1_FILE,['group','same'],'390-light'),makeOwner('render',N1_FILE,['same'],'390-dark'),makeOwner('unit',UNIT_FILE,['same'],'vitest-chromium')];
  expect(new Set(owners.map(testKey)).size).toBe(owners.length);
  expect(testKey(owners[0])).toBe(sha256(JSON.stringify(['render',N1_FILE,['same'],'390-light',0])));
});
for(const file of ['tests/render/../unit/test.ts','/tests/render/test.ts','tests/render//test.ts','tests/render/%2e%2e/test.ts','tests/render/test.ts\n'])test(`N2A owner rejects unsafe path ${JSON.stringify(file)}`,()=>expect(()=>makeOwner('render',file,['test'],'390-light')).toThrow('N2A_OWNER'));
test('N2A owner rejects repeats and control characters without normalizing distinct titles',()=>{
  expect(()=>makeOwner('render',N1_FILE,['test'],'390-light',1)).toThrow('N2A_OWNER');
  expect(()=>makeOwner('render',N1_FILE,['test\n'],'390-light')).toThrow('N2A_OWNER');
  expect(testKey(makeOwner('render',N1_FILE,['Test'],'390-light'))).not.toBe(testKey(makeOwner('render',N1_FILE,['test'],'390-light')));
});
test('N2A public TestInfo and reporter ancestry normalize to the same owner',()=>{
  const file='/repository/'+N1_FILE,repositoryRoot='/repository',project='390-light';
  const info=infoOwner({file,repositoryRoot,titlePath:['network-isolation.spec.ts','group','leaf'],project,repeatEachIndex:0});
  const reporter=reporterOwner({file,repositoryRoot,title:'leaf',project,repeatEachIndex:0,ancestry:[{type:'root',title:''},{type:'project',title:project},{type:'file',title:'network-isolation.spec.ts',file},{type:'describe',title:'group'}]});
  expect(info).toEqual(reporter);expect(testKey(info)).toBe(testKey(reporter));
  expect(()=>infoOwner({file,repositoryRoot,titlePath:['other.spec.ts','leaf'],project,repeatEachIndex:0})).toThrow('N2A_INFO_ANCESTRY');
  expect(()=>reporterOwner({file,repositoryRoot,title:'leaf',project,repeatEachIndex:0,ancestry:[{type:'root',title:''}]})).toThrow('N2A_REPORTER_ANCESTRY');
});

function indexFixture(count=1168){
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'fcd-n2a-index-')),root=path.join(base,'staged');
  const manifest=initializeEvidence(root,'a'.repeat(40),'17','1');
  const tests=count===1168?expectedOwners(TARGET_FILES).map(entryFor):Array.from({length:count},(_,i)=>entryFor(makeOwner('render',N1_FILE,[`index control ${i}`],'390-light')));
  const index=writeIndexedEvidence(root,{...manifest,kind:'discovery',tests});
  const files=new Map<string,unknown>(fs.readdirSync(root).map(n=>[n,JSON.parse(fs.readFileSync(path.join(root,n),'utf8'))]));
  return {base,root,manifest,tests,index,files,read:()=>readIndexedEvidence(files,'discovery',manifest)};
}
function changedPage(f:ReturnType<typeof indexFixture>,mutate:(p:{tests:TestEntry[]})=>void){
  const name=f.index.pages[0].name,page=f.files.get(name) as {tests:TestEntry[]};mutate(page);
  const index=f.files.get('discovery.json') as EvidenceIndex,bytes=JSON.stringify(page);
  index.pages[0].bytes=Buffer.byteLength(bytes);index.pages[0].sha256=sha256(bytes);
}
test('N2A indexed evidence retains all 1168 owners in 19 bounded pages',()=>{
  const f=indexFixture();try{
    expect(f.index.pages).toHaveLength(19);expect(f.read().tests.map(e=>e.key)).toEqual(f.tests.map(e=>e.key).sort());
    for(const p of f.index.pages){expect(p.bytes).toBeLessThanOrEqual(MAX_FILE);expect(p.count).toBeLessThanOrEqual(64);}
    expect(()=>writeIndexedEvidence(f.root,{...f.manifest,kind:'discovery',tests:f.tests})).toThrow();
  }finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
for(const change of ['missing','reordered','duplicate-page','extra','stale','mixed-schema','bad-digest','bad-length','bad-count','duplicate-owner','reordered-owner','missing-index'] as const)test(`N2A indexed evidence rejects ${change}`,()=>{
  const f=indexFixture();try{
    const index=f.files.get('discovery.json') as EvidenceIndex;
    if(change==='missing')f.files.delete(index.pages[0].name);
    if(change==='reordered')index.pages.reverse();
    if(change==='duplicate-page')index.pages[1]={...index.pages[0]};
    if(change==='extra')f.files.set('discovery-0019.json',f.files.get(index.pages[0].name));
    if(change==='stale')Object.assign(f.files.get(index.pages[0].name) as object,{source:'b'.repeat(40)});
    if(change==='mixed-schema')Object.assign(f.files.get(index.pages[0].name) as object,{schema:1,policy:'n1-v1'});
    if(change==='bad-digest')index.pages[0].sha256='0'.repeat(64);
    if(change==='bad-length')index.pages[0].bytes++;
    if(change==='bad-count')index.pages[0].count--;
    if(change==='duplicate-owner')changedPage(f,p=>{p.tests[1]=p.tests[0];});
    if(change==='reordered-owner')changedPage(f,p=>{[p.tests[0],p.tests[1]]=[p.tests[1],p.tests[0]];});
    if(change==='missing-index')f.files.delete('discovery.json');
    expect(()=>f.read()).toThrow('N2A_INDEX');
  }finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
test('N2A indexed evidence enforces 32 pages and rejects boundary plus one',()=>{
  const f=indexFixture(2048);try{expect(f.index.pages).toHaveLength(32);expect(f.read().tests).toHaveLength(2048);const other=path.join(f.base,'other');fs.mkdirSync(other);const extra=entryFor(makeOwner('render',N1_FILE,['one too many'],'390-light'));expect(()=>writeIndexedEvidence(other,{...f.manifest,kind:'discovery',tests:[...f.tests,extra]})).toThrow('N2A_INDEX_SCHEMA');}finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
test('N2A indexed evidence does not bypass the unchanged per-file byte limit',()=>{
  const f=indexFixture(1);try{const other=path.join(f.base,'oversize');fs.mkdirSync(other);const tests=Array.from({length:64},(_,i)=>entryFor(makeOwner('render',N1_FILE,[...Array.from({length:15},()=> 'x'.repeat(200)),`large ${i}`],'390-light')));expect(()=>writeIndexedEvidence(other,{...f.manifest,kind:'discovery',tests})).toThrow('N1_LIMIT');}finally{fs.rmSync(f.base,{recursive:true,force:true});}
});

// AC-04/05 test-first controls call the existing real validator/guard. Unknown
// response metadata must not be silently accepted or served as an empty body.
const smallRule:FixtureRule={id:'home',path:'/',method:'GET',resource:'document',body:'<h1>inline control</h1>'};
for(const [name,extra] of [
  ['unknown field',{unapproved:true}],
  ['foreign origin',{origin:'https://elsewhere.invalid'}],
  ['body and asset modes',{asset:'html'}],
  ['forged asset reference',{asset:{body:'forged'}}],
  ['undeclared phase',{phase:'not-declared'}],
  ['undeclared gate',{gate:'not-declared'}],
  ['arbitrary abort reason',{abort:'timedout'}],
  ['denial with a body',{action:'deny',count:1}],
] as const)test(`N2A response policy rejects ${name}`,()=>expect(()=>validateFixtureRules([{...smallRule,...extra} as FixtureRule]),`N2A_IGNORED_POLICY ${name}`).toThrow('N1_POLICY'));
const registeredHTML='N2A real guard fulfills registered HTML beyond the inline limit';
test(registeredHTML,async()=>{
  const html='<!doctype html><h1>registered response control</h1><!--'+'x'.repeat(70000)+'-->';
  expect(Buffer.byteLength(html)).toBeGreaterThan(65536);expect(Buffer.byteLength(html)).toBeLessThanOrEqual(limits.html);
  const responsePlan={assets:[{id:'html',kind:'html',body:html,bytes:Buffer.byteLength(html),sha256:sha256(html)}],phases:['ready'],transitions:[],gates:[]};
  const rule=Object.assign({id:'home',path:'/',method:'GET',resource:'document',count:1},{asset:'html',phase:'ready'});
  const options:GuardOptions=Object.assign({...makeOwner('unit',ADOPTION_UNIT_FILE,[registeredHTML],'vitest-chromium'),title:registeredHTML,engine:'chromium'},{responsePlan});
  const browser=await chromium.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown;
  try{
    guard=await createGuardedContext(browser,[rule],options);const page=await guard.context.newPage();const response=await page.goto(FIXTURE_ORIGIN+'/');
    expect(response?.status()).toBe(200);
    expect(await page.locator('h1').count(),'N2A_REGISTERED_HTML_IGNORED').toBe(1);
    expect(await page.getByRole('heading').textContent()).toBe('registered response control');
    expect(sha256(await response!.body())).toBe(sha256(html));
  }catch(cause){failure=cause;}
  finally{if(guard)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
  if(failure)throw failure;
},30000);

function asset(id:string,body:string,kind:'html'|'mermaid'='html',modulePath?:string):FixtureAsset {
  return {id,kind,body,bytes:Buffer.byteLength(body),sha256:sha256(body),...(modulePath?{modulePath}:{})};
}
function assetPolicy(values:FixtureAsset[]) {
  const plan:ResponsePlan={assets:values,phases:['ready'],transitions:[],gates:[]};
  const rules:FixtureRule[]=values.map((a,i)=>({id:`asset-${i}`,method:'GET',resource:a.kind==='html'?'document':'script',path:a.kind==='html'?`/document-${i}`:MERMAID_PREFIX+a.modulePath,asset:a.id,...(a.kind==='mermaid'?{origin:MERMAID_ORIGIN}:{})}));
  return {plan,rules};
}
test('N2A asset classes enforce exact byte boundaries including multibyte content',()=>{
  for(const [kind,limit] of [['html',limits.html],['mermaid',limits.module]] as const){
    const p=assetPolicy([asset('bounded','x'.repeat(limit),kind,kind==='mermaid'?'mermaid.esm.min.mjs':undefined)]);
    expect(validateResponsePlan(p.rules,p.plan).assets[0].bytes).toBe(limit);
    p.plan.assets[0]=asset('bounded','x'.repeat(limit+1),kind,kind==='mermaid'?'mermaid.esm.min.mjs':undefined);
    expect(()=>validateResponsePlan(p.rules,p.plan)).toThrow('N1_POLICY');
  }
  const p=assetPolicy([asset('utf8','é'.repeat(250000))]);expect(validateResponsePlan(p.rules,p.plan).distinctBytes).toBe(500000);
  p.plan.assets[0].bytes=p.plan.assets[0].body.length;expect(()=>validateResponsePlan(p.rules,p.plan)).toThrow('N1_POLICY');
});
test('N2A distinct registered assets share an eight MiB budget across phases',()=>{
  const p=assetPolicy(Array.from({length:4},(_,i)=>asset(`module-${i}`,'x'.repeat(limits.module),'mermaid',`chunk-${i}.mjs`)));
  expect(validateResponsePlan(p.rules,p.plan).distinctBytes).toBe(limits.distinct);
  p.plan.phases.push('later');p.plan.transitions.push({from:'ready',to:'later'});
  p.plan.assets.push(asset('extra','x'));p.rules.push({id:'extra',path:'/later',method:'GET',resource:'document',asset:'extra',phase:'later'});
  expect(()=>validateResponsePlan(p.rules,p.plan)).toThrow('N1_POLICY');
});
test('N2A inline rule and all-phase rule limits remain unchanged',()=>{
  expect(()=>validateFixtureRules([{...smallRule,body:'x'.repeat(65536)}])).not.toThrow();
  expect(()=>validateFixtureRules([{...smallRule,body:'x'.repeat(65537)}])).toThrow('N1_POLICY');
  const plan:ResponsePlan={assets:[],phases:['ready','later'],transitions:[{from:'ready',to:'later'}],gates:[]};
  const rules=Array.from({length:64},(_,i)=>({...smallRule,id:`rule-${i}`,path:`/path-${i}`,phase:i%2?'ready':'later'}));
  expect(validateResponsePlan(rules,plan).rules).toHaveLength(64);
  expect(()=>validateResponsePlan([...rules,{...smallRule,id:'extra',path:'/extra'}],plan)).toThrow('N1_POLICY');
});
test('N2A asset registration rejects digest kind path mode and graph corruption',()=>{
  const mutations:((p:ReturnType<typeof assetPolicy>)=>void)[]=[
    p=>{p.plan.assets[0].sha256='0'.repeat(64);},p=>{p.plan.assets[0].bytes++;},p=>{p.plan.assets[0].body+='mutated';},
    p=>{p.plan.assets[0].modulePath='../escape.mjs';},p=>{p.plan.assets[0].modulePath='chunks/%2e%2e/escape.mjs';},
    p=>{p.plan.assets[0].modulePath='chunks//escape.mjs';},p=>{p.plan.assets[0].kind='html';},
    p=>{p.rules[0].body='second mode';},p=>{p.rules[0].asset='unregistered';},p=>{p.rules[0].resource='image';},
    p=>{p.rules[0].query='variant=1';},p=>{p.rules[0].headers={'access-control-allow-origin':'*'};},
    p=>{p.plan.phases.push('unreachable');},p=>{p.plan.phases.push('ready');},p=>{p.plan.gates.push('unused');},
    p=>{p.plan.transitions.push({from:'ready',to:'ready'});},p=>{p.rules[0].phase='unknown';},p=>{p.rules[0].gate='unknown';},
  ];
  for(const mutate of mutations){const p=assetPolicy([asset('module','export const local=true;','mermaid','mermaid.esm.min.mjs')]);mutate(p);expect(()=>validateResponsePlan(p.rules,p.plan)).toThrow('N1_POLICY');}
});
test('N2A module matching remains pinned to exact origin version query method and resource',()=>{
  const p=assetPolicy([asset('module','export const local=true;','mermaid','mermaid.esm.min.mjs')]);validateResponsePlan(p.rules,p.plan);
  const url=MERMAID_ORIGIN+MERMAID_PREFIX+'mermaid.esm.min.mjs';expect(matchFixtureRule(p.rules,url,'GET','script')?.id).toBe('asset-0');
  for(const [address,method,resource] of [[url.replace('@11.17.2','@11.17.1'),'GET','script'],[url+'?v=1','GET','script'],[url+'#fragment','GET','script'],[url.replace('cdn.jsdelivr.net','elsewhere.invalid'),'GET','script'],[url,'POST','script'],[url,'GET','fetch'],[url.replace('/dist/','/dist/%2e%2e/dist/'),'GET','script']])expect(matchFixtureRule(p.rules,address,method,resource)).toBeUndefined();
});

function responseFixture(gated=false){
  const raw:ResponsePlan={assets:[],phases:['ready'],transitions:[],gates:gated?['release']:[]};
  const rule:FixtureRule={...smallRule,count:1,...(gated?{gate:'release'}:{})},plan=validateResponsePlan([rule],raw);
  const owner=makeOwner('unit',ADOPTION_UNIT_FILE,['synthetic response accounting'],'vitest-chromium');
  const start:Start={schema:SCHEMA,policy:POLICY,source:'a'.repeat(40),run:'17',attempt:'1',kind:'start',id:randomUUID(),identity:{...owner,engine:'chromium',title:owner.titlePath[0],test:testKey(owner),worker:0,retry:0,pid:10},expectedErrors:[],plan};
  const end:End={...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],documents:[],rules:[{id:'home',action:'fulfill',count:1,hits:1}],requests:[{seq:1,kind:'http',rule:'home',action:'fulfill',observed:true,handled:true}],response:{phase:'ready',transitions:[],gates:gated?[{id:'release',released:true,expired:false,waits:1,settled:1}]:[],responses:[{seq:1,phase:'ready',rule:'home',asset:null,gate:gated?'release':null,waited:gated,bytes:plan.rules[0].bytes,sha256:plan.rules[0].sha256,status:200,outcome:'fulfilled'}],chargedBytes:plan.rules[0].bytes,fulfilledBytes:plan.rules[0].bytes}};
  return {start,end};
}
test('N2A response evidence has complete positive controls with and without gates',()=>{
  for(const gated of [false,true]){const {start,end}=responseFixture(gated);expect(validRecord(start)).toBe(true);expect(validRecord(end)).toBe(true);expect(validateResponseEvidence(start,end)).toBe(true);}
});
for(const corruption of ['missing','duplicate','wrong-phase','wrong-asset','wrong-digest','wrong-status','charged-reset','fulfilled-reset','phantom-transition','gate-count'] as const)test(`N2A response evidence rejects ${corruption}`,()=>{
  const {start,end}=responseFixture(true),l=end.response!,r=l.responses[0];
  if(corruption==='missing')l.responses=[];if(corruption==='duplicate')l.responses.push({...r});if(corruption==='wrong-phase')r.phase='other';if(corruption==='wrong-asset')r.asset='other';if(corruption==='wrong-digest')r.sha256='0'.repeat(64);if(corruption==='wrong-status')r.status=503;if(corruption==='charged-reset')l.chargedBytes=0;if(corruption==='fulfilled-reset')l.fulfilledBytes=0;if(corruption==='phantom-transition')l.transitions.push({from:'ready',to:'other',after:0});if(corruption==='gate-count')l.gates[0].settled=0;
  expect(validateResponseEvidence(start,end)).toBe(false);
});
test('N2A response evidence rejects an aborted successful fulfillment',()=>{
  const {start,end}=responseFixture(),l=end.response!;Object.assign(l.responses[0],{outcome:'aborted',bytes:0,sha256:null,status:null});l.chargedBytes=0;l.fulfilledBytes=0;
  expect(validateResponseEvidence(start,end),'N2A_ABORTED_FULFILLMENT_FALSE_GREEN').toBe(false);
});
test('N2A response evidence rejects released gates without an actual wait',()=>{
  const {start,end}=responseFixture(true),l=end.response!;l.responses[0].waited=false;l.gates[0].waits=0;l.gates[0].settled=0;
  expect(validateResponseEvidence(start,end),'N2A_PHANTOM_RELEASE_FALSE_GREEN').toBe(false);
});
test('N2A response evidence rejects forged uncharged failed response metadata',()=>{
  const {start,end}=responseFixture(),l=end.response!;end.errors=['N1_LIMIT'];Object.assign(l.responses[0],{outcome:'failed',bytes:0,sha256:'0'.repeat(64),status:503});l.chargedBytes=0;l.fulfilledBytes=0;
  expect(validateResponseEvidence(start,end),'N2A_UNCHARGED_METADATA_FALSE_GREEN').toBe(false);
});
for(const engine of [chromium,firefox,webkit]){
  const title=`N2A immutable response phases and release gate work in ${engine.name()}`;
  test(title,async()=>{
    const html='<!doctype html><h1>immutable phase</h1>',value=asset('html',html);
    const responsePlan:ResponsePlan={assets:[value],phases:['ready','later'],transitions:[{from:'ready',to:'later'}],gates:['release']};
    const rules:FixtureRule[]=[{id:'home',path:'/',method:'GET',resource:'document',asset:'html',phase:'ready',count:1},{id:'later',path:'/',method:'GET',resource:'document',asset:'html',phase:'later',count:1},{id:'data',path:'/data',method:'GET',resource:'fetch',body:'released',gate:'release',count:1}];
    const browser=await engine.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown;
    try{
      guard=await createGuardedContext(browser,rules,{...makeOwner('unit',ADOPTION_UNIT_FILE,[title],`vitest-${engine.name()}`),title,engine:engine.name(),responsePlan});
      value.body='mutated';value.sha256=sha256(value.body);value.bytes=Buffer.byteLength(value.body);rules[2].body='mutated';
      const page=await guard.context.newPage();expect((await page.goto(FIXTURE_ORIGIN+'/'))?.status()).toBe(200);expect(await page.getByRole('heading').textContent()).toBe('immutable phase');
      const fetched=page.evaluate(()=>fetch('/data').then(r=>r.text()));await expect.poll(()=>guard!.pendingGate('release'),{timeout:2000}).toBe(1);
      guard.releaseGate('release');expect(await fetched).toBe('released');expect(guard.pendingGate('release')).toBe(0);
      guard.transition('later');expect(guard.phase).toBe('later');await page.reload();expect(await page.getByRole('heading').textContent()).toBe('immutable phase');
      await guard.finish();const start=JSON.parse(fs.readFileSync(path.join(stageRoot(),`${guard.id}.start.json`),'utf8')) as Start,end=JSON.parse(fs.readFileSync(path.join(stageRoot(),`${guard.id}.end.json`),'utf8')) as End;
      expect(validateResponseEvidence(start,end)).toBe(true);expect(end.response?.transitions).toEqual([{from:'ready',to:'later',after:2}]);expect(end.response?.chargedBytes).toBe(Buffer.byteLength(html)*2+8);expect(end.response?.fulfilledBytes).toBe(end.response?.chargedBytes);
      expect(end.response?.gates).toEqual([{id:'release',released:true,expired:false,waits:1,settled:1}]);expect(end.rules.map(r=>r.hits)).toEqual([1,1,1]);expect(browser.contexts()).toHaveLength(0);
    }catch(cause){failure=cause;}
    finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
    if(failure)throw failure;
  },30000);
}

function pairFor(guard:GuardedContext):{start:Start;end:End}{
  return {start:JSON.parse(fs.readFileSync(path.join(stageRoot(),`${guard.id}.start.json`),'utf8')) as Start,end:JSON.parse(fs.readFileSync(path.join(stageRoot(),`${guard.id}.end.json`),'utf8')) as End};
}
const unitOptions=(title:string,responsePlan:ResponsePlan,expectedErrors:string[]=[]):GuardOptions=>({...makeOwner('unit',ADOPTION_UNIT_FILE,[title],'vitest-chromium'),title,engine:'chromium',responsePlan,expectedErrors});
function publicDependency<T extends object>(target:T,overrides:Partial<T>):T {
  return new Proxy(target,{get(object,key){const owner=Object.hasOwn(overrides,key)?overrides:object;const value:unknown=Reflect.get(owner,key,owner);return typeof value==='function'?value.bind(owner):value;}});
}
test('N2A local asset reads reject escapes symlinks malformed UTF8 and boundary plus one',async()=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'fcd-n2a-asset-'));
  try{
    fs.mkdirSync(path.join(base,'real'));fs.writeFileSync(path.join(base,'real/good.mjs'),'export{}');
    expect(await readAssetText(base,'real/good.mjs',8)).toBe('export{}');
    await expect(readAssetText(base,'real/good.mjs',7)).rejects.toThrow('N2A_ASSET_LIMIT');
    for(const name of ['../escape.mjs','/escape.mjs','real//good.mjs','real/%2e%2e/good.mjs','real\\good.mjs','real/good.mjs\n'])await expect(readAssetText(base,name,64)).rejects.toThrow('N2A_ASSET_PATH');
    fs.symlinkSync(path.join(base,'real/good.mjs'),path.join(base,'file-link.mjs'));fs.symlinkSync(path.join(base,'real'),path.join(base,'directory-link'),'dir');
    await expect(readAssetText(base,'file-link.mjs',64)).rejects.toThrow('N2A_ASSET_TYPE');await expect(readAssetText(base,'directory-link/good.mjs',64)).rejects.toThrow('N2A_ASSET_TYPE');
    await expect(readAssetText(base,'real',64)).rejects.toThrow('N2A_ASSET_TYPE');
    fs.writeFileSync(path.join(base,'bad.mjs'),Buffer.from([0xc3,0x28]));await expect(readAssetText(base,'bad.mjs',64)).rejects.toThrow();
    const held=await readAssetText(base,'real/good.mjs',64);fs.writeFileSync(path.join(base,'real/good.mjs'),'changed');expect(held).toBe('export{}');
    const frozen=htmlAsset('html','<h1>held</h1>');expect(Object.isFrozen(frozen)).toBe(true);expect(frozen.sha256).toBe(sha256(frozen.body));
    await expect(fixtureHTML('../unapproved')).rejects.toThrow('N2A_FIXTURE_NAME');
  }finally{fs.rmSync(base,{recursive:true,force:true});}
});
test('N2A catalog contains the exact installed flowchart and dagre closure',async()=>{
  const values=await mermaidCatalog(),plan=await mermaidPlan(),metadata=validateResponsePlan(plan.rules,plan.responsePlan);
  expect(Object.isFrozen(values)).toBe(true);expect(values.every(Object.isFrozen)).toBe(true);
  expect(values.some(a=>a.modulePath==='mermaid.esm.min.mjs')).toBe(true);expect(values.some(a=>a.modulePath==='chunks/mermaid.esm.min/flowDiagram-YHGXBVSY.mjs')).toBe(true);expect(values.some(a=>a.modulePath==='chunks/mermaid.esm.min/dagre-MPVFI544.mjs')).toBe(true);
  expect(values.some(a=>/sizeCapture|katex|sequenceDiagram|architectureDiagram/.test(a.modulePath!))).toBe(false);
  expect(new Set(values.map(a=>a.modulePath)).size).toBe(values.length);expect(plan.rules.length).toBeLessThanOrEqual(64);expect(metadata.distinctBytes).toBeLessThanOrEqual(limits.distinct);
  for(const a of values){expect(a.bytes).toBe(Buffer.byteLength(a.body));expect(a.sha256).toBe(sha256(a.body));expect(a.bytes).toBeLessThanOrEqual(limits.module);}
  report('registered catalog',values.map(({id,modulePath,bytes,sha256})=>({id,modulePath,bytes,sha256})));
});
const negativeResponses='N2A bounded response controls retain real failures';
test(negativeResponses,async()=>{
  const browser=await chromium.launch({headless:true});
  const empty=():ResponsePlan=>({assets:[],phases:['ready','later'],transitions:[{from:'ready',to:'later'}],gates:[]});
  const gated=():ResponsePlan=>({...empty(),gates:['release']});
  const gatedRules:FixtureRule[]=[{...smallRule,count:1},{id:'data',path:'/data',method:'GET',resource:'fetch',body:'released',gate:'release',count:1}];
  async function run(codes:string[],rules:FixtureRule[],plan:ResponsePlan,body:(guard:GuardedContext)=>Promise<void>,factory:Browser=browser){
    let guard:GuardedContext|undefined,failure:unknown;
    try{
      guard=await createGuardedContext(factory,rules,unitOptions(negativeResponses,plan,codes));await body(guard);
      await expect(guard.finish()).rejects.toMatchObject({codes:[...codes].sort()});const pair=pairFor(guard);expect(validateResponseEvidence(pair.start,pair.end)).toBe(true);return pair.end;
    }catch(cause){failure=cause;throw cause;}
    finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){if(!failure)throw cause;}}
  }
  try{
    let calls=0;const unavailable={newContext:async()=>{calls++;throw new Error('registration must precede creation');}} as unknown as Browser;
    await expect(createGuardedContext(unavailable,[smallRule],{...unitOptions(negativeResponses,empty(),['N1_POLICY']),responsePlan:{...empty(),unapproved:true}})).rejects.toMatchObject({codes:['N1_POLICY']});expect(calls).toBe(0);
    const phase=await run(['N2A_PHASE'],[],empty(),async g=>{expect(()=>g.transition('unknown')).toThrow('N2A_PHASE');g.transition('later');expect(()=>g.transition('later')).toThrow('N2A_PHASE');expect(()=>g.transition('ready')).toThrow('N2A_PHASE');});expect(phase.response?.transitions).toEqual([{from:'ready',to:'later',after:0}]);
    const pending=await run(['N2A_PHASE'],gatedRules,gated(),async g=>{const p=await g.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');const fetched=p.evaluate(()=>fetch('/data').then(r=>r.text()));await expect.poll(()=>g.pendingGate('release'),{timeout:2000}).toBe(1);expect(()=>g.transition('later')).toThrow('N2A_PHASE');g.releaseGate('release');expect(await fetched).toBe('released');});expect(pending.response?.gates[0].released).toBe(true);
    await run(['N2A_GATE'],[{...gatedRules[1],count:undefined}],gated(),async g=>{expect(()=>g.releaseGate('release')).toThrow('N2A_GATE');expect(()=>g.releaseGate('unknown')).toThrow('N2A_GATE');});
    const expired=await run(['N2A_GATE'],gatedRules,gated(),async g=>{const p=await g.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');const fetched=p.evaluate(()=>fetch('/data').then(()=>false,()=>true));await expect.poll(()=>g.pendingGate('release'),{timeout:2000}).toBe(1);expect(await fetched).toBe(true);expect(()=>g.releaseGate('release')).toThrow('N2A_GATE');});expect(expired.response?.gates).toEqual([{id:'release',released:false,expired:true,waits:1,settled:1}]);
    let waiting:Promise<unknown>|undefined;
    const unreleased=await run(['N2A_GATE'],gatedRules,gated(),async g=>{const p=await g.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');waiting=p.evaluate(()=>fetch('/data').then(()=>false,()=>true)).catch(()=>true);await expect.poll(()=>g.pendingGate('release'),{timeout:2000}).toBe(1);});await waiting;expect(unreleased.response?.gates).toEqual([{id:'release',released:false,expired:false,waits:1,settled:1}]);
    await run(['N2A_GATE'],gatedRules,gated(),async g=>{const p=await g.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');const fetched=p.evaluate(()=>fetch('/data').then(r=>r.text()));await expect.poll(()=>g.pendingGate('release'),{timeout:2000}).toBe(1);g.releaseGate('release');expect(await fetched).toBe('released');expect(()=>g.releaseGate('release')).toThrow('N2A_GATE');});
    const fault={newContext:async(opts:BrowserContextOptions)=>{const real=await browser.newContext(opts);return publicDependency<BrowserContext>(real,{route:async(url,handler,routeOptions)=>real.route(url,async(route,request)=>{const adapted=publicDependency<Route>(route,{fulfill:async response=>{if(request.resourceType()==='fetch')throw new Error('controlled planned fulfillment failure');await route.fulfill(response);}});await handler(adapted,request);},routeOptions)});}} as unknown as Browser;
    const handler=await run(['N1_HANDLER'],[smallRule,{id:'data',path:'/data',method:'GET',resource:'fetch',body:'attempted',count:1}],empty(),async g=>{const p=await g.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');expect(await p.evaluate(()=>fetch('/data').then(()=>false,()=>true))).toBe(true);},fault);
    expect(handler.response?.responses.at(-1)).toMatchObject({outcome:'failed',bytes:9,sha256:sha256('attempted'),status:200});expect(handler.response!.chargedBytes-handler.response!.fulfilledBytes).toBe(9);expect(browser.contexts()).toHaveLength(0);
  }finally{await browser.close();}
},30000);
test('N2A cumulative fulfilled bytes cannot reset across phases',async()=>{
  const title='N2A cumulative fulfilled bytes cannot reset across phases',prefix='<!doctype html><h1>budget</h1><!--',suffix='-->';
  const sized=(length:number)=>prefix+'x'.repeat(length-Buffer.byteLength(prefix+suffix))+suffix;
  const responsePlan:ResponsePlan={assets:[asset('large',sized(500000)),asset('tail',sized(limits.fulfilled-33*500000)),asset('extra','x')],phases:['ready','later'],transitions:[{from:'ready',to:'later'}],gates:[]};
  const rules:FixtureRule[]=[{id:'first',path:'/',method:'GET',resource:'document',asset:'large',phase:'ready',count:32},{id:'later',path:'/',method:'GET',resource:'document',asset:'large',phase:'later',count:1},{id:'tail',path:'/tail',method:'GET',resource:'document',asset:'tail',count:1},{id:'extra',path:'/extra',method:'GET',resource:'document',asset:'extra',count:1}];
  const browser=await chromium.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown;
  try{
    guard=await createGuardedContext(browser,rules,{...unitOptions(title,responsePlan,['N1_LIMIT']),contextOptions:{javaScriptEnabled:false}});const page=await guard.context.newPage();
    for(let i=0;i<32;i++)expect((await page.goto(FIXTURE_ORIGIN+'/'))?.status()).toBe(200);
    guard.transition('later');expect((await page.goto(FIXTURE_ORIGIN+'/'))?.status()).toBe(200);expect((await page.goto(FIXTURE_ORIGIN+'/tail'))?.status()).toBe(200);
    expect(await page.goto(FIXTURE_ORIGIN+'/extra').then(()=>false,()=>true)).toBe(true);await expect(guard.finish()).rejects.toMatchObject({codes:['N1_LIMIT']});
    const pair=pairFor(guard);expect(validateResponseEvidence(pair.start,pair.end)).toBe(true);expect(pair.end.response?.chargedBytes).toBe(limits.fulfilled);expect(pair.end.response?.fulfilledBytes).toBe(limits.fulfilled);expect(pair.end.response?.responses).toHaveLength(35);expect(pair.end.response?.responses.at(-1)).toMatchObject({bytes:0,sha256:null,status:null,outcome:'failed'});expect(pair.end.rules.map(r=>r.hits)).toEqual([32,1,1,1]);
  }catch(cause){failure=cause;}
  finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
  if(failure)throw failure;
},30000);
test('N2A late response controls cannot overwrite a sealed record',async()=>{
  // Deliberately rejected synthetic evidence, isolated from the acceptance root,
  // just like the inherited N1 exclusive-write corruption control.
  const manifest=loadManifest(),previous=process.env.FCD_ISOLATION_EVIDENCE,base=fs.mkdtempSync(path.join(os.tmpdir(),'fcd-n2a-late-'));
  const browser=await chromium.launch({headless:true});
  try{
    process.env.FCD_ISOLATION_EVIDENCE=path.join(base,'isolation');initializeEvidence(stageRoot(),manifest.source,manifest.run,manifest.attempt);
    const title='N2A late response controls cannot overwrite a sealed record',plan:ResponsePlan={assets:[],phases:['ready','later'],transitions:[{from:'ready',to:'later'}],gates:[]};
    const guard=await createGuardedContext(browser,[],unitOptions(title,plan));await guard.finish();const file=path.join(stageRoot(),`${guard.id}.end.json`),before=fs.readFileSync(file,'utf8');
    expect(()=>guard.transition('later')).toThrow('N2A_PHASE');expect(fs.readFileSync(file,'utf8')).toBe(before);expect(JSON.parse(fs.readFileSync(path.join(stageRoot(),'reporter-error.json'),'utf8'))).toMatchObject({source:manifest.source,id:guard.id,code:'N2A_PHASE'});expect(browser.contexts()).toHaveLength(0);
  }finally{process.env.FCD_ISOLATION_EVIDENCE=previous;await browser.close();fs.rmSync(base,{recursive:true,force:true});}
},30000);
test('N2A declared network abort remains distinct from HTTP 503',async()=>{
  const title='N2A declared network abort remains distinct from HTTP 503',plan:ResponsePlan={assets:[],phases:['ready'],transitions:[],gates:[]};
  const rules:FixtureRule[]=[{...smallRule,count:1},{id:'abort',path:'/abort',method:'GET',resource:'fetch',action:'deny',abort:'failed',count:1},{id:'unavailable',path:'/unavailable',method:'GET',resource:'fetch',status:503,body:'Unavailable',count:1}];
  const browser=await chromium.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown;
  try{
    guard=await createGuardedContext(browser,rules,unitOptions(title,plan));const p=await guard.context.newPage();await p.goto(FIXTURE_ORIGIN+'/');expect(await p.evaluate(()=>fetch('/abort').then(()=>false,()=>true))).toBe(true);expect(await p.evaluate(()=>fetch('/unavailable').then(async r=>({status:r.status,body:await r.text()})))).toEqual({status:503,body:'Unavailable'});await guard.finish();const pair=pairFor(guard);expect(validateResponseEvidence(pair.start,pair.end)).toBe(true);expect(pair.end.response?.responses[1]).toMatchObject({rule:'abort',outcome:'aborted',bytes:0,status:null});expect(pair.end.response?.responses[2]).toMatchObject({rule:'unavailable',outcome:'fulfilled',status:503,bytes:11});
  }catch(cause){failure=cause;}
  finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
  if(failure)throw failure;
},30000);
for(const engine of [chromium,firefox,webkit]){
  const title=`N2A exact local Mermaid renders and blocks in ${engine.name()}`;
  test(title,async()=>{
    const plan=await mermaidPlan(),browser=await engine.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown;
    const responses:Response[]=[],requests:{module:string;resource:string}[]=[];
    try{
      guard=await createGuardedContext(browser,plan.rules,{...makeOwner('unit',ADOPTION_UNIT_FILE,[title],`vitest-${engine.name()}`),title,engine:engine.name(),responsePlan:plan.responsePlan});const page=await guard.context.newPage();
      page.on('response',r=>{if(r.url().startsWith(MERMAID_ORIGIN+MERMAID_PREFIX))responses.push(r);});page.on('request',r=>{if(r.url().startsWith(MERMAID_ORIGIN+MERMAID_PREFIX))requests.push({module:r.url().slice((MERMAID_ORIGIN+MERMAID_PREFIX).length,200),resource:r.resourceType()});});
      await page.goto(FIXTURE_ORIGIN+'/technical');await expect.poll(()=>page.locator('.fcd-diagram').getAttribute('data-state'),{timeout:20000}).toBe('rendered');expect(await page.locator('.diagram-output svg').count()).toBe(1);const source=await page.locator('.diagram-source pre').textContent();
      await page.locator('#theme-toggle').click();const theme=await page.locator('html').getAttribute('data-theme');await expect.poll(()=>page.locator('.fcd-diagram').getAttribute('data-rendered-theme'),{timeout:20000}).toBe(theme);expect(await page.locator('.diagram-source pre').textContent()).toBe(source);
      expect(responses.length).toBeGreaterThan(0);for(const response of responses){const modulePath=response.url().slice((MERMAID_ORIGIN+MERMAID_PREFIX).length),expected=plan.responsePlan.assets.find(a=>a.modulePath===modulePath);expect(expected).toBeDefined();expect(response.status()).toBe(200);expect(response.request().resourceType()).toBe('script');expect(response.headers()['access-control-allow-origin']).toBe(FIXTURE_ORIGIN);expect(response.headers()['content-type']).toContain('application/javascript');const body=await response.body();expect(body.length).toBe(expected!.bytes);expect(sha256(body)).toBe(expected!.sha256);}
      guard.transition('blocked');await page.reload();await expect.poll(()=>page.locator('.fcd-diagram').getAttribute('data-state'),{timeout:15000}).toBe('error');expect(await page.locator('.diagram-source pre').isVisible()).toBe(true);expect(await page.locator('.diagram-source pre').textContent()).toBe(source);
      await guard.finish();const pair=pairFor(guard);expect(validateResponseEvidence(pair.start,pair.end)).toBe(true);expect(pair.end.rules.find(r=>r.id==='blocked-entry')?.hits).toBe(1);expect(pair.end.response?.responses.filter(r=>r.rule==='blocked-entry')).toMatchObject([{outcome:'aborted',bytes:0}]);expect(pair.end.response!.fulfilledBytes).toBeLessThanOrEqual(limits.fulfilled);
    }catch(cause){failure=new Error(`N2A_MERMAID_RUNTIME ${engine.name()} ${JSON.stringify(requests)}: ${cause instanceof Error?cause.message:'non-error failure'}`,{cause});}
    finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
    if(failure)throw failure;
  },30000);
}

// AC-06/07: real compatibility requirements, before the lifecycle correction.
// Full normal axe and a broadly throwing storage mock must coexist with guards.
const axeTags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
for(const engine of [chromium,firefox,webkit]){
  const title=`N2A normal axe retains complete frames and a live primary in ${engine.name()}`;
  test(title,async()=>{
    const browser=await engine.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown,scans=0;
    const rules:FixtureRule[]=[
      {id:'home',path:'/',method:'GET',resource:'document',count:1,body:'<!doctype html><html lang="en"><head><title>Axe lifecycle control</title></head><body><main><h1>Primary remains active</h1><iframe title="Name violation control" src="/frame"></iframe></main></body></html>'},
      {id:'frame',path:'/frame',method:'GET',resource:'document',count:1,body:'<!doctype html><html lang="en"><head><title>Frame control</title></head><body><main><h1>Frame</h1><button></button></main></body></html>'},
      {id:'socket',path:'/socket',method:'GET',resource:'websocket',kind:'websocket',body:'primary-still-active',count:1},
    ];
    try{
      guard=await createGuardedContext(browser,rules,{...makeOwner('unit',ADOPTION_UNIT_FILE,[title],`vitest-${engine.name()}`),title,engine:engine.name()});
      const page=await guard.context.newPage();await page.goto(FIXTURE_ORIGIN+'/');
      const first=await new AxeBuilder({page}).withTags(axeTags).analyze();scans++;
      expect(first.testEngine.name).toBe('axe-core');expect(first.passes.length).toBeGreaterThan(0);expect(Array.isArray(first.incomplete)).toBe(true);expect(Array.isArray(first.inapplicable)).toBe(true);
      expect(first.violations.some(v=>v.id==='button-name'&&v.nodes.some(n=>n.target.length>1)),'normal axe must retain the child-frame violation').toBe(true);
      await page.frameLocator('iframe').getByRole('button').evaluate(button=>{button.textContent='Named frame action';});
      const second=await new AxeBuilder({page}).withTags(axeTags).analyze();scans++;expect(second.violations).toEqual([]);expect(second.passes.length).toBeGreaterThan(0);
      expect(guard.context.pages()).toEqual([page]);expect(page.isClosed()).toBe(false);
      expect(await page.evaluate(()=>new Promise<string>((resolve,reject)=>{
        const socket=new WebSocket('wss://fcd-fixture.invalid/socket'),timer=setTimeout(()=>reject(new Error('primary socket timed out')),3000);
        socket.onopen=()=>socket.send('local');socket.onmessage=e=>{clearTimeout(timer);socket.close();resolve(String(e.data));};socket.onerror=()=>{clearTimeout(timer);reject(new Error('primary socket failed'));};
      }))).toBe('primary-still-active');
      await guard.finish();expect(pairFor(guard).end.errors).toEqual([]);
    }catch(cause){failure=new Error(`N2A_AXE_LIFECYCLE ${engine.name()} scans=${scans}: ${cause instanceof Error?cause.message:'non-error failure'}`,{cause});}
    finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
    if(failure)throw failure;
  },30000);
}
function throwingStorageMock():void {
  // No key exemptions, restored methods or assumed init-script ordering.
  Storage.prototype.getItem=function(){console.debug('N2A_STORAGE_READ');throw new Error('storage unavailable');};
  Storage.prototype.setItem=function(){console.debug('N2A_STORAGE_WRITE');throw new Error('storage unavailable');};
  console.debug('N2A_STORAGE_INSTALLED');
}
for(const engine of [chromium,firefox,webkit])for(const registration of ['before','after'] as const){
  const title=`N2A current document needs no storage receipts in ${engine.name()} ${registration}`;
  test(title,async()=>{
    const browser=await engine.launch({headless:true});let guard:GuardedContext|undefined,failure:unknown,reads=0,writes=0,installed=0;
    const factory={newContext:async(options:BrowserContextOptions)=>{
      const context=await browser.newContext(options);context.on('console',message=>{if(message.text()==='N2A_STORAGE_READ')reads++;if(message.text()==='N2A_STORAGE_WRITE')writes++;if(message.text()==='N2A_STORAGE_INSTALLED')installed++;});
      if(registration==='before')await context.addInitScript(throwingStorageMock);return context;
    }} as unknown as Browser;
    try{
      guard=await createGuardedContext(factory,[{...smallRule,count:1}],{...makeOwner('unit',ADOPTION_UNIT_FILE,[title],`vitest-${engine.name()}`),title,engine:engine.name()});
      if(registration==='after')await guard.context.addInitScript(throwingStorageMock);
      const page=await guard.context.newPage();await page.goto(FIXTURE_ORIGIN+'/');expect(await page.getByRole('heading').textContent()).toBe('inline control');
      expect(await page.evaluate(()=>{
        const errors:string[]=[];try{localStorage.getItem('ordinary-application-key');}catch(e){errors.push((e as Error).message);}try{localStorage.setItem('ordinary-application-key','value');}catch(e){errors.push((e as Error).message);}
        return {errors,observers:Object.getOwnPropertyNames(globalThis).filter(k=>k.startsWith('__fcdN1State')).length};
      })).toEqual({errors:['storage unavailable','storage unavailable'],observers:1});
      expect(installed).toBeGreaterThan(0);expect(reads).toBe(1);expect(writes).toBe(1);
      await guard.finish();expect(reads,'current/reconciled documents require no storage reads').toBe(1);expect(pairFor(guard).end.documents.every(d=>d.intact&&d.flushed&&d.attempts===d.acknowledged)).toBe(true);
    }catch(cause){failure=new Error(`N2A_STORAGE_LIFECYCLE ${engine.name()} ${registration} reads=${reads} writes=${writes} installed=${installed}: ${cause instanceof Error?cause.message:'non-error failure'}`,{cause});}
    finally{if(guard&&!guard.finished)try{await guard.finish(failure?'failed':'passed');}catch(cause){failure??=cause;}await browser.close();}
    if(failure)throw failure;
  },30000);
}
