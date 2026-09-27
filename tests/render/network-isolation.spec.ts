import { test, expect } from '../helpers/isolated-test.ts';
import { FIXTURE_ORIGIN, matchFixtureRule, type FixtureRule, type GuardedContext } from '../helpers/browser-network.ts';
import type { Request, Response, Worker as PlaywrightWorker } from '@playwright/test';
import { CASES, stageRoot, validRecord, type End, type RequestRecord } from '../../tools/finalize-browser-network.ts';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';

const socketScript=`<script>const socket=new WebSocket('wss://fcd-fixture.invalid/socket');socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{document.documentElement.dataset.socket=e.data;socket.close();};</script>`;
const simple:FixtureRule={id:'home',path:'/',method:'GET',resource:'document',body:'<h1>fixture</h1>'};
const baseRules:FixtureRule[]=[
  {...simple,body:`<h1>fixture</h1><iframe title="local frame" src="/frame"></iframe><a href="/popup" target="_blank">Open popup</a>${socketScript}`},
  {id:'frame',path:'/frame',method:'GET',resource:'document',body:`<h1>frame fixture</h1>${socketScript}`},
  {id:'popup',path:'/popup',method:'GET',resource:'document',body:`<h1>popup fixture</h1>${socketScript}`},
  {id:'socket',kind:'websocket',path:'/socket',method:'GET',resource:'websocket',body:'local-pong'},
];
test.use({networkRules:[baseRules,{scope:'test'}]});
// Read the actual exclusive end record after finish, not a fabricated snapshot.
const endRecord=(guard:GuardedContext,codes:string[]=[]):End=>{
  const file=join(stageRoot(),`${guard.id}.end.json`),stat=lstatSync(file);
  expect(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=128*1024).toBe(true);
  const value:unknown=JSON.parse(readFileSync(file,'utf8'));
  if(!validRecord(value)||value.kind!=='end')throw new Error('N1_END_RECORD_SHAPE');
  expect(value.id).toBe(guard.id);expect(value.source).toBe(process.env.FCD_SOURCE);
  expect(value.identity.stage).toBe('render');expect(value.identity.project).toBe(test.info().project.name);
  expect(value.identity.title).toBe(test.info().title);expect(value.identity.retry).toBe(0);
  expect({setup:value.setup,closed:value.closed,outcome:value.outcome}).toEqual({setup:true,closed:true,outcome:'passed'});
  expect(value.expectedErrors).toEqual([...codes].sort());expect(value.errors).toEqual([...codes].sort());
  return value;
};
type ExpectedRequest=[RequestRecord['kind'],string|null,RequestRecord['action'],boolean?];
const expectRequests=(end:End,rows:ExpectedRequest[])=>expect(end.requests).toEqual(rows.map(([kind,rule,action,handled=true],index)=>({seq:index+1,kind,rule,action,observed:true,handled})));
const expectSockets=(end:End,total:number)=>{
  expect(end.documents.every(d=>d.intact&&d.flushed&&d.attempts===d.acknowledged)).toBe(true);
  expect(end.documents.reduce((n,d)=>n+d.attempts,0)).toBe(total);
  expect(end.documents.reduce((n,d)=>n+d.acknowledged,0)).toBe(total);
};
const expectFailure=async(guard:GuardedContext,codes:string[])=>{
  await expect(guard.finish()).rejects.toMatchObject({codes:[...codes].sort()});
  return endRecord(guard,codes);
};

