import { expect, test } from 'vitest';
import { chromium, firefox, webkit, type Browser, type BrowserContextOptions, type BrowserContext, type Route } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import { randomUUID } from 'node:crypto';
import { createGuardedContext, FIXTURE_ORIGIN, observeDocumentWebSockets, validateFixtureRules, validateContextOptions, matchFixtureRule, type FixtureRule, type GuardOptions } from '../helpers/browser-network.ts';
import { validateSnapshot, initializeEvidence, loadManifest, writeEvidence, stageRoot, SCHEMA, POLICY, PROJECTS, CASES, UNIT_CONSUMER, testKey, engineFor, type Manifest, type Start, type End, type TestEntry, type ResultEntry } from '../../tools/finalize-browser-network.ts';

const localRule:FixtureRule={id:'home',path:'/',method:'GET',resource:'document',body:'<h1>protected positive control</h1>'};
const options=(title:string,expectedErrors:string[]=[]):GuardOptions=>({title,project:'vitest-chromium',engine:'chromium',expectedErrors});
const original='N1 attributes an unexpected request even when the caller handles navigation';
test(original,async()=>{
  const browser=await chromium.launch({headless:true});
  const guard=await createGuardedContext(browser,[localRule],options(original,['N1_UNEXPECTED_REQUEST']));
  try {
    const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
    expect(await page.locator('h1').textContent()).toBe('protected positive control');
    const denied=await page.goto(`${FIXTURE_ORIGIN}/unexpected`).catch(()=>undefined);
    expect(denied?.status()).toBe(451);
    await expect(guard.finish()).rejects.toThrow('N1_UNEXPECTED_REQUEST');
    await expect(guard.finish()).rejects.toMatchObject({codes:['N1_UNEXPECTED_REQUEST']});
  }finally{await guard.context.close();await browser.close();}
},30000);
test(UNIT_CONSUMER,async()=>{
  const browser=await chromium.launch({headless:true});const guard=await createGuardedContext(browser,[{...localRule,count:1}],options(UNIT_CONSUMER));
  try {
    const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);expect(await page.locator('h1').textContent()).toBe('protected positive control');
    await guard.finish();expect(fs.existsSync(path.join(stageRoot(),`${guard.id}.start.json`))).toBe(true);expect(fs.existsSync(path.join(stageRoot(),`${guard.id}.end.json`))).toBe(true);
  }finally{await guard.context.close();await browser.close();}
},30000);
for(const engine of [chromium,firefox,webkit]) {
  test(`N1 public observer detects page WebSocket override in ${engine.name()}`,async()=>{
    const browser=await engine.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
    let contextRoutes=0,pageRoutes=0,nativeObserved=0,observedHttp=0;
    context.on('request',()=>{observedHttp++;});context.on('page',page=>page.on('websocket',()=>{nativeObserved++;}));
    try {
      await context.route('**/*',route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>local websocket control</h1>'}));
      await context.routeWebSocket('**/*',socket=>{contextRoutes++;socket.onMessage(()=>socket.send('context-local'));});
      const observer=await observeDocumentWebSockets(context);const page=await context.newPage();
      await page.routeWebSocket('**/*',socket=>{pageRoutes++;socket.onMessage(()=>socket.send('page-local'));});await page.goto(`${FIXTURE_ORIGIN}/`);
      expect(await page.locator('h1').textContent()).toBe('local websocket control');
      const reply=await page.evaluate(()=>new Promise<string>((resolve,reject)=>{
        const socket=new WebSocket('wss://fcd-fixture.invalid/socket');const deadline=setTimeout(()=>{socket.close();reject(new Error('local WebSocket control timed out'));},3000);
        socket.onopen=()=>socket.send('local');socket.onmessage=event=>{clearTimeout(deadline);socket.close();resolve(String(event.data));};socket.onerror=()=>{clearTimeout(deadline);reject(new Error('local WebSocket control failed'));};
      }));
      expect(reply).toBe('page-local');expect(pageRoutes).toBe(1);expect(contextRoutes).toBe(0);expect(observedHttp).toBe(1);expect(nativeObserved).toBe(0);
      await expect.poll(()=>observer.count(),{timeout:3000,message:`N1_PUBLIC_OBSERVER_GAP ${engine.name()}`}).toBe(1);expect(await page.evaluate(()=>WebSocket.OPEN)).toBe(1);
      const documents=await observer.flush();expect(documents.some(d=>d.attempts===1&&d.acknowledged===1&&d.intact&&d.flushed)).toBe(true);
    }finally{await context.close();await browser.close();}
  },30000);
}
test('N1 accepts a precise local positive policy',()=>expect(()=>validateFixtureRules([localRule])).not.toThrow());
for(const [name,rule] of [
  ['wildcard path',{...localRule,path:'/**'}],['redirect status',{...localRule,status:302}],['redirect header',{...localRule,headers:{location:'https://elsewhere.invalid/'}}],
  ['denial without exact count',{...localRule,action:'deny' as const}],['unbounded count',{...localRule,action:'deny' as const,count:1000000}],['invalid method',{...localRule,method:'*'}],
] as const)test(`N1 rejects ${name}`,()=>expect(()=>validateFixtureRules([rule])).toThrow('N1_POLICY'));
test('N1 rejects duplicate policy identities',()=>expect(()=>validateFixtureRules([localRule,localRule])).toThrow('N1_POLICY'));
test('N1 rejects service-worker override',()=>expect(()=>validateContextOptions({serviceWorkers:'allow'})).toThrow('N1_OPTIONS'));
test('N1 rejects caller proxy',()=>expect(()=>validateContextOptions({proxy:{server:'http://127.0.0.1:1'}})).toThrow('N1_OPTIONS'));
test('N1 matches exact parsed origin path method query and resource',()=>{
  const rules=[{...localRule,query:'q=synthetic'}];expect(matchFixtureRule(rules,`${FIXTURE_ORIGIN}/?q=synthetic`,'GET','document')?.id).toBe('home');
  for(const [url,method,resource] of [
    [`${FIXTURE_ORIGIN}/?q=other`,'GET','document'],[`${FIXTURE_ORIGIN}/?q=synthetic&extra=1`,'GET','document'],[`${FIXTURE_ORIGIN}/?q=synthetic`,'POST','document'],[`${FIXTURE_ORIGIN}/?q=synthetic`,'GET','image'],
    ['https://fcd-fixture.invalid.evil.invalid/?q=synthetic','GET','document'],['https://user:synthetic@fcd-fixture.invalid/?q=synthetic','GET','document'],[`${FIXTURE_ORIGIN}/else?q=synthetic`,'GET','document'],
  ])expect(matchFixtureRule(rules,url,method,resource)).toBeUndefined();
});
test('N1 setup failure still writes a paired lifecycle',async()=>{
  const title='N1 setup failure still writes a paired lifecycle';const unavailable={newContext:async()=>{throw new Error('controlled setup failure');}} as unknown as Browser;
  await expect(createGuardedContext(unavailable,[],options(title,['N1_SETUP']))).rejects.toMatchObject({codes:['N1_SETUP']});
});
test('N1 caller assertion outcome remains a failure after cleanup',async()=>{
  const title='N1 caller assertion outcome remains a failure after cleanup';const browser=await chromium.launch({headless:true});
  try{const guard=await createGuardedContext(browser,[],options(title,['N1_TEST_FAILED']));await expect(guard.finish('failed')).rejects.toMatchObject({codes:['N1_TEST_FAILED']});}finally{await browser.close();}
});

// Fault injection adapts only public dependency methods in these tests. No
// Playwright private state, executable strings, or production escape hatch.
function publicAdapter<T extends object>(target:T,overrides:Partial<T>):T {
  return new Proxy(target,{get(object,key){const owner=Object.hasOwn(overrides,key)?overrides:object;const value:unknown=Reflect.get(owner,key,owner);return typeof value==='function'?value.bind(owner):value;}});
}
test('N1 handler failure is attributed despite a caught resource error',async()=>{
  const title='N1 handler failure is attributed despite a caught resource error';const browser=await chromium.launch({headless:true});
  const factory={newContext:async(opts:BrowserContextOptions)=>{
    const real=await browser.newContext(opts);
    return publicAdapter<BrowserContext>(real,{route:async(url,handler,routeOptions)=>real.route(url,async(route,request)=>{
      const adapted=publicAdapter<Route>(route,{fulfill:async response=>{if(request.resourceType()==='fetch'){await route.abort('blockedbyclient');throw new Error('controlled handler failure');}await route.fulfill(response);}});
      await handler(adapted,request);
    },routeOptions)});
  }} as unknown as Browser;
  try {
    const guard=await createGuardedContext(factory,[localRule,{id:'data',path:'/data',method:'GET',resource:'fetch',body:'local',count:1}],options(title,['N1_HANDLER']));
    const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);expect(await page.locator('h1').textContent()).toBe('protected positive control');
    expect(await page.evaluate(()=>fetch('/data').then(()=>false,()=>true))).toBe(true);
    await expect(guard.finish()).rejects.toMatchObject({codes:['N1_HANDLER']});expect(browser.contexts()).toHaveLength(0);
  }finally{await browser.close();}
});
test('N1 close failure is retained after fallback cleanup succeeds',async()=>{
  const title='N1 close failure is retained after fallback cleanup succeeds';const browser=await chromium.launch({headless:true});let calls=0;
  const factory={newContext:async(opts:BrowserContextOptions)=>{const real=await browser.newContext(opts);return publicAdapter<BrowserContext>(real,{close:async closeOptions=>{calls++;if(calls===1)throw new Error('controlled close failure');await real.close(closeOptions);}});}} as unknown as Browser;
  try{const guard=await createGuardedContext(factory,[],options(title,['N1_CLOSE']));await expect(guard.finish()).rejects.toMatchObject({codes:['N1_CLOSE']});expect(calls).toBe(2);expect(browser.contexts()).toHaveLength(0);}finally{await browser.close();}
});
test('N1 invalid options are rejected before browser context creation',async()=>{
  const title='N1 invalid options are rejected before browser context creation';let calls=0;
  const factory={newContext:async()=>{calls++;throw new Error('must not run');}} as unknown as Browser;
  await expect(createGuardedContext(factory,[],{...options(title,['N1_OPTIONS']),contextOptions:{serviceWorkers:'allow'}})).rejects.toMatchObject({codes:['N1_OPTIONS']});expect(calls).toBe(0);
});
test('N1 evidence write failure throws after closing the real context',async()=>{
  // Deliberately corrupt a separate synthetic evidence fixture, never the run's
  // acceptance root. The unchanged N0 namespace still encloses this browser.
  const manifest=loadManifest();const previous=process.env.FCD_ISOLATION_EVIDENCE;
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'fcd-n1-write-control-'));const browser=await chromium.launch({headless:true});
  try {
    process.env.FCD_ISOLATION_EVIDENCE=path.join(base,'isolation');initializeEvidence(stageRoot(),manifest.source,manifest.run,manifest.attempt);
    const guard=await createGuardedContext(browser,[],options('N1 evidence write failure throws after closing the real context',['N1_WRITE']));
    fs.writeFileSync(path.join(stageRoot(),`${guard.id}.end.json`),'{}');
    await expect(guard.finish()).rejects.toMatchObject({codes:['N1_WRITE']});expect(browser.contexts()).toHaveLength(0);
  }finally{process.env.FCD_ISOLATION_EVIDENCE=previous;await browser.close();fs.rmSync(base,{recursive:true,force:true});}
});

