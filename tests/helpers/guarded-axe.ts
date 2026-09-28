import AxeBuilder from '@axe-core/playwright';
import type { Page, BrowserContext } from '@playwright/test';
import type { AxeLease, GuardedContext } from './browser-network.ts';

/** A public dependency facade, never a global/prototype or private API patch. */
function facade<T extends object>(target:T,overrides:Partial<T>):T {
  return new Proxy(target,{get(object,key){const owner=Object.hasOwn(overrides,key)?overrides:object;const value:unknown=Reflect.get(owner,key,owner);return typeof value==='function'?value.bind(owner):value;}});
}
/** Normal pinned AxeBuilder, including full frames/results and fluent chaining.
 * Only aggregation creation/close are delegated to an exact guard-owned lease.
 * The outer cleanup also covers axe setup failures before its own finally.
 */
export function guardedAxe(guard:GuardedContext,page:Page):AxeBuilder {
  let lease:AxeLease|undefined,running=false;
  const context=facade<BrowserContext>(page.context(),{newPage:async()=>{
    if(!lease)throw new Error('N2A_AXE_NO_LEASE');
    const owner=lease,auxiliary=await owner.newPage();
    return facade<Page>(auxiliary,{close:options=>owner.close(auxiliary,options)});
  }});
  const source=facade<Page>(page,{context:()=>context});
  const builder=new AxeBuilder({page:source});
  const proxy=new Proxy(builder,{get(target,key){
    if(key==='analyze')return async()=>{
      if(running)throw new Error('N2A_AXE_CONCURRENT_SCAN');
      running=true;let result:Awaited<ReturnType<AxeBuilder['analyze']>>|undefined,scanError:unknown,cleanupError:unknown;
      try{lease=guard.beginAxe(page);result=await target.analyze();}
      catch(cause){scanError=cause;}
      finally{
        if(lease)try{await lease.complete(scanError?'failed':'passed');}catch(cause){cleanupError=cause;}
        lease=undefined;running=false;
      }
      if(scanError&&cleanupError)throw new AggregateError([scanError,cleanupError],'N2A_AXE_SCAN_AND_CLEANUP',{cause:scanError});
      if(scanError)throw scanError;if(cleanupError)throw cleanupError;
      if(!result)throw new Error('N2A_AXE_MISSING_RESULT');return result;
    };
    // Legacy mode bypasses the required aggregation/frame coverage contract.
    if(key==='setLegacyMode')return ()=>{throw new Error('N2A_AXE_LEGACY_FORBIDDEN');};
    const value:unknown=Reflect.get(target,key,target);
    if(typeof value!=='function')return value;
    return (...args:unknown[])=>{const result:unknown=Reflect.apply(value,target,args);return result===target?proxy:result;};
  }});
  return proxy;
}
