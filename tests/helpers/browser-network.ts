import type { Browser, BrowserContext, BrowserContextOptions, Frame, Request, Route, WebSocketRoute } from '@playwright/test';
import { createHash, randomUUID } from 'node:crypto';
import { CODES, loadManifest, stageRoot, testKey, writeEvidence, validRecord, validPlanRecord, validModulePath, responseOwner, RESPONSE_LIMITS, MERMAID_ORIGIN, MERMAID_PREFIX, type Start, type End, type Identity, type RequestRecord, type DocumentRecord, type PlanRecord, type ResponseRecord, type ResponseLedger } from '../../tools/finalize-browser-network.ts';
import { makeOwner } from './browser-network-scope.ts';

export const FIXTURE_ORIGIN = 'https://fcd-fixture.invalid';
export const SOCKET_ORIGIN = 'wss://fcd-fixture.invalid';
export interface FixtureAsset {id:string;kind:'html'|'mermaid';body:string;bytes:number;sha256:string;modulePath?:string}
export interface ResponsePlan {assets:FixtureAsset[];phases:string[];transitions:{from:string;to:string}[];gates:string[]}
export interface FixtureRule {
  id: string; path: string; method: string; resource: string; body?: string;
  action?: 'fulfill' | 'deny'; count?: number; query?: string; status?: number;
  headers?: Record<string,string>; kind?: 'http' | 'websocket'; contentType?: string;
  asset?:string;phase?:string;gate?:string;origin?:typeof MERMAID_ORIGIN;abort?:'failed'|'blockedbyclient';
}
export interface GuardOptions {
  file:string;titlePath:string[];repeatEachIndex:number;
  title: string; project: string; engine: string; worker?: number; retry?: number;
  contextOptions?: BrowserContextOptions; expectedErrors?: readonly string[];
  register?: (id: string) => void;responsePlan?:unknown;
}
export interface GuardedContext {
  context: BrowserContext; id: string;
  finish(outcome?: 'passed' | 'failed'): Promise<void>;
  readonly finished: boolean;readonly phase:string|null;
  transition(next:string):void;releaseGate(id:string):void;pendingGate(id:string):number;
}
export class NetworkGuardError extends Error {
  readonly codes: string[];
  constructor(codes: Iterable<string>) {
    const unique = [...new Set(codes)].sort();
    super(unique.join(',')); this.name='NetworkGuardError'; this.codes=unique;
  }
}
const resources = ['document','stylesheet','image','media','font','script','texttrack','xhr','fetch','eventsource','websocket','manifest','other'];
const ruleFields=['id','path','method','resource','body','action','count','query','status','headers','kind','contentType','asset','phase','gate','origin','abort'];
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const digest=(v:string|Buffer)=>createHash('sha256').update(v).digest('hex');
function policy():never {throw new NetworkGuardError(['N1_POLICY']);}
const matchKey=(r:FixtureRule)=>JSON.stringify([r.kind??'http',r.origin??FIXTURE_ORIGIN,r.path,r.query??'',r.method,r.resource]);
export function validateFixtureRules(rules: FixtureRule[],plan?:PlanRecord): void {
  const ids = new Set<string>();const previous:FixtureRule[]=[];
  if (!Array.isArray(rules) || rules.length > 64) policy();
  for (const r of rules) {
    if(!object(r)||Object.keys(r).some(k=>!ruleFields.includes(k)))policy();
    const kind = r.kind ?? 'http'; const action = r.action ?? 'fulfill';
    const external=r.origin===MERMAID_ORIGIN;
    if(r.headers!==undefined&&(!object(r.headers)||Object.values(r.headers).some(v=>typeof v!=='string')))policy();
    const headerEntries = Object.entries(r.headers??{});
    const asset=r.asset===undefined?undefined:plan?.assets.find(a=>a.id===r.asset);
    const pathOK=external?r.path.startsWith(MERMAID_PREFIX)&&validModulePath(r.path.slice(MERMAID_PREFIX.length)):/^\/[a-zA-Z0-9/_.-]{0,200}$/.test(r.path)&&!r.path.includes('..');
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(r.id) || ids.has(r.id) || previous.some(p=>matchKey(p)===matchKey(r)&&(p.phase===undefined||r.phase===undefined||p.phase===r.phase)) || !pathOK ||
        !['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(r.method) || !resources.includes(r.resource) ||
        !['http','websocket'].includes(kind) || !['fulfill','deny'].includes(action) ||
        (kind==='websocket' && (r.method!=='GET' || r.resource!=='websocket')) ||
        (kind==='http' && r.resource==='websocket') ||
        (r.query!==undefined && (typeof r.query!=='string'||r.query.length>200 || !/^[a-zA-Z0-9%&=+_.-]*$/.test(r.query))) ||
        (r.count!==undefined && (!Number.isInteger(r.count) || r.count<1 || r.count>32)) || (action==='deny' && r.count===undefined) ||
        (r.body!==undefined && (typeof r.body!=='string' || Buffer.byteLength(r.body)>RESPONSE_LIMITS.inline)) ||
        (r.status!==undefined && (!Number.isInteger(r.status) || r.status<200 || r.status>599 || (r.status>=300 && r.status<400))) ||
        headerEntries.some(([k,v])=>!['content-type','cache-control',...(external?['access-control-allow-origin']:[])].includes(k.toLowerCase()) || /[\r\n]/.test(v) || v.length>200 || (k.toLowerCase()==='access-control-allow-origin'&&v!==FIXTURE_ORIGIN)) ||
        (r.contentType!==undefined && (!/^[a-z0-9.+-]+\/[a-z0-9.+-]+(?:; charset=utf-8)?$/i.test(r.contentType))) ||
        (r.origin!==undefined&&!external) || (r.asset!==undefined&&(!asset||r.body!==undefined||action!=='fulfill')) ||
        (r.phase!==undefined&&(!plan||!plan.phases.includes(r.phase))) || (r.gate!==undefined&&(!plan||!plan.gates.includes(r.gate)||action!=='fulfill')) ||
        (r.abort!==undefined&&(!plan||kind!=='http'||action!=='deny'||!['failed','blockedbyclient'].includes(r.abort))) ||
        (action==='deny'&&(r.body!==undefined||r.status!==undefined||r.contentType!==undefined||r.headers!==undefined||r.gate!==undefined)) ||
        (plan&&(kind!=='http'||r.method!=='GET')) ||
        (external&&(!plan||kind!=='http'||r.method!=='GET'||r.resource!=='script'||(r.query??'')!==''||!plan.assets.some(a=>a.kind==='mermaid'&&MERMAID_PREFIX+a.modulePath===r.path))) ||
        (asset&&(asset.kind==='html'?(external||r.resource!=='document'||r.method!=='GET'):( !external||r.path!==MERMAID_PREFIX+asset.modulePath||r.resource!=='script'||(r.status??200)!==200))) ||
        (external&&action==='fulfill'&&asset?.kind!=='mermaid') ||
        (asset&&(r.contentType!==undefined&&r.contentType!==(asset.kind==='html'?'text/html':'application/javascript')||headerEntries.some(([k])=>k.toLowerCase()==='content-type')))) policy();
    ids.add(r.id);previous.push(r);
  }
}
/** Validate the complete registration before any browser or response exists. */
export function validateResponsePlan(rules:FixtureRule[],raw:unknown):PlanRecord {
  if(!object(raw)||Object.keys(raw).length!==4||!['assets','phases','transitions','gates'].every(k=>Object.hasOwn(raw,k))||!Array.isArray(raw.assets)||!Array.isArray(raw.phases)||!Array.isArray(raw.transitions)||!Array.isArray(raw.gates))policy();
  const assets=raw.assets.map(a=>{
    if(!object(a)||Object.keys(a).some(k=>!['id','kind','body','bytes','sha256','modulePath'].includes(k))||!['id','kind','body','bytes','sha256'].every(k=>Object.hasOwn(a,k))||typeof a.body!=='string'||typeof a.id!=='string'||!['html','mermaid'].includes(String(a.kind))||a.bytes!==Buffer.byteLength(a.body)||a.sha256!==digest(a.body)||(a.kind==='html'?a.modulePath!==undefined:!validModulePath(a.modulePath)))policy();
    return {id:a.id,kind:a.kind as 'html'|'mermaid',bytes:Number(a.bytes),sha256:String(a.sha256),modulePath:a.kind==='mermaid'?String(a.modulePath):null};
  });
  const plan:PlanRecord={assets,phases:[...raw.phases] as string[],transitions:structuredClone(raw.transitions) as PlanRecord['transitions'],gates:[...raw.gates] as string[],rules:[],distinctBytes:assets.reduce((n,a)=>n+a.bytes,0)};
  validateFixtureRules(rules,plan);
  plan.rules=rules.map(r=>{
    const asset=assets.find(a=>a.id===r.asset),denied=r.action==='deny';
    return {id:r.id,phase:r.phase??null,gate:r.gate??null,asset:r.asset??null,origin:r.origin?'mermaid':'fixture',match:digest(matchKey(r)),resource:r.resource,action:r.action??'fulfill',count:r.count??null,bytes:denied?0:asset?.bytes??Buffer.byteLength(r.body??''),sha256:denied?null:asset?.sha256??digest(r.body??''),status:denied?null:r.status??200,abort:denied?r.abort??'blockedbyclient':null};
  });
  if(!validPlanRecord(plan))policy();return plan;
}
export function validateContextOptions(options: BrowserContextOptions): void {
  if ((options.serviceWorkers!==undefined && options.serviceWorkers!=='block') || options.proxy!==undefined || options.recordHar!==undefined || options.httpCredentials!==undefined || options.storageState!==undefined) throw new NetworkGuardError(['N1_OPTIONS']);
}
export function matchFixtureRule(rules: FixtureRule[], raw: string, method: string, resource: string, kind: 'http'|'websocket'='http',phase?:string): FixtureRule | undefined {
  // URL parsing removes encoded dot segments. Reject the raw address before
  // normalization, while leaving the separately matched query bytes intact.
  if(typeof raw!=='string'||/[\x00-\x20\x7f\\]/.test(raw))return undefined;
  const address=raw.split(/[?#]/,1)[0];
  if(/%(?:2e|2f|5c)/i.test(address)||/\/\.{1,2}(?:\/|$)/.test(address))return undefined;
  let url: URL; try { url=new URL(raw); } catch { return undefined; }
  if (url.username || url.password || url.hash || ![(kind==='http'?FIXTURE_ORIGIN:SOCKET_ORIGIN),...(kind==='http'?[MERMAID_ORIGIN]:[])].includes(url.origin)) return undefined;
  return rules.find(r=>(r.kind??'http')===kind && url.origin===(r.origin??(kind==='http'?FIXTURE_ORIGIN:SOCKET_ORIGIN)) && (r.origin!==MERMAID_ORIGIN||(r.path.startsWith(MERMAID_PREFIX)&&resource==='script'&&method==='GET'&&url.search==='')) && (r.phase===undefined||r.phase===phase) && r.path===url.pathname && (r.query??'')===url.search.slice(1) && r.method===method && r.resource===resource);
}
const bounded = async <T>(promise: Promise<T>, milliseconds = 3000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new NetworkGuardError(['N1_OBSERVER'])),milliseconds);})]); }
  finally { if(timer) clearTimeout(timer); }
};
interface Observer { count(): number; flush(): Promise<DocumentRecord[]> }
type ObserverFailure='binding-shape'|'ready-shape'|'unknown-document'|'socket-accounting'|'retire-shape'|'retire-unknown-document'|'retire-page'|'retire-origin'|'retire-accounting'|'flush-detached'|'flush-state'|'flush-accounting'|'flush-timeout'|'flush-evaluation'|'unfinished-document';
/** Independent document-start observation using public APIs. N0 is the firewall.
 * A Window can receive repeated init calls or outlive its initial Document.
 * One immutable controller owns separate, bounded per-Document identities.
 * Top-level ready messages have independent binding and console transports;
 * console can identify only a Page, so subframes still require their binding.
 * Registration is never inferred from a retirement or a socket request.
 * Synchronous retirement storage recovers only already-known same-origin keys
 * when pagehide console delivery is lost. Missing evidence still fails closed.
 */
