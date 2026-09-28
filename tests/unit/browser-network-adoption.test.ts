import { expect, test } from 'vitest';
import { chromium } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import fs, { constants } from 'node:fs';
import { lstat, open, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import ts from 'typescript';
import { assets, pug, root } from '../../tools/generate.ts';
import { createGuardedContext, FIXTURE_ORIGIN, validateFixtureRules, type FixtureRule, type GuardedContext, type GuardOptions } from '../helpers/browser-network.ts';
import { POLICY, SCHEMA, UNIT_CONSUMER, engineFor, testKey, loadManifest, stageRoot, validateSnapshot, initializeEvidence, writeIndexedEvidence, readIndexedEvidence, entryFor, MAX_FILE, type Manifest, type Start, type End, type TestEntry, type ResultEntry, type EvidenceIndex } from '../../tools/finalize-browser-network.ts';
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
