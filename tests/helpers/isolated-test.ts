import { test as base, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { attachGuard, createGuardedContext, validateContextOptions, FIXTURE_ORIGIN, type FixtureRule, type GuardedContext, type GuardOptions } from './browser-network.ts';
import { infoOwner, N1_FILE, renderContextModes } from './browser-network-scope.ts';
import { casePlan, type RenderPlan } from './render-fixtures.ts';

type Extra = Pick<GuardOptions,'contextOptions'|'expectedErrors'>;
type Fixtures = { networkRules:FixtureRule[];networkPlan:RenderPlan|undefined;network:GuardedContext;makeGuard:(rules:FixtureRule[],extra?:Partial<Extra>)=>Promise<GuardedContext>;secondaryPage:()=>Promise<Page> };
const attached=new WeakMap<BrowserContext,GuardedContext>();
const owner=(info:TestInfo)=>infoOwner({file:info.file,repositoryRoot:process.cwd(),titlePath:info.titlePath,project:info.project.name,repeatEachIndex:info.repeatEachIndex});
const identity=(info:TestInfo):GuardOptions=>({...owner(info),title:info.title,engine:String(info.project.use.browserName??'chromium'),worker:info.workerIndex,retry:info.retry,register:id=>info.annotations.push({type:'n1-context',description:id})});
async function finishChildren(children:GuardedContext[],info:TestInfo):Promise<void>{
  const results=await Promise.allSettled(children.filter(g=>!g.finished).map(g=>g.finish(info.status==='passed'?'passed':'failed')));
  const rejected=results.filter((r):r is PromiseRejectedResult=>r.status==='rejected');
  if(rejected.length)throw new AggregateError(rejected.map(r=>r.reason),'N1_CONTEXT_TEARDOWN');
}
export const test=base.extend<Fixtures>({
  // Inherit this default in every importing suite, not only the first file's test.use scope.
  serviceWorkers:'block',
  networkRules:[[],{option:true}],
  baseURL:async({baseURL},use,info)=>{await use(owner(info).file===N1_FILE?baseURL:FIXTURE_ORIGIN);},
  networkPlan:async({},use,info)=>{await use(owner(info).file===N1_FILE?undefined:await casePlan(owner(info)));},
  context:async({context,networkRules,networkPlan,contextOptions,javaScriptEnabled,serviceWorkers,proxy,launchOptions},use,info)=>{
    validateContextOptions(contextOptions);validateContextOptions({serviceWorkers,proxy:proxy??launchOptions.proxy});
    if(networkPlan&&(networkRules.length||(javaScriptEnabled!==false)!==renderContextModes(owner(info))[0]))throw new Error('N2A_CASE_OPTIONS');
    const guard=await attachGuard(context,networkPlan?.rules??networkRules,{...identity(info),contextOptions:{...contextOptions,javaScriptEnabled,serviceWorkers},...(networkPlan?{responsePlan:networkPlan.responsePlan}:{})});
    attached.set(context,guard);
    try{await use(context);}finally{await guard.finish(info.status==='passed'?'passed':'failed');}
  },
  network:[async({context},use)=>{const guard=attached.get(context);if(!guard)throw new Error('N1_FIXTURE_SETUP');await use(guard);},{auto:true}],
  makeGuard:async({browser,network,contextOptions,viewport,colorScheme,javaScriptEnabled,actionTimeout,navigationTimeout},use,info)=>{
    void network;const children:GuardedContext[]=[];
    try {
      await use(async(rules,extra={})=>{
        if(owner(info).file!==N1_FILE)throw new Error('N2A_RAW_FACTORY');
        const guard=await createGuardedContext(browser,rules,{...identity(info),...extra,contextOptions:{...contextOptions,viewport,colorScheme,javaScriptEnabled,...extra.contextOptions}});
        guard.context.setDefaultTimeout(actionTimeout);guard.context.setDefaultNavigationTimeout(navigationTimeout);
        children.push(guard);return guard;
      });
    } finally {await finishChildren(children,info);}
  },
  secondaryPage:async({browser,network,contextOptions,viewport,colorScheme,actionTimeout,navigationTimeout},use,info)=>{
    void network;const children:GuardedContext[]=[];let requested=false;
    try{
      await use(async()=>{
        const selected=owner(info),modes=renderContextModes(selected);
        if(requested||modes.length!==2||modes[1]!==false)throw new Error('N2A_SECONDARY_OWNER');
        requested=true;const plan=await casePlan(selected,1);
        const guard=await createGuardedContext(browser,plan.rules,{...identity(info),responsePlan:plan.responsePlan,contextOptions:{...contextOptions,viewport,colorScheme,baseURL:FIXTURE_ORIGIN,javaScriptEnabled:false}});
        children.push(guard);guard.context.setDefaultTimeout(actionTimeout);guard.context.setDefaultNavigationTimeout(navigationTimeout);
        return guard.context.newPage();
      });
    }finally{await finishChildren(children,info);}
  },
});
export { expect } from '@playwright/test';
export { FIXTURE_ORIGIN };