test(CASES[0],async({page,context,network})=>{
  await page.goto(`${FIXTURE_ORIGIN}/`);
  await expect(page.locator('html')).toHaveAttribute('data-socket','local-pong');
  await expect(page.frameLocator('iframe').locator('html')).toHaveAttribute('data-socket','local-pong');
  await expect(page.frameLocator('iframe').getByRole('heading')).toHaveText('frame fixture');
  const [popup]=await Promise.all([context.waitForEvent('page'),page.getByRole('link',{name:'Open popup'}).click()]);
  await expect(popup.getByRole('heading')).toHaveText('popup fixture');
  await expect(popup.locator('html')).toHaveAttribute('data-socket','local-pong');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-socket','local-pong');
  await expect(page.frameLocator('iframe').locator('html')).toHaveAttribute('data-socket','local-pong');
  expect(await page.evaluate(()=>[WebSocket.CONNECTING,WebSocket.OPEN,WebSocket.CLOSING,WebSocket.CLOSED])).toEqual([0,1,2,3]);
  await network.finish();const end=endRecord(network);
  expect(end.requests).toHaveLength(10);
  expect(end.requests.every(r=>r.observed&&r.handled&&r.action==='fulfill')).toBe(true);
  expect(end.requests.filter(r=>r.kind==='http')).toHaveLength(5);
  expect(end.requests.filter(r=>r.kind==='websocket'&&r.rule==='socket')).toHaveLength(5);
  expect(end.rules.map(r=>[r.id,r.hits])).toEqual([['home',2],['frame',2],['popup',1],['socket',5]]);
  expectSockets(end,5);
});

test(CASES[1],async({makeGuard})=>{
  const guard=await makeGuard([simple],{expectedErrors:['N1_UNEXPECTED_REQUEST']});
  const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
  await expect(page.getByRole('heading')).toHaveText('fixture');
  expect(await page.evaluate(()=>fetch('/unexpected?q=synthetic').then(()=>false,()=>true))).toBe(true);
  // WebKit cancellation need not dispatch image load/error events. Require
  // the exact failed request AND an actual decode rejection, never a timeout.
  const [imageRequest,image]=await Promise.all([
    guard.context.waitForEvent('requestfailed',request=>request.url()===`${FIXTURE_ORIGIN}/unexpected-image`&&request.method()==='GET'&&request.resourceType()==='image'&&request.frame()===page.mainFrame()),
    page.evaluate(async()=>{
      const img=new Image();img.src='/unexpected-image';document.body.append(img);
      const result=await img.decode().then(()=>({decoded:true,error:''}),(cause:unknown)=>({decoded:false,error:cause instanceof DOMException?cause.name:'unexpected-rejection'}));
      return {...result,complete:img.complete,naturalWidth:img.naturalWidth};
    }),
  ]);
  expect(imageRequest.failure()?.errorText).toEqual(expect.any(String));
  expect(imageRequest.failure()?.errorText).not.toBe('');
  expect(await imageRequest.response()).toBeNull();
  expect(image).toEqual({decoded:false,error:'EncodingError',complete:true,naturalWidth:0});
  const httpEnd=await expectFailure(guard,['N1_UNEXPECTED_REQUEST']);
  expectRequests(httpEnd,[['http','home','fulfill'],['http',null,'unexpected'],['http',null,'unexpected']]);
  expect(httpEnd.rules.map(r=>[r.id,r.hits])).toEqual([['home',1]]);expectSockets(httpEnd,0);

  // A direct policy rejection, distinct from declared denial and page override.
  const sockets=await makeGuard([simple,{id:'socket',kind:'websocket',path:'/socket',method:'GET',resource:'websocket',body:'local-pong',count:1}],{expectedErrors:['N1_UNEXPECTED_REQUEST']});
  const socketPage=await sockets.context.newPage();await socketPage.goto(`${FIXTURE_ORIGIN}/`);
  await expect(socketPage.getByRole('heading')).toHaveText('fixture');
  expect(await socketPage.evaluate(()=>new Promise<string>((resolve,reject)=>{
    const socket=new WebSocket('wss://fcd-fixture.invalid/socket');const timer=setTimeout(()=>{socket.close();reject(new Error('local socket positive timeout'));},3000);
    socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{clearTimeout(timer);socket.close();resolve(String(e.data));};socket.onerror=()=>{clearTimeout(timer);reject(new Error('local socket positive failed'));};
  }))).toBe('local-pong');
  expect(await socketPage.evaluate(()=>new Promise<number>((resolve,reject)=>{
    const socket=new WebSocket('wss://fcd-fixture.invalid/unexpected-socket');const timer=setTimeout(()=>{socket.close();reject(new Error('unexpected socket close timeout'));},3000);
    socket.onclose=e=>{clearTimeout(timer);resolve(e.code);};
  }))).toBe(1008);
  const socketEnd=await expectFailure(sockets,['N1_UNEXPECTED_REQUEST']);
  expectRequests(socketEnd,[['http','home','fulfill'],['websocket','socket','fulfill'],['websocket',null,'unexpected']]);
  expect(socketEnd.rules.map(r=>[r.id,r.hits])).toEqual([['home',1],['socket',1]]);expectSockets(socketEnd,2);
});

