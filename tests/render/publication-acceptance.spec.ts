import {test,expect,FIXTURE_ORIGIN} from '../helpers/isolated-test.ts';
import {guardedAxe} from '../helpers/guarded-axe.ts';
const origin=FIXTURE_ORIGIN;const prefix='https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/';
type ShiftSample={startTime:number;value:number;hadRecentInput:boolean};
type InteractionSample={type:string;target:string;startTime:number;duration:number};
type SyntheticObservation={installedAt:number;layoutShiftSupported:boolean;unsupportedReason:string|null;shifts:ShiftSample[];interactions:InteractionSample[];snapshot:()=>{installedAt:number;layoutShiftSupported:boolean;unsupportedReason:string|null;shifts:ShiftSample[];interactions:InteractionSample[];rawShiftSum:number;inputExcludedShiftSum:number}};
declare global{interface Window{fcdSynthetic:SyntheticObservation}}
// Test-only instrumentation: installed BEFORE navigation, never bundled into the Blogger theme.
function installObservations(){
 const supported=typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes.includes('layout-shift');
 const shifts:ShiftSample[]=[];const interactions:InteractionSample[]=[];let observer:PerformanceObserver|undefined;
 const collect=(entries:PerformanceEntry[])=>{for(const entry of entries){const e=entry as PerformanceEntry&{value:number;hadRecentInput:boolean};if(shifts.length<500)shifts.push({startTime:e.startTime,value:e.value,hadRecentInput:e.hadRecentInput});}};
 const state:SyntheticObservation={installedAt:performance.now(),layoutShiftSupported:supported,unsupportedReason:supported?null:'layout-shift PerformanceObserver entries are not supported by this engine',shifts,interactions,snapshot(){if(observer)collect(observer.takeRecords());return {installedAt:this.installedAt,layoutShiftSupported:this.layoutShiftSupported,unsupportedReason:this.unsupportedReason,shifts:[...shifts],interactions:[...interactions],rawShiftSum:shifts.reduce((n,e)=>n+e.value,0),inputExcludedShiftSum:shifts.filter(e=>!e.hadRecentInput).reduce((n,e)=>n+e.value,0)};}};
 if(supported){observer=new PerformanceObserver(list=>collect(list.getEntries()));observer.observe({type:'layout-shift',buffered:true});}
 for(const type of ['input','click'])document.addEventListener(type,event=>{
  const target=event.target;if(!(target instanceof HTMLElement)||!target.matches('#search-query,.clear-filter,#theme-toggle'))return;
  const startTime=performance.now();const name=target.id||target.className;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(interactions.length<100)interactions.push({type,target:name,startTime,duration:performance.now()-startTime});}));
 },true);
 window.fcdSynthetic=state;
}
test('catalog navigation, filtering, focus and image dimensions survive all engines',async({page,network},info)=>{
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));await page.goto('/');await expect(page.locator('.post-card')).toHaveCount(4);await page.keyboard.press('/');await expect(page.locator('#search-query')).toBeFocused();await page.locator('#search-query').fill('incident');await expect(page.locator('.post-card:visible')).toHaveCount(1);await page.getByRole('button',{name:'Clear filter'}).click();await expect(page.locator('#search-query')).toBeFocused();await expect(page.locator('.post-card:visible')).toHaveCount(4);
 const hrefs=await page.locator('.post-card h2 a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));expect(new Set(hrefs).size).toBe(4);for(const image of await page.locator('.card-image img').all()){await expect(image).toHaveAttribute('width','800');await expect(image).toHaveAttribute('height','450');}
 await page.locator('#theme-toggle').click();const scan=await guardedAxe(network,page).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();expect(scan.violations).toEqual([]);await info.attach('cross-engine-axe',{body:JSON.stringify(scan),contentType:'application/json'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:info.outputPath('catalog.png'),fullPage:true});
 await page.locator('#search-query').fill('cloud');await page.locator('#search-query').press('Enter');await expect(page).toHaveURL(/\/search\?q=cloud/);await info.attach('requests',{body:JSON.stringify(requests),contentType:'application/json'});
});
test('article discovery, copy success/failure and print remain usable',async({page},info)=>{
 await page.goto('/article');await expect(page.locator('[data-related-list] a')).toHaveCount(1);await expect(page.locator('.related-fallback')).toBeVisible();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{document.documentElement.dataset.copy=text;}}}));await page.getByRole('button',{name:'Copy bash code',exact:true}).click();expect(await page.locator('html').getAttribute('data-copy')).toBe(await page.locator('code.language-bash').textContent());
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));await page.getByRole('button',{name:'Copy bash code',exact:true}).click();await expect(page.locator('#fcd-status')).toContainText('Copy unavailable');
 await page.locator('.article-toc summary').click();await page.locator('.article-toc a').first().click();await expect(page.locator('#article-body h2').first()).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.emulateMedia({media:'print'});await expect(page.locator('.site-header')).toBeHidden();await expect(page.locator('.related-articles')).toBeHidden();await expect(page.locator('#article-body')).toBeVisible();await page.screenshot({path:info.outputPath('print.png'),fullPage:true});
});
test('fallback, menu escape and no-JS enlarged text retain native navigation',async({page,secondaryPage},info)=>{
 await page.goto('/article');await expect(page.getByRole('button',{name:'Retry publications'})).toHaveCount(2);await expect(page.locator('.related-fallback')).toBeVisible();
 if((info.project.use.viewport?.width||1280)<640){await page.locator('#menu-toggle').click();await page.locator('#search-query').focus();await page.keyboard.press('Escape');await expect(page.locator('#menu-toggle')).toBeFocused();await expect(page.locator('#primary-navigation')).toBeHidden();}
 const p=await secondaryPage();await p.goto(origin+'/article');await expect(p.locator('.related-fallback')).toBeVisible();await expect(p.locator('form[role="search"]')).toBeVisible();expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('actual pinned Mermaid renders and preserves source when blocked',async({page,network},info)=>{
 let bytes=0;const libraryReads:Promise<void>[]=[];const readErrors:unknown[]=[];
 page.on('response',response=>{if(response.url().startsWith(prefix))libraryReads.push(response.body().then(body=>{bytes+=body.length;},error=>{readErrors.push(error);}));});
 await page.goto('/technical');await expect(page.locator('.fcd-diagram')).toHaveAttribute('data-state','rendered',{timeout:30000});await expect(page.locator('.diagram-output svg')).toHaveCount(1);const source=await page.locator('.diagram-source pre').textContent();await page.locator('#theme-toggle').click();const theme=await page.locator('html').getAttribute('data-theme');await expect(page.locator('.fcd-diagram')).toHaveAttribute('data-rendered-theme',theme!,{timeout:30000});await expect(page.locator('.fcd-diagram')).toHaveAttribute('data-state','rendered');expect(await page.locator('.diagram-source pre').textContent()).toBe(source);await Promise.all(libraryReads);expect(readErrors).toEqual([]);await info.attach('real-library-bytes',{body:JSON.stringify({bytes}),contentType:'application/json'});
 network.transition('blocked');await page.reload();await expect(page.locator('.fcd-diagram')).toHaveAttribute('data-state','error',{timeout:20000});await expect(page.locator('.diagram-source pre')).toBeVisible();expect(await page.locator('.diagram-source pre').textContent()).toBe(source);
});
test('records controlled feed/image completion shifts and filter-to-frame interactions',async({page,browserName,network},info)=>{
 await page.addInitScript(installObservations);
 let feedRequests=0,imageRequests=0;
 page.on('request',request=>{const url=new URL(request.url());if(url.origin!==origin)return;if(url.pathname==='/feeds/posts/default')feedRequests++;if(url.pathname==='/profile-image.svg')imageRequests++;});
 await page.goto('/profile',{waitUntil:'domcontentloaded'});await expect.poll(()=>feedRequests).toBe(1);await expect.poll(()=>imageRequests).toBeGreaterThan(0);
 await expect.poll(()=>network.pendingGate('completion')===feedRequests+imageRequests).toBe(true);
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 const before=await page.evaluate(()=>window.fcdSynthetic.snapshot());network.releaseGate('completion');
 await expect(page.locator('#recent-posts a')).toHaveCount(1);for(const image of await page.locator('.card-image img').all()){await image.scrollIntoViewIfNeeded();await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).complete&&(el as HTMLImageElement).naturalWidth>0)).toBe(true);}
 await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));const completion=await page.evaluate(()=>window.fcdSynthetic.snapshot());
 await page.keyboard.press('/');await page.locator('#search-query').fill('incident');await expect(page.locator('.post-card:visible')).toHaveCount(1);await expect.poll(()=>page.evaluate(()=>window.fcdSynthetic.interactions.filter(e=>e.type==='input').length)).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Clear filter'}).click();await expect(page.locator('.post-card:visible')).toHaveCount(4);await expect.poll(()=>page.evaluate(()=>window.fcdSynthetic.interactions.filter(e=>e.target==='clear-filter').length)).toBeGreaterThan(0);
 const final=await page.evaluate(()=>window.fcdSynthetic.snapshot());if(browserName==='chromium')expect(final.layoutShiftSupported).toBe(true);if(!final.layoutShiftSupported)expect(final.unsupportedReason).toBeTruthy();
 expect(final.interactions.every(e=>Number.isFinite(e.duration)&&e.duration>0)).toBe(true);expect(final.installedAt).toBeLessThan(final.interactions[0].startTime);
 await info.attach('synthetic-performance-observations',{body:JSON.stringify({profile:{browserName,project:info.project.name,viewport:info.project.use.viewport,network:'local intercepted fixed SVG + one feed, barrier released after initial frames',cpu:'runner default; no throttling',interactionMethod:'captured DOM input/click handler to second requestAnimationFrame; not INP',shiftMethod:'raw LayoutShift entries and input-excluded sum; not session-window CLS or field p75'},feedRequests,imageRequests,before,completion,final},null,2),contentType:'application/json'});
 // Guard teardown settles any unreleased waiter while retaining the failure.
});
test('layout-shift recorder detects a deliberate displacement control',async({page,browserName},info)=>{
 await page.addInitScript(installObservations);
 await page.goto('/shift-control');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));const before=await page.evaluate(()=>window.fcdSynthetic.snapshot());
 await page.locator('#spacer').evaluate(el=>(el as HTMLElement).style.height='120px');await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
 if(browserName==='chromium')expect(before.layoutShiftSupported).toBe(true);
 if(before.layoutShiftSupported)await expect.poll(()=>page.evaluate(()=>window.fcdSynthetic.snapshot().rawShiftSum)).toBeGreaterThan(before.rawShiftSum);else expect(before.unsupportedReason).toBeTruthy();
 await info.attach('layout-shift-detection-control',{body:JSON.stringify({control:'120px spacer expansion after initial layout; not a production performance sample',before,after:await page.evaluate(()=>window.fcdSynthetic.snapshot())},null,2),contentType:'application/json'});
});
