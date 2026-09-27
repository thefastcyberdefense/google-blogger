import { test as base, type BrowserContext, type TestInfo } from '@playwright/test';
import { attachGuard, createGuardedContext, validateContextOptions, type FixtureRule, type GuardedContext, type GuardOptions } from './browser-network.ts';

type Extra = Pick<GuardOptions,'contextOptions'|'expectedErrors'>;
type Fixtures = {
  networkRules: FixtureRule[];
  network: GuardedContext;
  makeGuard: (rules:FixtureRule[],extra?:Partial<Extra>)=>Promise<GuardedContext>;
};
const attached=new WeakMap<BrowserContext,GuardedContext>();
const identity=(info:TestInfo):GuardOptions=>({
  title:info.title,project:info.project.name,engine:String(info.project.use.browserName??'chromium'),worker:info.workerIndex,retry:info.retry,
  register:id=>info.annotations.push({type:'n1-context',description:id}),
});
export const test=base.extend<Fixtures>({
  networkRules:[[],{option:true}],
  context:async({context,networkRules,contextOptions,javaScriptEnabled,serviceWorkers,proxy,launchOptions},use,info)=>{
    validateContextOptions(contextOptions);
    validateContextOptions({serviceWorkers,proxy:proxy??launchOptions.proxy});
    const guard=await attachGuard(context,networkRules,{...identity(info),contextOptions:{...contextOptions,javaScriptEnabled,serviceWorkers}});
    attached.set(context,guard);
    try {await use(context);}
    finally {await guard.finish(info.status==='passed'?'passed':'failed');}
  },
  network:[async({context},use)=>{
    const guard=attached.get(context);if(!guard) throw new Error('N1_FIXTURE_SETUP');await use(guard);
  },{auto:true}],
  makeGuard:async({browser,network,contextOptions,viewport,colorScheme,javaScriptEnabled,actionTimeout,navigationTimeout},use,info)=>{
    void network; // Automatic parent lifecycle is required even for manual contexts.
    const children:GuardedContext[]=[];
    await use(async(rules,extra={})=>{
      const guard=await createGuardedContext(browser,rules,{...identity(info),...extra,contextOptions:{...contextOptions,viewport,colorScheme,javaScriptEnabled,...extra.contextOptions}});
      guard.context.setDefaultTimeout(actionTimeout);
      guard.context.setDefaultNavigationTimeout(navigationTimeout);
      children.push(guard);return guard;
    });
    const results=await Promise.allSettled(children.filter(g=>!g.finished).map(g=>g.finish(info.status==='passed'?'passed':'failed')));
    const rejected=results.filter((r):r is PromiseRejectedResult=>r.status==='rejected');
    if(rejected.length) throw new AggregateError(rejected.map(r=>r.reason),'N1_CONTEXT_TEARDOWN');
  },
});
// Local to consumers of this exported fixture, not the legacy test population.
test.use({serviceWorkers:'block'});
export { expect } from '@playwright/test';