test(CASES[2],async({makeGuard})=>{
  const deny:FixtureRule={id:'denied',path:'/denied',method:'GET',resource:'fetch',action:'deny',count:1};
  const wsDeny:FixtureRule={id:'denied-socket',kind:'websocket',path:'/denied',method:'GET',resource:'websocket',action:'deny',count:1};
  const allowed=await makeGuard([simple,deny,wsDeny]);
  const page=await allowed.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
  expect(await page.evaluate(()=>fetch('/denied').then(()=>false,()=>true))).toBe(true);
  const closeCode=await page.evaluate(()=>new Promise<number>((resolve,reject)=>{
    const ws=new WebSocket('wss://fcd-fixture.invalid/denied');const timer=setTimeout(()=>reject(new Error('local denial timeout')),3000);
    ws.onclose=e=>{clearTimeout(timer);resolve(e.code);};
  }));
  expect(closeCode).toBe(1008);await allowed.finish();const allowedEnd=endRecord(allowed);
  expectRequests(allowedEnd,[['http','home','fulfill'],['http','denied','deny'],['websocket','denied-socket','deny']]);
  expect(allowedEnd.rules).toEqual([{id:'home',action:'fulfill',count:null,hits:1},{id:'denied',action:'deny',count:1,hits:1},{id:'denied-socket',action:'deny',count:1,hits:1}]);expectSockets(allowedEnd,1);
  const missing=await makeGuard([deny],{expectedErrors:['N1_COUNT']});const missingEnd=await expectFailure(missing,['N1_COUNT']);
  expectRequests(missingEnd,[]);expect(missingEnd.rules).toEqual([{id:'denied',action:'deny',count:1,hits:0}]);
  const extra=await makeGuard([simple,deny],{expectedErrors:['N1_COUNT']});
  const extraPage=await extra.context.newPage();await extraPage.goto(`${FIXTURE_ORIGIN}/`);
  expect(await extraPage.evaluate(async()=>{let denied=0;for(let i=0;i<2;i++)await fetch('/denied').catch(()=>{denied++;});return denied;})).toBe(2);
  const extraEnd=await expectFailure(extra,['N1_COUNT']);
  expectRequests(extraEnd,[['http','home','fulfill'],['http','denied','deny'],['http','denied','deny']]);
  expect(extraEnd.rules).toEqual([{id:'home',action:'fulfill',count:null,hits:1},{id:'denied',action:'deny',count:1,hits:2}]);
});

test(CASES[3],async({makeGuard})=>{
  const http=await makeGuard([simple],{expectedErrors:['N1_BYPASS']});
  const page=await http.context.newPage();await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<h1>page override</h1>'}));
  await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('page override');
  const httpEnd=await expectFailure(http,['N1_BYPASS']);expectRequests(httpEnd,[['http',null,'unhandled',false]]);
  const ws=await makeGuard([simple],{expectedErrors:['N1_BYPASS']});const socketPage=await ws.context.newPage();
  await socketPage.routeWebSocket('**/*',socket=>socket.onMessage(()=>socket.send('override-local')));
  await socketPage.goto(`${FIXTURE_ORIGIN}/`);
  expect(await socketPage.evaluate(()=>new Promise<string>((resolve,reject)=>{
    const socket=new WebSocket('wss://fcd-fixture.invalid/overridden');const timer=setTimeout(()=>reject(new Error('local override timeout')),3000);
    socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{clearTimeout(timer);socket.close();resolve(String(e.data));};
  }))).toBe('override-local');
  const socketEnd=await expectFailure(ws,['N1_BYPASS']);
  expectRequests(socketEnd,[['http','home','fulfill'],['websocket',null,'unhandled',false]]);expectSockets(socketEnd,1);
});

