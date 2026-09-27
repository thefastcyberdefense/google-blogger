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
// A separate public-API control distinguishes absent pagehide from lost console
// or binding delivery. Only fixed synthetic markers/counters enter diagnostics.
for(const engine of [chromium,firefox,webkit]) {
  test(`N1 public observer retires same-origin documents in ${engine.name()}`,async()=>{
    const browser=await engine.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
    const reasons:string[]=[],receipts:string[]=[],pageErrors:string[]=[];
    const control={contextConsole:0,pageConsole:0,binding:0};
    context.on('console',message=>{
      if(message.text().startsWith('FCD_N1_RETIRE_')&&receipts.length<8)receipts.push(message.type());
      if(message.text()==='FCD_N1_PAGEHIDE_CONTROL')control.contextConsole++;
    });
    context.on('page',page=>{
      page.on('console',message=>{if(message.text()==='FCD_N1_PAGEHIDE_CONTROL')control.pageConsole++;});
      page.on('pageerror',error=>{if(pageErrors.length<4)pageErrors.push(error.message.slice(0,200));});
    });
    try {
      await context.exposeBinding('__fcdN1RetirementControl',(_source,value:unknown)=>{if(value==='pagehide')control.binding++;});
      await context.route('**/*',route=>route.fulfill({status:new URL(route.request().url()).pathname==='/'?200:451,contentType:'text/html',body:'<!doctype html><h1>retirement control</h1>'}));
      await context.routeWebSocket('**/*',socket=>socket.close({code:1008,reason:'local control'}));
      const observer=await observeDocumentWebSockets(context,()=>{},reason=>{if(reasons.length<16)reasons.push(reason);});
      const page=await context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
      expect(await page.locator('h1').textContent()).toBe('retirement control');
      await page.evaluate(()=>{
        sessionStorage.setItem('fcd-n1-pagehide','armed');
        addEventListener('pagehide',()=>{
          sessionStorage.setItem('fcd-n1-pagehide','fired');
          console.debug('FCD_N1_PAGEHIDE_CONTROL');
          const emit=(globalThis as unknown as Record<string,unknown>).__fcdN1RetirementControl as (value:string)=>Promise<unknown>;
          void emit('pagehide');
        });
      });
      expect((await page.goto(`${FIXTURE_ORIGIN}/unexpected`))?.status()).toBe(451);
      const storage=await page.evaluate(()=>{try{return sessionStorage.getItem('fcd-n1-pagehide');}catch{return 'unavailable';}});
      const documents=await observer.flush();
      const detail=JSON.stringify({engine:engine.name(),storage,control,receipts,reasons,pageErrors,documents});
      expect(documents.length>=2&&documents.every(d=>d.intact&&d.flushed&&d.attempts===d.acknowledged)&&reasons.length===0,`N1_RETIREMENT_CONTROL ${detail}`).toBe(true);
    }finally{await context.close();await browser.close();}
  },30000);
}
// Small reproductions of the first real 30-project failure, not a replacement
// for that matrix. Public callback diagnostics preserve every assertion and
// timeout. Ordinals identify only synthetic documents/pages, never raw URLs.
for(const engine of [chromium,firefox,webkit]) {
  test(`N1 reconciles frame popup and reload retirement in ${engine.name()}`,async()=>{
    const browser=await engine.launch({headless:true}),context=await browser.newContext({serviceWorkers:'block'});
    const reasons:string[]=[];let routed=0,documentRequests=0,phase='setup',omitted=0;
    const ids=new Map<string,number>(),ready=new Set<string>(),retired=new Set<string>();
    const pages=new Map<ReturnType<BrowserContext['pages']>[number],number>();
    const events:Record<string,unknown>[]=[],pageErrors:{phase:string;message:string}[]=[];
    const documentId=(id:string)=>{if(!ids.has(id))ids.set(id,ids.size+1);return ids.get(id)!;};
    const pageId=(page:ReturnType<BrowserContext['pages']>[number]|null)=>{if(!page)return 0;if(!pages.has(page))pages.set(page,pages.size+1);return pages.get(page)!;};
    const record=(event:Record<string,unknown>)=>{if(events.length<24)events.push({phase,...event});else omitted++;};
    let observer:Awaited<ReturnType<typeof observeDocumentWebSockets>>|undefined,documents:End['documents']|undefined;
    const script=`<script>const socket=new WebSocket('wss://fcd-fixture.invalid/socket');socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{document.documentElement.dataset.socket=e.data;socket.close();};</script>`;
    context.on('request',r=>{if(r.resourceType()==='document')documentRequests++;});
    context.on('page',page=>{pageId(page);page.on('pageerror',error=>{if(pageErrors.length<4)pageErrors.push({phase,message:error.message.slice(0,200)});});});
    context.on('console',message=>{
      const text=message.text();if(message.type()!=='debug'||!text.startsWith('FCD_N1_RETIRE_')||text.length>600)return;
      try {
        const value:unknown=JSON.parse(text.slice(text.indexOf(':')+1));
        if(!value||typeof value!=='object')return;
        const v=value as Record<string,unknown>;
        if(v.kind!=='retire'||typeof v.id!=='string'||!/^[0-9a-f-]{36}$/.test(v.id))return;
        retired.add(v.id);record({kind:'retire',document:documentId(v.id),page:pageId(message.page()),known:ready.has(v.id),attempts:v.attempts,failures:v.failures});
      }catch {record({kind:'diagnostic-parse-failed'});}
    });
    // Observe the real public binding callback without delaying, suppressing,
    // replacing or fabricating its ready/socket payloads or return values.
    const observedContext=publicAdapter<BrowserContext>(context,{exposeBinding:async(name,callback)=>context.exposeBinding(name,(source,...args)=>{
      const value:unknown=args[0];
      if(value&&typeof value==='object'){
        const v=value as Record<string,unknown>;
        if(v.kind==='ready'&&typeof v.id==='string'&&/^[0-9a-f-]{36}$/.test(v.id)){
          ready.add(v.id);record({kind:'ready',document:documentId(v.id),page:pageId(source.page),initial:v.initial,fixtureOrigin:v.origin===FIXTURE_ORIGIN});
        }
      }
      return callback(source,...args);
    })});
    try {
      await context.route('**/*',route=>{
        const home=new URL(route.request().url()).pathname==='/';
        return route.fulfill({contentType:'text/html',body:`<!doctype html><h1>navigation control</h1>${home?'<iframe title="local frame" src="/frame"></iframe><a href="/popup" target="_blank">Open popup</a>':''}${script}`});
      });
      await context.routeWebSocket('**/*',socket=>{routed++;socket.onMessage(()=>socket.send('local-pong'));});
      observer=await observeDocumentWebSockets(observedContext,()=>{},reason=>{if(!reasons.includes(reason))reasons.push(reason);});
      const page=await context.newPage();phase='home-navigation';await page.goto(`${FIXTURE_ORIGIN}/`);
      phase='home-socket';await expect.poll(()=>page.locator('html').getAttribute('data-socket')).toBe('local-pong');
      phase='frame-socket';await expect.poll(()=>page.frameLocator('iframe').locator('html').getAttribute('data-socket')).toBe('local-pong');
      phase='popup-navigation';const [popup]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:'Open popup'}).click()]);
      phase='popup-socket';await expect.poll(()=>popup.locator('html').getAttribute('data-socket')).toBe('local-pong');
      phase='reload-navigation';await page.reload();
      phase='reload-home-socket';await expect.poll(()=>page.locator('html').getAttribute('data-socket')).toBe('local-pong');
      phase='reload-frame-socket';await expect.poll(()=>page.frameLocator('iframe').locator('html').getAttribute('data-socket')).toBe('local-pong');
      phase='reconcile';documents=await observer.flush();
      expect(routed===5&&observer.count()===5&&documentRequests===5&&reasons.length===0&&documents.every(d=>d.flushed&&d.intact&&d.attempts===d.acknowledged),'N1_NAVIGATION_CONTROL').toBe(true);
    }catch(cause){
      // A failed poll must still publish the actual phase and observer state.
      // Flushing happens only after failure or the original final assertion.
      if(observer&&!documents)try{documents=await observer.flush();}catch{reasons.push('diagnostic-flush-failed');}
      const detail={engine:engine.name(),phase,routed,observed:observer?.count(),documentRequests,reasons,pageErrors,events,omitted,unregisteredRetirements:[...retired].filter(id=>!ready.has(id)).map(documentId),documents:documents?.map(d=>({document:documentId(d.id),attempts:d.attempts,acknowledged:d.acknowledged,intact:d.intact,flushed:d.flushed}))};
      throw new Error(`N1_NAVIGATION_PHASE ${JSON.stringify(detail)}; assertion=${cause instanceof Error?cause.message.slice(0,300):'non-error failure'}`,{cause});
    }finally{await context.close();await browser.close();}
  },30000);
}
test('N1 retires inherited-origin blank frames without losing evidence',async()=>{
  const browser=await chromium.launch({headless:true}),context=await browser.newContext({serviceWorkers:'block'});const reasons:string[]=[];
  try {
    await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><h1>inherited frame control</h1>'}));
    const observer=await observeDocumentWebSockets(context,()=>{},reason=>{if(!reasons.includes(reason))reasons.push(reason);});
    const page=await context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
    await page.evaluate(()=>document.body.append(document.createElement('iframe')));
    const frame=page.frames().find(f=>f!==page.mainFrame());if(!frame)throw new Error('missing controlled frame');
    const origins=await frame.evaluate(()=>({location:location.origin,security:globalThis.origin}));
    await frame.goto(`${FIXTURE_ORIGIN}/frame`);expect(await frame.locator('h1').textContent()).toBe('inherited frame control');
    const documents=await observer.flush();
    expect(reasons.length===0&&documents.every(d=>d.flushed&&d.intact),`N1_INHERITED_ORIGIN ${JSON.stringify({origins,reasons,documents})}`).toBe(true);
  }finally{await context.close();await browser.close();}
},30000);
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
for(const mutation of ['none','missing','malformed','accounting','cross-origin'] as const) {
  test(`N1 durable receipt control with ${mutation} evidence`,async()=>{
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({serviceWorkers:'block'});const reasons:string[]=[];
    try {
      await context.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><h1>receipt control</h1>'}));
      // Deliberately suppress only the observer's public console subscription.
      // Bindings, init scripts, navigation and browser storage remain real.
      const quiet=publicAdapter<BrowserContext>(context,{on:((event:string)=>{expect(event).toBe('console');return context;}) as BrowserContext['on']});
      const observer=await observeDocumentWebSockets(quiet,()=>{},reason=>{if(!reasons.includes(reason))reasons.push(reason);});
      const page=await context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);expect(await page.locator('h1').textContent()).toBe('receipt control');
      await page.goto(mutation==='cross-origin'?'https://other-fixture.invalid/next':`${FIXTURE_ORIGIN}/next`);
      const receipts=await page.evaluate(change=>{
        const keys=Object.keys(localStorage).filter(k=>k.startsWith('FCD_N1_RETIRE_'));
        for(const key of keys){
          if(change==='missing')localStorage.removeItem(key);
          if(change==='malformed')localStorage.setItem(key,'{');
          if(change==='accounting'){const value=JSON.parse(localStorage.getItem(key)!);value.attempts=1;localStorage.setItem(key,JSON.stringify(value));}
        }
        return keys.length;
      },mutation);
      if(mutation!=='cross-origin')expect(receipts).toBeGreaterThan(0);
      const documents=await observer.flush();
      if(mutation==='none'){expect(reasons).toEqual([]);expect(documents.every(d=>d.flushed&&d.intact)).toBe(true);}
      else {
        expect(reasons).toContain(mutation==='malformed'?'retire-shape':mutation==='accounting'?'retire-accounting':'unfinished-document');
        expect(documents.some(d=>!d.flushed)).toBe(true);
      }
    }finally{await context.close();await browser.close();}
  },30000);
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
function socketEvidence(){
  const s=sampleEvidence(),end=firstEnd(s);
  end.rules=[{id:'socket',action:'fulfill',count:1,hits:1}];
  end.requests=[{seq:1,kind:'websocket',rule:'socket',action:'fulfill',observed:true,handled:true}];
  end.documents=[{id:randomUUID(),attempts:1,acknowledged:1,intact:true,flushed:true}];
  return s;
}
test('N1 accepts cross-reconciled socket evidence positive control',()=>expect(validateSnapshot(socketEvidence())).toEqual([]));
for(const mutation of ['missing-document','exaggerated-acknowledgments','orphan-observed-socket','erased-observation'] as const) {
  test(`N1 finalizer rejects socket cross-accounting ${mutation}`,()=>{
    const s=socketEvidence(),end=firstEnd(s);
    if(mutation==='missing-document')end.documents=[];
    if(mutation==='exaggerated-acknowledgments'){end.documents[0].attempts=2;end.documents[0].acknowledged=2;}
    if(mutation==='orphan-observed-socket'){end.requests.push({...end.requests[0],seq:2});end.rules[0].count=2;end.rules[0].hits=2;}
    if(mutation==='erased-observation'){end.requests[0].observed=false;s.records[0].expectedErrors=['N1_OBSERVER'];end.expectedErrors=['N1_OBSERVER'];end.errors=['N1_OBSERVER'];}
    expect(validateSnapshot(s),'N1_SOCKET_ACCOUNTING_FALSE_GREEN').toContain('N1_ACCOUNTING');
  });
}
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
test('N1 CLI rejects duplicate JSON keys in its own evidence',()=>{
  const f=cliFixture();try{
    const file=path.join(f.root,'manifest.json'),before=fs.readFileSync(file,'utf8'),duplicate=before.replace('"schema":1','"schema":999,"schema":1');
    expect(duplicate).not.toBe(before);fs.writeFileSync(file,duplicate);
    const result=f.run();expect(result.error).toBeUndefined();expect(result.status,'N1_DUPLICATE_KEYS_FALSE_GREEN').toBe(1);expect(result.stderr).toContain('N1_READ');
    expect(fs.existsSync(path.join(f.output,`${f.s.records[0].id}.end.json`))).toBe(true);
  }finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
test('N1 CLI rejects malformed UTF-8 rather than replacement decoding',()=>{
  const f=cliFixture();try{
    const file=path.join(f.base,'browser.json'),before=fs.readFileSync(file,'utf8');
    fs.writeFileSync(file,Buffer.concat([Buffer.from(before.slice(0,-1)+',"diagnostic":"'),Buffer.from([255]),Buffer.from('"}') ]));
    const result=f.run();expect(result.error).toBeUndefined();expect(result.status,'N1_UTF8_FALSE_GREEN').toBe(1);expect(result.stderr).toContain('N1_READ');
    expect(fs.existsSync(path.join(f.output,`${f.s.records[0].id}.end.json`))).toBe(true);
  }finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
test('N1 evidence cannot overwrite an existing identity and survives output cleanup',()=>{
  const f=cliFixture();try{const file=path.join(f.root,`${f.s.records[0].id}.start.json`),before=fs.readFileSync(file,'utf8');expect(()=>writeEvidence(f.root,`${f.s.records[0].id}.start.json`,{})).toThrow();expect(fs.readFileSync(file,'utf8')).toBe(before);expect(()=>initializeEvidence(f.root,f.s.manifest.source,'17','1')).toThrow();const renderOutput=path.join(f.base,'test-results');fs.mkdirSync(renderOutput);fs.writeFileSync(path.join(renderOutput,'old.json'),'{}');fs.rmSync(renderOutput,{recursive:true});expect(fs.readFileSync(file,'utf8')).toBe(before);expect(()=>writeEvidence(f.root,'../escape.json',{})).toThrow('N1_WRITE');}finally{fs.rmSync(f.base,{recursive:true,force:true});}
});