function sampleEvidence() {
  const manifest:Manifest={schema:SCHEMA,policy:POLICY,kind:'manifest',source:'a'.repeat(40),run:'17',attempt:'1'};
  const records:(Start|End)[]=[];const entries:TestEntry[]=[];const results:ResultEntry[]=[];
  const specs:{file:string;title:string;tests:{projectName:string;expectedStatus:string;status:string;results:{status:string;retry:number}[]}[]}[]=[];
  for(const project of PROJECTS)for(const title of CASES) {
    const id=randomUUID(),key=testKey(project,title),engine=engineFor(project);
    const start:Start={...manifest,kind:'start',id,identity:{stage:'render',project,engine,title,test:key,worker:1,retry:0,pid:10},expectedErrors:[]};
    records.push(start,{...start,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[],requests:[],documents:[]});
    entries.push({key,project,engine,title});results.push({key,project,engine,title,status:'passed',expectedStatus:'passed',retry:0,worker:1,contexts:[id]});
    specs.push({file:'tests/render/network-isolation.spec.ts',title,tests:[{projectName:project,expectedStatus:'passed',status:'expected',results:[{status:'passed',retry:0}]}]});
  }
  const unitStart:Start={...manifest,kind:'start',id:randomUUID(),identity:{stage:'unit',project:'vitest-chromium',engine:'chromium',title:UNIT_CONSUMER,test:testKey('vitest-chromium',UNIT_CONSUMER),worker:0,retry:0,pid:11},expectedErrors:[]};
  records.push(unitStart,{...unitStart,kind:'end',setup:true,closed:true,outcome:'passed',errors:[],rules:[{id:'home',action:'fulfill',count:1,hits:1}],requests:[{seq:1,kind:'http',rule:'home',action:'fulfill',observed:true,handled:true}],documents:[]});
  return {manifest,records,discovery:{...manifest,kind:'discovery',tests:entries},results:{...manifest,kind:'results',status:'passed',errors:0,tests:results},browser:{stats:{unexpected:0,skipped:0,flaky:0},errors:[],suites:[{specs}]},unit:{numFailedTests:0,numPendingTests:0,numPassedTests:212,testResults:[{name:'/fixture/tests/unit/browser-network.test.ts',assertionResults:[{fullName:UNIT_CONSUMER,status:'passed'}]}]}};
}
const firstEnd=(s:ReturnType<typeof sampleEvidence>)=>s.records.find((r):r is End=>r.kind==='end')!;
test('N1 accepts complete reconciled evidence positive control',()=>expect(validateSnapshot(sampleEvidence())).toEqual([]));
test('N1 rejects absent evidence rather than publishing acceptance',()=>expect(validateSnapshot({})).toContain('N1_MISSING_MANIFEST'));
test('N1 rejects unsupported manifest schema',()=>expect(validateSnapshot({manifest:{schema:999}})).toContain('N1_MANIFEST'));
test('N1 rejects zero scoped discovery',()=>{const s=sampleEvidence();s.discovery.tests=[];expect(validateSnapshot(s)).toContain('N1_DISCOVERY');});
const corruptions:[string,string,(s:ReturnType<typeof sampleEvidence>)=>void][]=[
  ['missing end','N1_UNFINISHED',s=>{s.records.splice(1,1);} ],['stale source','N1_STALE',s=>{firstEnd(s).source='b'.repeat(40);} ],['stale run','N1_STALE',s=>{firstEnd(s).run='18';} ],['stale attempt','N1_STALE',s=>{firstEnd(s).attempt='2';} ],
  ['record schema','N1_RECORD_SCHEMA',s=>{firstEnd(s).schema=99;} ],['duplicate context','N1_DUPLICATE',s=>{s.records.push(s.records[0]);} ],['unfinished close','N1_LIFECYCLE',s=>{firstEnd(s).closed=false;} ],
  ['unexpected failed body','N1_LIFECYCLE',s=>{firstEnd(s).outcome='failed';} ],['unexplained violation','N1_VIOLATION',s=>{firstEnd(s).errors=['N1_UNEXPECTED_REQUEST'];} ],
  ['missing expected control','N1_VIOLATION',s=>{s.records[0].expectedErrors=['N1_COUNT'];firstEnd(s).expectedErrors=['N1_COUNT'];} ],['missing reporter result','N1_RESULTS',s=>{s.results.tests.pop();} ],
  ['swallowed reporter error','N1_RESULTS',s=>{s.results.errors=1;} ],['extra reporter data','N1_DISCOVERY',s=>{Object.assign(s.discovery,{unapproved:'synthetic'});} ],
  ['missing context annotation','N1_MISSING_CONTEXT',s=>{s.results.tests[0].contexts=[randomUUID()];} ],['missing standard browser result','N1_BROWSER',s=>{s.browser.suites[0].specs.pop();} ],
  ['browser retry','N1_BROWSER',s=>{s.browser.suites[0].specs[0].tests[0].results[0].retry=1;} ],['missing unit consumer','N1_UNIT_CONSUMER',s=>{s.unit.testResults[0].assertionResults=[];} ],
  ['unaccounted observed request','N1_ACCOUNTING',s=>{firstEnd(s).requests=[{seq:1,kind:'http',rule:null,action:'unhandled',observed:true,handled:false}];} ],
];
for(const [name,code,mutate] of corruptions)test(`N1 finalizer rejects ${name}`,()=>{const s=sampleEvidence();mutate(s);expect(validateSnapshot(s)).toContain(code);});
test('N1 an exact inner failure control still requires a passing owner',()=>{
  const s=sampleEvidence();s.records[0].expectedErrors=['N1_TEST_FAILED'];const end=firstEnd(s);end.expectedErrors=['N1_TEST_FAILED'];end.errors=['N1_TEST_FAILED'];end.outcome='failed';
  expect(validateSnapshot(s)).toEqual([]);s.results.tests[0].status='failed';expect(validateSnapshot(s)).toContain('N1_RESULTS');
});
const cli=fileURLToPath(new URL('../../tools/finalize-browser-network.ts',import.meta.url));
function cliFixture() {
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'fcd-n1-data-')),root=path.join(base,'staged'),output=path.join(base,'published');
  const s=sampleEvidence();initializeEvidence(root,s.manifest.source,s.manifest.run,s.manifest.attempt);
  for(const record of s.records)writeEvidence(root,`${record.id}.${record.kind}.json`,record);
  writeEvidence(root,'discovery.json',s.discovery);writeEvidence(root,'results.json',s.results);
  const unit=path.join(base,'unit.json'),browser=path.join(base,'browser.json');fs.writeFileSync(unit,JSON.stringify(s.unit));fs.writeFileSync(browser,JSON.stringify(s.browser));
  const run=()=>spawnSync(process.execPath,[cli,'finalize',root,output,s.manifest.source,s.manifest.run,s.manifest.attempt,unit,browser],{encoding:'utf8',timeout:10000});return {base,root,output,s,run};
}
test('N1 CLI accepts complete data without launching a browser',()=>{const f=cliFixture();try{const result=f.run();expect(result.error).toBeUndefined();expect(result.status,result.stderr).toBe(0);expect(JSON.parse(fs.readFileSync(path.join(f.output,'summary.json'),'utf8')).accepted).toBe(true);}finally{fs.rmSync(f.base,{recursive:true,force:true});}});
test('N1 CLI has a real nonzero missing-evidence path',()=>{
  const f=cliFixture();try{fs.unlinkSync(path.join(f.root,'discovery.json'));const result=f.run();expect(result.error).toBeUndefined();expect(result.status,'N1_FINALIZER_FALSE_GREEN').toBe(1);expect(result.stderr).toContain('N1_DISCOVERY');expect(JSON.parse(fs.readFileSync(path.join(f.output,'summary.json'),'utf8')).accepted).toBe(false);expect(fs.existsSync(path.join(f.output,`${f.s.records[0].id}.start.json`))).toBe(true);}finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
test('N1 CLI rejects truncated records and preserves valid partial diagnostics',()=>{const f=cliFixture();try{fs.writeFileSync(path.join(f.root,`${f.s.records[0].id}.start.json`),'{');const result=f.run();expect(result.status).toBe(1);expect(result.stderr).toContain('N1_READ');expect(fs.existsSync(path.join(f.output,`${f.s.records[0].id}.end.json`))).toBe(true);}finally{fs.rmSync(f.base,{recursive:true,force:true});}});
test('N1 evidence cannot overwrite an existing identity and survives output cleanup',()=>{
  const f=cliFixture();try{const file=path.join(f.root,`${f.s.records[0].id}.start.json`),before=fs.readFileSync(file,'utf8');expect(()=>writeEvidence(f.root,`${f.s.records[0].id}.start.json`,{})).toThrow();expect(fs.readFileSync(file,'utf8')).toBe(before);expect(()=>initializeEvidence(f.root,f.s.manifest.source,'17','1')).toThrow();const renderOutput=path.join(f.base,'test-results');fs.mkdirSync(renderOutput);fs.writeFileSync(path.join(renderOutput,'old.json'),'{}');fs.rmSync(renderOutput,{recursive:true});expect(fs.readFileSync(file,'utf8')).toBe(before);expect(()=>writeEvidence(f.root,'../escape.json',{})).toThrow('N1_WRITE');}finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