test(CASES[4],async({makeGuard},info)=>{
  const redirect=await makeGuard([simple],{expectedErrors:['N1_UNEXPECTED_REQUEST']});const page=await redirect.context.newPage();
  await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('fixture');
  expect((await page.goto(`${FIXTURE_ORIGIN}/unapproved-destination`))?.status()).toBe(451);
  const directEnd=await expectFailure(redirect,['N1_UNEXPECTED_REQUEST']);
  expectRequests(directEnd,[['http','home','fulfill'],['http',null,'unexpected']]);

  // Deliberately bypass only a finite loopback start request, inside verified N0.
  // Normal guard rules still forbid redirects/continuation. A real HTTP 302
  // proves that the independently observed destination cannot disappear from
  // attribution just because public routing does not intercept redirect hops.
  if(process.env.GITHUB_ACTIONS!=='true'||process.env.FCD_LABEL!=='render'||!process.env.FCD_PARENT_NS||readlinkSync('/proc/self/ns/net')===process.env.FCD_PARENT_NS)throw new Error('N1_REDIRECT_NAMESPACE');
  let startHits=0,destinationHits=0,otherHits=0;
  const server=createServer({requestTimeout:3000,headersTimeout:3000,keepAliveTimeout:1000},(request,response)=>{
    response.setHeader('connection','close');response.setHeader('cache-control','no-store');
    if(request.method==='GET'&&request.url==='/start'&&startHits++===0){response.writeHead(302,{location:'/destination'});response.end();return;}
    if(request.method==='GET'&&request.url==='/destination'&&destinationHits++===0){response.writeHead(200,{'content-type':'text/html'});response.end('<!doctype html><html><head><title>Local redirect control</title><link rel="icon" href="data:,"></head><body><h1>loopback redirect destination</h1></body></html>');return;}
    otherHits++;response.writeHead(404);response.end();
  });
  server.maxConnections=4;server.maxRequestsPerSocket=2;server.setTimeout(3000,socket=>socket.destroy());
  const listening=new AbortController();let listenTimer:ReturnType<typeof setTimeout>|undefined;
  try {
    const ready=once(server,'listening',{signal:AbortSignal.timeout(3000)});
    listenTimer=setTimeout(()=>listening.abort(),3000);
    server.listen({port:0,host:'127.0.0.1',signal:listening.signal});await ready;clearTimeout(listenTimer);
    const address=server.address();if(!address||typeof address==='string'||address.address!=='127.0.0.1')throw new Error('N1_REDIRECT_ADDRESS');
    const origin=`http://127.0.0.1:${address.port}`,startURL=`${origin}/start`,destinationURL=`${origin}/destination`;
    const hop=await makeGuard([simple],{expectedErrors:['N1_BYPASS']});
    const positivePage=await hop.context.newPage();await positivePage.goto(`${FIXTURE_ORIGIN}/`);await expect(positivePage.getByRole('heading')).toHaveText('fixture');
    const hopPage=await hop.context.newPage();let routed=0;
    await hopPage.route(url=>url.href===startURL,async route=>{routed++;await route.continue();},{times:1});
    const response=await hopPage.goto(startURL,{timeout:3000});
    expect(response?.status()).toBe(200);expect(response?.url()).toBe(destinationURL);
    await expect(hopPage.getByRole('heading')).toHaveText('loopback redirect destination');
    const destination=response?.request(),initial=destination?.redirectedFrom();
    if(!destination||!initial)throw new Error('N1_REDIRECT_CHAIN');
    expect(initial.url()).toBe(startURL);expect(initial.redirectedFrom()).toBeNull();expect(initial.redirectedTo()).toBe(destination);expect(destination.redirectedTo()).toBeNull();
    expect(initial.method()).toBe('GET');expect(destination.method()).toBe('GET');expect(initial.resourceType()).toBe('document');expect(destination.resourceType()).toBe('document');
    expect((await initial.response())?.status()).toBe(302);
    expect({routed,startHits,destinationHits,otherHits}).toEqual({routed:1,startHits:1,destinationHits:1,otherHits:0});
    const hopEnd=await expectFailure(hop,['N1_BYPASS']);
    expectRequests(hopEnd,[['http','home','fulfill'],['http',null,'unhandled',false],['http',null,'unhandled',false]]);
    expect(hopEnd.rules.map(r=>[r.id,r.hits])).toEqual([['home',1]]);expectSockets(hopEnd,0);
  }finally{
    if(listenTimer)clearTimeout(listenTimer);
    if(server.listening){
      const closed=once(server,'close',{signal:AbortSignal.timeout(3000)});
      server.close();server.closeAllConnections();await closed;
    }
    listening.abort();
  }
  expect(server.listening).toBe(false);

  // Worker programs are unsupported guard consumers. Their script requests are
  // observed/fulfilled locally, and successful worker creation fails its owner.
  // The pinned WebKit reports this exact script load as xhr; the local positive
  // must complete before the unchanged N1_WORKER rejection can be exercised.
  const workerRules:FixtureRule[]=[simple,...['script','other','xhr'].map(resource=>({id:`worker-${resource}`,path:'/worker.js',method:'GET',resource,body:'postMessage("worker-ready")',contentType:'application/javascript'}))];
  const worker=await makeGuard(workerRules,{expectedErrors:['N1_WORKER']});const workerPage=await worker.context.newPage();
  // Read-only public events; no route, binding, worker program or guard mutation.
  // Match results replay the existing pure matcher, not a substituted handler.
  // Observe the exact synthetic script only; never log URLs, headers or bodies.
  type WorkerRequest={id:number;method:string;resource:string;matchedRule:string|null;status:number|null;finished:boolean;failed:boolean;failure:'none'|'inspector-blocked'|'client-blocked'|'cancelled'|'other'};
  const scriptURL=`${FIXTURE_ORIGIN}/worker.js`,requests=new Map<Request,WorkerRequest>();
  const events:{event:string;request?:number}[]=[];
  let omittedRequests=0,omittedEvents=0,untrackedEvents=0,workersCreated=0,matchingWorkers=0;
  let phase='home',positive=false,failure='none';
  const record=(event:string,request?:number)=>{if(events.length<12)events.push({event,request});else omittedEvents++;};
  const onRequest=(request:Request)=>{
    if(request.url()!==scriptURL)return;
    if(requests.size>=4){omittedRequests++;return;}
    const rule=matchFixtureRule(workerRules,request.url(),request.method(),request.resourceType());
    const row:WorkerRequest={id:requests.size+1,method:request.method().slice(0,8),resource:request.resourceType().slice(0,20),matchedRule:rule?.id??null,status:null,finished:false,failed:false,failure:'none'};
    requests.set(request,row);record('request',row.id);
  };
  const tracked=(request:Request)=>{if(request.url()!==scriptURL)return;const row=requests.get(request);if(!row)untrackedEvents++;return row;};
  const onResponse=(response:Response)=>{const row=tracked(response.request());if(row){row.status=response.status();record('response',row.id);}};
  const onFinished=(request:Request)=>{const row=tracked(request);if(row){row.finished=true;record('finished',row.id);}};
  const onFailed=(request:Request)=>{
    const row=tracked(request);if(!row)return;
    const text=request.failure()?.errorText??'';
    row.failed=true;row.failure=text.includes('Blocked by Web Inspector')?'inspector-blocked':text.includes('ERR_BLOCKED_BY_CLIENT')?'client-blocked':/cancel/i.test(text)?'cancelled':'other';
    record('failed',row.id);
  };
  const onWorker=(created:PlaywrightWorker)=>{workersCreated++;if(created.url()===scriptURL)matchingWorkers++;record('worker-created');};
  worker.context.on('request',onRequest);worker.context.on('response',onResponse);
  worker.context.on('requestfinished',onFinished);worker.context.on('requestfailed',onFailed);workerPage.on('worker',onWorker);
  try {
    await workerPage.goto(`${FIXTURE_ORIGIN}/`);phase='worker-exchange';
    expect(await workerPage.evaluate(()=>new Promise<string>((resolve,reject)=>{
      const w=new Worker('/worker.js');const timer=setTimeout(()=>{w.terminate();reject(new Error('local worker timeout'));},3000);
      w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(String(e.data));};w.onerror=()=>{clearTimeout(timer);w.terminate();reject(new Error('local worker failed'));};
    }))).toBe('worker-ready');
    positive=true;phase='expected-worker-rejection';
    const workerEnd=await expectFailure(worker,['N1_WORKER']);
    const rule=info.project.name.startsWith('webkit-')?'worker-xhr':'worker-script';
    expectRequests(workerEnd,[['http','home','fulfill'],['http',rule,'fulfill']]);
    expect(workerEnd.rules.map(r=>[r.id,r.hits])).toEqual([['home',1],['worker-script',rule==='worker-script'?1:0],['worker-other',0],['worker-xhr',rule==='worker-xhr'?1:0]]);
    phase='complete';
  }catch(cause){
    failure=cause instanceof Error&&cause.message.includes('local worker failed')?'local-worker-error':cause instanceof Error&&cause.message.includes('local worker timeout')?'local-worker-timeout':'other';
    throw cause;
  }finally{
    worker.context.off('request',onRequest);worker.context.off('response',onResponse);
    worker.context.off('requestfinished',onFinished);worker.context.off('requestfailed',onFailed);workerPage.off('worker',onWorker);
    // Six bounded diagnostic warnings use a separate allowance from observer notices:
    // all four WebKit projects plus one comparison per other engine. No acceptance change.
    if(['390-light','firefox-390-light','webkit-390-light','webkit-390-dark','webkit-1280-light','webkit-1280-dark'].includes(info.project.name)){
      const identity={source:(process.env.FCD_SOURCE??'missing').slice(0,40),context:worker.id,project:info.project.name.slice(0,80),worker:info.workerIndex,retry:info.retry};
      const detail=JSON.stringify({...identity,phase,positive,failure,capturedThrough:'test-finally',workersCreated,matchingWorkers,requests:[...requests.values()],events,omittedRequests,omittedEvents,untrackedEvents});
      const payload=Buffer.byteLength(detail)<=4096?detail:JSON.stringify({...identity,diagnostic:'payload-bound-exceeded'});
      console.log('::warning title=N1 worker runtime::'+payload.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A'));
    }
  }
});

