import { test, expect } from '../helpers/isolated-test.ts';
import { FIXTURE_ORIGIN, type FixtureRule, type GuardedContext } from '../helpers/browser-network.ts';
import { CASES } from '../../tools/finalize-browser-network.ts';

const socketScript=`<script>const socket=new WebSocket('wss://fcd-fixture.invalid/socket');socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{document.documentElement.dataset.socket=e.data;socket.close();};</script>`;
const simple:FixtureRule={id:'home',path:'/',method:'GET',resource:'document',body:'<h1>fixture</h1>'};
const baseRules:FixtureRule[]=[
  {...simple,body:`<h1>fixture</h1><iframe title="local frame" src="/frame"></iframe><a href="/popup" target="_blank">Open popup</a>${socketScript}`},
  {id:'frame',path:'/frame',method:'GET',resource:'document',body:`<h1>frame fixture</h1>${socketScript}`},
  {id:'popup',path:'/popup',method:'GET',resource:'document',body:`<h1>popup fixture</h1>${socketScript}`},
  {id:'socket',kind:'websocket',path:'/socket',method:'GET',resource:'websocket',body:'local-pong'},
];
test.use({networkRules:[baseRules,{scope:'test'}]});
const expectFailure=async(guard:GuardedContext,codes:string[])=>{
  await expect(guard.finish()).rejects.toMatchObject({codes:[...codes].sort()});
};

test(CASES[0],async({page,context})=>{
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
});

test(CASES[1],async({makeGuard})=>{
  const guard=await makeGuard([simple],{expectedErrors:['N1_UNEXPECTED_REQUEST']});
  const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);
  await expect(page.getByRole('heading')).toHaveText('fixture');
  expect(await page.evaluate(()=>fetch('/unexpected?q=synthetic').then(()=>false,()=>true))).toBe(true);
  expect(await page.evaluate(()=>new Promise<boolean>(resolve=>{const img=new Image();img.onload=()=>resolve(false);img.onerror=()=>resolve(true);img.src='/unexpected-image';document.body.append(img);}))).toBe(true);
  await expectFailure(guard,['N1_UNEXPECTED_REQUEST']);
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
  expect(closeCode).toBe(1008);await allowed.finish();
  const missing=await makeGuard([deny],{expectedErrors:['N1_COUNT']});await expectFailure(missing,['N1_COUNT']);
  const extra=await makeGuard([simple,deny],{expectedErrors:['N1_COUNT']});
  const extraPage=await extra.context.newPage();await extraPage.goto(`${FIXTURE_ORIGIN}/`);
  expect(await extraPage.evaluate(async()=>{let denied=0;for(let i=0;i<2;i++)await fetch('/denied').catch(()=>{denied++;});return denied;})).toBe(2);
  await expectFailure(extra,['N1_COUNT']);
});

test(CASES[3],async({makeGuard})=>{
  const http=await makeGuard([simple],{expectedErrors:['N1_BYPASS']});
  const page=await http.context.newPage();await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<h1>page override</h1>'}));
  await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('page override');await expectFailure(http,['N1_BYPASS']);
  const ws=await makeGuard([simple],{expectedErrors:['N1_BYPASS']});const socketPage=await ws.context.newPage();
  await socketPage.routeWebSocket('**/*',socket=>socket.onMessage(()=>socket.send('override-local')));
  await socketPage.goto(`${FIXTURE_ORIGIN}/`);
  expect(await socketPage.evaluate(()=>new Promise<string>((resolve,reject)=>{
    const socket=new WebSocket('wss://fcd-fixture.invalid/overridden');const timer=setTimeout(()=>reject(new Error('local override timeout')),3000);
    socket.onopen=()=>socket.send('hello');socket.onmessage=e=>{clearTimeout(timer);socket.close();resolve(String(e.data));};
  }))).toBe('override-local');
  await expectFailure(ws,['N1_BYPASS']);
});

test(CASES[4],async({makeGuard})=>{
  const redirect=await makeGuard([simple],{expectedErrors:['N1_UNEXPECTED_REQUEST']});const page=await redirect.context.newPage();
  await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('fixture');
  await page.goto(`${FIXTURE_ORIGIN}/unapproved-destination`).catch(()=>undefined);
  await expectFailure(redirect,['N1_UNEXPECTED_REQUEST']);
  // Worker programs are unsupported guard consumers. Their script requests are
  // observed/fulfilled locally, and successful worker creation fails its owner.
  const workerRules:FixtureRule[]=[simple,...['script','other'].map(resource=>({id:`worker-${resource}`,path:'/worker.js',method:'GET',resource,body:'postMessage("worker-ready")',contentType:'application/javascript'}))];
  const worker=await makeGuard(workerRules,{expectedErrors:['N1_WORKER']});const workerPage=await worker.context.newPage();await workerPage.goto(`${FIXTURE_ORIGIN}/`);
  expect(await workerPage.evaluate(()=>new Promise<string>((resolve,reject)=>{
    const w=new Worker('/worker.js');const timer=setTimeout(()=>{w.terminate();reject(new Error('local worker timeout'));},3000);
    w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(String(e.data));};w.onerror=()=>{clearTimeout(timer);w.terminate();reject(new Error('local worker failed'));};
  }))).toBe('worker-ready');
  await expectFailure(worker,['N1_WORKER']);
});

test(CASES[5],async({makeGuard,viewport,colorScheme})=>{
  const guard=await makeGuard([{...simple,body:'<h1>no-JS fixture</h1><script>document.querySelector("h1").textContent="changed";</script>'}],{contextOptions:{javaScriptEnabled:false}});
  const page=await guard.context.newPage();await page.goto(`${FIXTURE_ORIGIN}/`);await expect(page.getByRole('heading')).toHaveText('no-JS fixture');
  expect(page.viewportSize()).toEqual(viewport);
  expect(await page.evaluate(()=>matchMedia('(prefers-color-scheme: dark)').matches)).toBe(colorScheme==='dark');
  await guard.finish();
});

test(CASES[6],async({makeGuard})=>{
  const guards=await Promise.all([makeGuard([]),makeGuard([])]);
  expect(guards[0].id).not.toBe(guards[1].id);
  await Promise.all(guards.map(g=>g.finish()));
  expect(guards.every(g=>g.finished)).toBe(true);
});

test(CASES[7],async({makeGuard})=>{
  const early=await makeGuard([],{expectedErrors:['N1_EARLY_CLOSE']});const page=await early.context.newPage();expect(await page.evaluate(()=>1+1)).toBe(2);await page.close();await expectFailure(early,['N1_EARLY_CLOSE']);
  const replaced=await makeGuard([simple],{expectedErrors:['N1_OBSERVER']});const replacedPage=await replaced.context.newPage();await replacedPage.goto(`${FIXTURE_ORIGIN}/`);
  await replacedPage.evaluate(()=>{globalThis.WebSocket=new Proxy(WebSocket,{construct(target,args,newTarget){return Reflect.construct(target,args,newTarget);}});});
  await expectFailure(replaced,['N1_OBSERVER']);
});