export async function observeDocumentWebSockets(context: BrowserContext, onAttempt: (url:string)=>void = () => {}, onFailure: (reason:ObserverFailure)=>void = () => {}): Promise<Observer> {
  const token=randomUUID().replaceAll('-','');
  const bootstrapKey=randomUUID();
  const bindingName=`__fcdN1Report${token}`;
  const stateName=`__fcdN1State${token}`;
  const retirementPrefix=`FCD_N1_RETIRE_${token}:`;
  const readyPrefix=`FCD_N1_READY_${token}:`;
  type Transport='binding'|'console';
  const docs=new Map<string,DocumentRecord & { frame:Frame; initial:boolean; origin:string; top:boolean; registrations:Set<Transport> }>();
  let attempts=0;
  const ready=(value:unknown,frame:Frame,transport:Transport):boolean=>{
    if(!value || typeof value!=='object' || Array.isArray(value)){onFailure('ready-shape');return false;}
    const v=value as Record<string,unknown>,fields=['kind','id','initial','origin','top'];
    if(Object.keys(v).length!==fields.length || fields.some(k=>!Object.hasOwn(v,k)) || v.kind!=='ready' ||
        typeof v.id!=='string' || !/^[0-9a-f-]{36}$/.test(v.id) || typeof v.initial!=='boolean' ||
        typeof v.origin!=='string' || v.origin.length>200 || typeof v.top!=='boolean' ||
        v.top!==(frame===frame.page().mainFrame()) || (transport==='console' && !v.top)){
      onFailure('ready-shape');return false;
    }
    const existing=docs.get(v.id);
    if(existing){
      if(existing.frame!==frame || existing.initial!==v.initial || existing.origin!==v.origin || existing.top!==v.top || existing.registrations.has(transport)){
        onFailure('ready-shape');return false;
      }
      existing.registrations.add(transport);return true;
    }
    if(docs.size>=128){onFailure('ready-shape');return false;}
    docs.set(v.id,{id:v.id,attempts:0,acknowledged:0,intact:true,flushed:false,frame,initial:v.initial,origin:v.origin,top:v.top,registrations:new Set([transport])});
    return true;
  };
  const retire=(text:string,source:{page?:ReturnType<Frame['page']>;origin?:string})=>{
    try {
      if(text.length>512)throw new Error('bound');
      const value:unknown=JSON.parse(text);
      if(!value || typeof value!=='object' || Array.isArray(value))throw new Error('shape');
      const v=value as Record<string,unknown>;
      const fields=['kind','id','attempts','failures','sealed','intact','readyFailed'];
      if(Object.keys(v).length!==fields.length || fields.some(k=>!Object.hasOwn(v,k)) || typeof v.id!=='string' ||
          v.kind!=='retire' || v.sealed!==true || typeof v.intact!=='boolean' || typeof v.readyFailed!=='boolean' ||
          !Number.isInteger(v.attempts) || Number(v.attempts)<0 || Number(v.attempts)>128 ||
          !Number.isInteger(v.failures) || Number(v.failures)<0 || Number(v.failures)>128)throw new Error('shape');
      const d=docs.get(v.id);
      if(!d){onFailure('retire-unknown-document');return;}
      if(source.page!==undefined && d.frame.page()!==source.page){onFailure('retire-page');return;}
      if(source.origin!==undefined && d.origin!==source.origin){onFailure('retire-origin');return;}
      d.attempts=Number(v.attempts);d.intact=d.intact&&v.intact;
      d.flushed=d.attempts===d.acknowledged && v.failures===0 && (!v.readyFailed || d.registrations.has('console'));
      if(!d.intact || !d.flushed)onFailure('retire-accounting');
    }catch{onFailure('retire-shape');}
  };
  context.on('console',message=>{
    if(message.type()!=='debug')return;
    const text=message.text();
    if(text.startsWith(readyPrefix)){
      const page=message.page(),payload=text.slice(readyPrefix.length);
      if(!page || payload.length>512){onFailure('ready-shape');return;}
      try{ready(JSON.parse(payload),page.mainFrame(),'console');}catch{onFailure('ready-shape');}
    }else if(text.startsWith(retirementPrefix)){
      const page=message.page();if(!page){onFailure('retire-page');return;}
      retire(text.slice(retirementPrefix.length),{page});
    }
  });
  await context.exposeBinding(bindingName,(source,value:unknown)=>{
    if (!value || typeof value!=='object') { onFailure('binding-shape'); return; }
    const v=value as Record<string,unknown>;
    if (typeof v.id!=='string' || !/^[0-9a-f-]{36}$/.test(v.id)) { onFailure('binding-shape'); return; }
    if (v.kind==='ready') return ready(v,source.frame,'binding');
    const d=docs.get(v.id);
    if (!d || d.frame!==source.frame) { onFailure('unknown-document'); return; }
    if (v.kind==='socket') {
      if (typeof v.url!=='string' || v.url.length>2048 || v.sequence!==d.acknowledged+1 || attempts>=128) { onFailure('socket-accounting'); return; }
      attempts++; d.acknowledged++; d.attempts=d.acknowledged; d.flushed=false; onAttempt(v.url);
    } else onFailure('binding-shape');
  });
  await context.addInitScript(({bindingName,stateName,retirementPrefix,readyPrefix,bootstrapKey})=>{
    const globals=globalThis as unknown as Record<string,unknown>;
    type Snapshot={id:string;attempts:number;failures:number;readyFailed:boolean;intact:boolean;origin:string;receipts:string[]};
    type Controller={resume:(key:string)=>boolean;flush:(ids:string[])=>Promise<Snapshot>};
    const descriptor=Object.getOwnPropertyDescriptor(globals,stateName);
    if(descriptor){
      const existing=descriptor.value as Partial<Controller>|undefined;
      if(descriptor.configurable!==false || descriptor.writable!==false || !existing || !Object.isFrozen(existing) ||
          typeof existing.resume!=='function' || typeof existing.flush!=='function' || existing.resume(bootstrapKey)!==true)throw new Error('N1_BOOTSTRAP_STATE');
      return;
    }
    let binding=globals[bindingName] as (data:unknown)=>Promise<unknown>;
    let bindingRefreshed=false;
    if(typeof binding!=='function')throw new Error('N1_BOOTSTRAP_BINDING');
    const report=console.debug.bind(console);
    type State={owner:Document;id:string;origin:string;initial:boolean;attempts:number;failures:number;readyFailed:boolean;sealed:boolean;retired:boolean;pending:Set<Promise<void>>;store?: (key:string,value:string)=>void;read?: (key:string)=>string|null};
    const states=new WeakMap<Document,State>();let created=0;
    const current=():State=>{
      const owner=document,known=states.get(owner);if(known)return known;
      if(++created>128)throw new Error('N1_DOCUMENT_BOUND');
      const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
      const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
      const id=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
      // Capture storage and security origin per Document, not per Window. An
      // inherited blank frame's location.origin need not be its storage origin.
      const state:State={owner,id,origin:globalThis.origin,initial:location.href==='' || location.href==='about:blank',attempts:0,failures:0,readyFailed:false,sealed:false,retired:false,pending:new Set()};
      try{const storage=localStorage;state.store=storage.setItem.bind(storage);state.read=storage.getItem.bind(storage);}catch{ /* Opaque initial documents have no storage. */ }
      states.set(owner,state);
      const payload={kind:'ready',id,initial:state.initial,origin:state.origin,top:window===window.top};
      if(payload.top)report(readyPrefix+JSON.stringify(payload));
      // A lost binding acknowledgment is not silently forgiven: flush/retire
      // require this exact document's independently received console ready.
      // Do not let a redundant ready promise strand socket completion forever.
      try{void Promise.resolve(binding(payload)).then(ack=>{if(ack!==true)state.readyFailed=true;},()=>{state.readyFailed=true;});}
      catch{state.readyFailed=true;}
      return state;
    };
    const emitSocket=(state:State,url:string)=>{
      let task:Promise<void>;
      try{
        task=Promise.resolve(binding({kind:'socket',id:state.id,sequence:state.attempts,url})).then(()=>{},()=>{state.failures++;}).finally(()=>state.pending.delete(task));
        state.pending.add(task);
      }catch{state.failures++;}
    };
    const Original=globalThis.WebSocket;
    const Wrapped=new Proxy(Original,{
      construct(target,args,newTarget){
        const state=current();if(state.sealed)throw new Error('N1_DOCUMENT_RETIRED');
        const socket=Reflect.construct(target,args,newTarget) as WebSocket;
        state.attempts++;emitSocket(state,socket.url);return socket;
      },
    });
    const intact=():boolean=>globalThis.WebSocket===Wrapped && globals[bindingName]===binding && globals[stateName]===controller;
    const controller:Controller=Object.freeze({
      resume(key:string){
        // Only the installed init script holds this independent capability.
        // Never repair constructor replacement or a page-requested reset.
        if(key!==bootstrapKey || globalThis.WebSocket!==Wrapped || globals[stateName]!==controller)return false;
        if(globals[bindingName]!==binding){
          const state=states.get(document),candidate=globals[bindingName];
          // Pinned Playwright refreshes the exposed function during Chromium's
          // second initial-popup bootstrap. Reconcile that one zero-attempt,
          // still-live initial Document only; no new identity/counters/ready.
          if(bindingRefreshed || !state || !state.initial || state.sealed || state.retired || state.attempts!==0 || state.failures!==0 ||
              window!==window.top || (location.href!=='' && location.href!=='about:blank') || typeof candidate!=='function')return false;
          binding=candidate as (data:unknown)=>Promise<unknown>;bindingRefreshed=true;
        }
        current();return true;
      },
      async flush(ids:string[]){
        const state=current();state.sealed=true;await Promise.all([...state.pending]);
        if(ids.length>128)throw new Error('N1_RECEIPT_BOUND');
        const receipts:string[]=[];
        if(state.read)for(const documentId of ids){const receipt=state.read(retirementPrefix+documentId);if(receipt!==null){if(receipt.length>512)throw new Error('N1_RECEIPT_BOUND');receipts.push(receipt);}}
        return {id:state.id,attempts:state.attempts,failures:state.failures,readyFailed:state.readyFailed,intact:intact(),origin:state.origin,receipts};
      },
    });
    globalThis.WebSocket=Wrapped;
    Object.defineProperty(globals,stateName,{value:controller,configurable:false,writable:false});
    current();
    addEventListener('pageshow',event=>{if(event.target===document || event.target===window)current();});
    addEventListener('pagehide',event=>{
      const owner=event.target===window?document:event.target;
      const state=owner===document?current():owner?states.get(owner as Document):undefined;
      if(!state || state.retired)return;
      state.sealed=true;state.retired=true;
      const receipt=JSON.stringify({kind:'retire',id:state.id,attempts:state.attempts,failures:state.failures,sealed:true,intact:intact(),readyFailed:state.readyFailed});
      try{if(state.store)state.store(retirementPrefix+state.id,receipt);}catch{ /* Console may deliver; missing receipts still fail closed. */ }
      report(retirementPrefix+receipt);
    });
  },{bindingName,stateName,retirementPrefix,readyPrefix,bootstrapKey});
  return {
    count:()=>attempts,
    async flush() {
      for(const page of context.pages())for(const frame of page.frames()) {
        if(frame.isDetached()){onFailure('flush-detached');continue;}
        try {
          const state=await bounded(frame.evaluate(async ({name,ids})=>{
            const value=(globalThis as unknown as Record<string,unknown>)[name] as {flush:(ids:string[])=>Promise<{id:string;attempts:number;failures:number;readyFailed:boolean;intact:boolean;origin:string;receipts:string[]}>}|undefined;
            return value ? await value.flush(ids) : null;
          },{name:stateName,ids:[...docs.keys()]}));
          const d=state?docs.get(state.id):undefined;
          if(!state || !d || d.frame!==frame || d.origin!==state.origin){onFailure('flush-state');continue;}
          d.attempts=state.attempts;d.intact=d.intact&&state.intact;
          d.flushed=state.failures===0 && state.attempts===d.acknowledged && (!state.readyFailed || d.registrations.has('console'));
          if(!d.intact || !d.flushed)onFailure('flush-accounting');
          for(const receipt of state.receipts)retire(receipt,{origin:state.origin});
        }catch(cause){onFailure(cause instanceof NetworkGuardError?'flush-timeout':'flush-evaluation');}
      }
      return [...docs.values()].map(({frame: _frame,initial,origin: _origin,top: _top,registrations: _registrations,...d})=>{
        if(initial && d.attempts===0)d.flushed=true;
        if(!d.flushed || !d.intact)onFailure('unfinished-document');
        return d;
      });
    },
  };
}
export async function createGuardedContext(browser: Browser, rules: FixtureRule[], options?: GuardOptions): Promise<GuardedContext> {
  return buildGuard(()=>browser.newContext({...options?.contextOptions,serviceWorkers:'block'}),rules,options);
}
/** Reuse the runner-owned context so all public runner options and artifacts survive. */
export async function attachGuard(context: BrowserContext,rules:FixtureRule[],options:GuardOptions):Promise<GuardedContext> {
  return buildGuard(async()=>context,rules,options);
}
async function buildGuard(create:()=>Promise<BrowserContext>, rules:FixtureRule[], options?:GuardOptions):Promise<GuardedContext> {
  if(!options || !['unit','render'].includes(process.env.FCD_LABEL??'')) throw new Error('N1_IDENTITY');
  const root=stageRoot(); const manifest=loadManifest(root); const id=randomUUID();
  const owner=makeOwner(process.env.FCD_LABEL as 'unit'|'render',options.file,options.titlePath,options.project,options.repeatEachIndex);
  const identity:Identity={...owner,engine:options.engine,title:options.title,test:testKey(owner),worker:options.worker??0,retry:options.retry??0,pid:process.pid};
  const expectedErrors=[...options.expectedErrors??[]].sort();
  if(expectedErrors.some(c=>!(CODES as readonly string[]).includes(c)) || new Set(expectedErrors).size!==expectedErrors.length) throw new Error('N1_IDENTITY');
  let plan:PlanRecord|null|undefined,registrationFailure=false;const bodies=new Map<string,Buffer>();
  if(options.responsePlan!==undefined){
    if(!responseOwner(owner))throw new Error('N1_IDENTITY');
    try{
      rules=structuredClone(rules);const input=structuredClone(options.responsePlan);
      plan=validateResponsePlan(rules,input);
      for(const asset of (input as ResponsePlan).assets)bodies.set(asset.id,Buffer.from(asset.body,'utf8'));
    }catch{plan=null;registrationFailure=true;}
  }
  const start:Start={...manifest,kind:'start',id,identity,expectedErrors,...(plan!==undefined?{plan}:{})};
  if(!validRecord(start))throw new Error('N1_IDENTITY');
  options.register?.(id);
  try { writeEvidence(root,`${id}.start.json`,start); } catch { throw new NetworkGuardError(['N1_WRITE']); }
  const errors=new Set<string>(); const requests:RequestRecord[]=[];
  const seen=new Map<Request,RequestRecord>();const sockets=new Map<string,RequestRecord[]>();
  const pending=new Set<Promise<void>>();const hits=new Map<string,number>();const observerFailures=new Set<ObserverFailure>();
  let context:BrowserContext|undefined;let observer:Observer|undefined;
  let setup=false,closing=false,closed=false,finished=false,finishing=false,validated=false;
  let finishPromise:Promise<void>|undefined;let documents:DocumentRecord[]=[];
  const response:ResponseLedger|null=plan?{phase:plan.phases[0],transitions:[],gates:plan.gates.map(id=>({id,released:false,expired:false,waits:0,settled:0})),responses:[],chargedBytes:0,fulfilledBytes:0}:null;
  type Waiter={settle:(failed:boolean)=>void};
  const waiters=new Map<string,Set<Waiter>>(plan?.gates.map(id=>[id,new Set<Waiter>()])??[]);
  const error=(code:string)=>{errors.add(code);};
  function controlFailure(code:'N2A_GATE'|'N2A_PHASE'):never {
    error(code);
    // A post-seal misuse cannot rewrite an exclusive end record. Persist a
    // bounded failure marker so even a caught late exception cannot turn green.
    if(finished)try{writeEvidence(root,'reporter-error.json',{...manifest,kind:'guard-late-error',id,code});}catch{error('N1_WRITE');}
    throw new NetworkGuardError([code]);
  }
  const waitGate=async(gate:string,row:ResponseRecord)=>{
    const state=response?.gates.find(g=>g.id===gate),set=waiters.get(gate);
    if(!state||!set)controlFailure('N2A_GATE');
    if(state.expired||finishing)controlFailure('N2A_GATE');
    if(state.released)return;
    row.waited=true;state.waits++;
    await new Promise<void>((resolve,reject)=>{
      let timer:ReturnType<typeof setTimeout>;
      const item:Waiter={settle:failed=>{if(!set.delete(item))return;clearTimeout(timer);state.settled++;if(failed)reject(new NetworkGuardError(['N2A_GATE']));else resolve();}};
      set.add(item);timer=setTimeout(()=>{state.expired=true;error('N2A_GATE');for(const pending of [...set])pending.settle(true);},RESPONSE_LIMITS.gate);
    });
  };
  const releaseGate=(gate:string)=>{
    const state=response?.gates.find(g=>g.id===gate),set=waiters.get(gate);
    if(!state||!set||finishing||finished||state.released||state.expired||set.size===0)controlFailure('N2A_GATE');
    state.released=true;for(const item of [...set])item.settle(false);
  };
  const transition=(next:string)=>{
    if(!plan||!response||finishing||finished||pending.size||requests.some(r=>!r.handled)||!plan.transitions.some(e=>e.from===response.phase&&e.to===next)||response.transitions.some(e=>e.to===next)||next===plan.phases[0])controlFailure('N2A_PHASE');
    response.transitions.push({from:response.phase,to:next,after:requests.length});response.phase=next;
  };
  const add=(kind:'http'|'websocket'):RequestRecord|undefined=>{
    if(requests.length>=128) {error('N1_LIMIT');return;}
    const r:RequestRecord={seq:requests.length+1,kind,rule:null,action:'unhandled',observed:false,handled:false};requests.push(r);return r;
  };
  const http=(request:Request)=>{let record=seen.get(request);if(!record){record=add('http');if(record)seen.set(request,record);}return record;};
  const socket=(url:string,side:'observed'|'handled')=>{
    const key=createHash('sha256').update(url).digest('hex');const queue=sockets.get(key)??[];
    let record=queue.find(r=>!r[side]);if(!record){record=add('websocket');if(record){queue.push(record);sockets.set(key,queue);}}return record;
  };
  const choose=(record:RequestRecord,url:string,method:string,resource:string)=>{
    const rule=matchFixtureRule(rules,url,method,resource,record.kind,response?.phase);record.handled=true;
    if(!rule){record.action='unexpected';error('N1_UNEXPECTED_REQUEST');return;}
    record.rule=rule.id;record.action=rule.action??'fulfill';hits.set(rule.id,(hits.get(rule.id)??0)+1);return rule;
  };
  const track=(operation:()=>Promise<void>)=>{const task=operation().catch(()=>error('N1_HANDLER')).finally(()=>pending.delete(task));pending.add(task);return task;};
  const onHttp=(route:Route)=>track(async()=>{
    const request=route.request();const record=http(request);
    if(!record){await route.abort('blockedbyclient');return;}
    const rule=choose(record,request.url(),request.method(),request.resourceType());
    const row:ResponseRecord|undefined=response?{seq:record.seq,phase:response.phase,rule:record.rule,asset:rule?.asset??null,gate:rule?.gate??null,waited:false,bytes:0,sha256:null,status:null,outcome:'failed'}:undefined;
    if(row)response!.responses.push(row);
    const send=async(body:Buffer|string,status:number,contentType:string,headers?:Record<string,string>)=>{
      const bytes=Buffer.byteLength(body);
      if(response&&response.chargedBytes+bytes>RESPONSE_LIMITS.fulfilled){error('N1_LIMIT');await route.abort('blockedbyclient');return;}
      if(response&&row){response.chargedBytes+=bytes;row.bytes=bytes;row.sha256=digest(body);row.status=status;}
      await route.fulfill({status,contentType,headers,body});
      if(response&&row){row.outcome='fulfilled';response.fulfilledBytes+=bytes;}
    };
    try{
      if(!rule||record.action==='deny'){
        if(request.resourceType()==='document')await send('<!doctype html><html><head><title>Fixture request denied</title></head><body><p>Denied by local fixture policy.</p></body></html>',451,'text/html');
        else {await route.abort(rule?.abort??'blockedbyclient');if(row)row.outcome='aborted';}
      }else{
        if(rule.gate&&row)await waitGate(rule.gate,row);
        const asset=plan?.assets.find(a=>a.id===rule.asset),body=rule.asset?bodies.get(rule.asset):rule.body??'';
        if(body===undefined||asset&&(Buffer.byteLength(body)!==asset.bytes||digest(body)!==asset.sha256))throw new NetworkGuardError(['N1_POLICY']);
        const headers=rule.origin===MERMAID_ORIGIN?{...rule.headers,'access-control-allow-origin':FIXTURE_ORIGIN}:rule.headers;
        await send(body,rule.status??200,asset?(asset.kind==='html'?'text/html':'application/javascript'):rule.contentType??'text/html',headers);
      }
    }catch(cause){
      if(cause instanceof NetworkGuardError)for(const code of cause.codes)error(code);else error('N1_HANDLER');
      try{await route.abort('blockedbyclient');}catch{error('N1_HANDLER');}
    }
  });
  const onSocket=(ws:WebSocketRoute)=>track(async()=>{
    const record=socket(ws.url(),'handled');if(!record){await ws.close({code:1008,reason:'fixture limit'});return;}
    const rule=choose(record,ws.url(),'GET','websocket');
    if(!rule || record.action==='deny')await ws.close({code:1008,reason:'fixture policy'});
    else ws.onMessage(()=>{try{ws.send(rule.body??'fixture');}catch{error('N1_HANDLER');}});
  });
  const finish=async(outcome:'passed'|'failed'='passed')=>{
    if(finishPromise)return finishPromise;
    finishing=true;
    finishPromise=(async()=>{
      if(outcome!=='passed')error('N1_TEST_FAILED');
      if(response)for(const gate of response.gates)if(!gate.released){error('N2A_GATE');for(const item of [...waiters.get(gate.id)??[]])item.settle(true);}
      if(observer && setup)documents=await observer.flush();
      try{await bounded(Promise.all([...pending]).then(()=>{}));}catch{error('N1_HANDLER');}
      closing=true;
      if(context){try{await bounded(context.close());closed=true;}catch{error('N1_CLOSE');try{await bounded(context.close());closed=true;}catch{error('N1_CLOSE');}}}else closed=true;
      try{await bounded(Promise.all([...pending]).then(()=>{}));}catch{error('N1_HANDLER');}
      for(const r of requests){if(!r.observed)error('N1_OBSERVER');if(!r.handled)error('N1_BYPASS');}
      for(const rule of rules)if(rule.count!==undefined && (hits.get(rule.id)??0)!==rule.count)error('N1_COUNT');
      if(response)response.responses.sort((a,b)=>a.seq-b.seq);
      const end:End={...start,kind:'end',setup,closed,outcome,errors:[...errors].sort(),rules:rules.map(r=>({id:r.id,action:r.action??'fulfill',count:r.count??null,hits:hits.get(r.id)??0})),requests,documents,...(plan!==undefined?{response}:{})};
      try{writeEvidence(root,`${id}.end.json`,end);}catch{error('N1_WRITE');}
      finished=true;if(errors.size)throw new NetworkGuardError(errors);
    })();return finishPromise;
  };
  try {
    if(registrationFailure)policy();
    validateFixtureRules(rules,plan??undefined);validated=true;validateContextOptions(options.contextOptions??{});
    rules=structuredClone(rules);context=await create();
    if(context.pages().length)throw new NetworkGuardError(['N1_SETUP']);
    context.on('request',request=>{const r=http(request);if(r)r.observed=true;});
    context.on('serviceworker',()=>error('N1_WORKER'));
    context.on('page',page=>{page.on('close',()=>{if(!closing)error('N1_EARLY_CLOSE');});page.on('worker',()=>error('N1_WORKER'));});
    await context.route('**/*',onHttp);await context.routeWebSocket('**/*',onSocket);
    if(options.contextOptions?.javaScriptEnabled!==false)observer=await observeDocumentWebSockets(context,url=>{const r=socket(url,'observed');if(r)r.observed=true;},reason=>{
      error('N1_OBSERVER');if(!observerFailures.has(reason)){observerFailures.add(reason);console.log(`::notice title=N1 observer diagnostic::${JSON.stringify({context:id,reason})}`);}
    });
    setup=true;
  } catch(cause) {
    if(!validated)rules=[];
    if(cause instanceof NetworkGuardError)for(const code of cause.codes)error(code);else error('N1_SETUP');
    await finish();throw new NetworkGuardError(['N1_SETUP']);
  }
  return {context:context!,id,finish,transition,releaseGate,pendingGate:gate=>waiters.get(gate)?.size??0,get phase(){return response?.phase??null;},get finished(){return finished;}};
}