test(CASES[5],async({makeGuard,viewport,colorScheme})=>{
  const guard=await makeGuard([{...simple,body:'<h1>no-JS fixture</h1><script>document.querySelector("h1").textContent="changed";</script>'}],{contextOptions:{javaScriptEnabled:false}});
  const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('no-JS fixture');
  expect(page.viewportSize()).toEqual(viewport);
  expect(await page.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches)).toBe(colorScheme==='dark');
  await guard.finish();const end=endRecord(guard);expectRequests(end,[['http','home','fulfill']]);expect(end.documents).toEqual([]);
});

test(CASES[6],async({makeGuard})=>{
  const guards=await Promise.all([makeGuard([]),makeGuard([])]);
  expect(guards[0].id).not.toBe(guards[1].id);
  await Promise.all(guards.map(g=>g.finish()));
  expect(guards.every(g=>g.finished)).toBe(true);
  for(const guard of guards){const end=endRecord(guard);expectRequests(end,[]);expect(end.rules).toEqual([]);expect(end.documents).toEqual([]);}
});

test(CASES[7],async({makeGuard})=>{
  const early=await makeGuard([],{expectedErrors:['N1_EARLY_CLOSE']});const page=await early.context.newPage();expect(await page.evaluate(()=>1+1)).toBe(2);await page.close();
  const earlyEnd=await expectFailure(early,['N1_EARLY_CLOSE']);expectRequests(earlyEnd,[]);
  const replaced=await makeGuard([simple],{expectedErrors:['N1_OBSERVER']});const replacedPage=await replaced.context.newPage();await replacedPage.goto(`${FIXTURE_ORIGIN}/`);
  await replacedPage.evaluate(()=>{globalThis.WebSocket=new Proxy(WebSocket,{construct(target,args,newTarget){return Reflect.construct(target,args,newTarget);}});});
  const replacedEnd=await expectFailure(replaced,['N1_OBSERVER']);expectRequests(replacedEnd,[['http','home','fulfill']]);expect(replacedEnd.documents.some(d=>!d.intact)).toBe(true);
});
