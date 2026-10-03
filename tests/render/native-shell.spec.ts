import { test, expect, FIXTURE_ORIGIN } from '../helpers/isolated-test.ts';
import { guardedAxe } from '../helpers/guarded-axe.ts';
import type { Page } from '@playwright/test';

// L1 native-shell regressions (FCD-L1-SHELL-CONTRACT-v1, M1 to M7 and S1 to S4).
// The native-* views are representative models of saved Blogger gadgets from
// fixtures/native-gadgets.pug. They are simulations, not Blogger-rendered output.
// Assertion messages carry N1L_* reason codes so the existing bounded failure
// inventory can report which contract criterion failed. They are not guard codes.
const observed=`${FIXTURE_ORIGIN}/native-observed`,archive=`${FIXTURE_ORIGIN}/native-empty-archive`;
const tags=['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'];
const gadgetIds=['BlogSearch1','Attribution1','ReportAbuse1','Profile1'];
interface Box {x:number;y:number;width:number;height:number}
const middle=(b:Box)=>b.y+b.height/2;
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
async function box(page:Page,selector:string):Promise<Box>{
  const value=await page.locator(selector).boundingBox();
  expect(value,`N1L_MISSING_BOX ${selector}`).not.toBeNull();
  return value!;
}
async function load(page:Page,address:string,javascript=true):Promise<void>{
  const response=await page.goto(address);expect(response?.status()).toBe(200);
  // Wait for the bounded recent-posts request so exact request counts stay deterministic.
  if(javascript)await expect(page.locator('#recent-status')).toContainText('No recent posts');
}
async function gadgets(page:Page){
  return page.evaluate(()=>{
    const header=document.querySelector('#header');
    if(!header)throw new Error('N1L_MISSING_HEADER_SECTION');
    const rect=(el:Element)=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
    const size=(el:Element)=>parseFloat(getComputedStyle(el).fontSize);
    const direct=(el:Element)=>Array.from(el.childNodes).some(n=>n.nodeType===Node.TEXT_NODE&&(n.textContent??'').trim()!=='');
    return {
      body:size(document.body),
      items:Array.from(header.children).filter(el=>el.classList.contains('widget')&&el.id!=='Header1').map(el=>({
        id:el.id,box:rect(el),
        text:Array.from(el.querySelectorAll('*')).filter(n=>n.getClientRects().length>0&&(direct(n)||n.matches('input,button'))).map(n=>({tag:n.tagName.toLowerCase(),size:size(n)})),
        media:Array.from(el.querySelectorAll('img,svg')).filter(n=>!n.parentElement?.closest('svg')).map(n=>({tag:n.tagName.toLowerCase(),...rect(n)})),
        headings:Array.from(el.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(size),
      })),
    };
  });
}
test('observed saved gadgets keep the brand row intact',async({page},info)=>{
  const width=page.viewportSize()!.width;
  await load(page,observed);
  expect.soft(await page.locator('#Header1 .brand-row').count(),'N1L_BRAND_ROW_MISSING').toBe(1);
  const brand=await box(page,'#Header1 .brand'),header1=await box(page,'#Header1');
  for(const selector of ['#theme-toggle',...(width<640?['#menu-toggle']:[])]){
    await expect(page.locator(selector)).toBeVisible();
    const control=await box(page,selector),offset=Math.abs(middle(control)-middle(brand));
    expect.soft(overlaps(control,brand),`N1L_CONTROL_OVERLAPS_BRAND ${selector}`).toBe(false);
    if(width>=360)expect.soft(offset,`N1L_CONTROL_CENTER ${selector} offset ${offset}px`).toBeLessThanOrEqual(4);
    else expect.soft(offset<=4||control.y>=brand.y+brand.height-1,`N1L_CONTROL_WRAP ${selector} offset ${offset}px`).toBe(true);
  }
  const shell=await gadgets(page);
  expect(shell.items.map(item=>item.id),'N1L_GADGET_MODEL').toEqual(gadgetIds);
  for(const item of shell.items){
    expect.soft(item.box.height,`N1L_GADGET_HIDDEN ${item.id}`).toBeGreaterThan(0);
    expect.soft(item.box.y,`N1L_GADGET_ABOVE_BRAND_ROW ${item.id}`).toBeGreaterThanOrEqual(header1.y+header1.height-1);
    for(const text of item.text)expect.soft(text.size,`N1L_GADGET_TEXT ${item.id} ${text.tag}`).toBeLessThanOrEqual(14.01);
    for(const heading of item.headings)expect.soft(heading,`N1L_GADGET_HEADING ${item.id}`).toBeLessThanOrEqual(shell.body+0.01);
    for(const media of item.media){
      expect.soft(media.width,`N1L_GADGET_MEDIA ${item.id} ${media.tag} width`).toBeLessThanOrEqual(32.01);
      expect.soft(media.height,`N1L_GADGET_MEDIA ${item.id} ${media.tag} height`).toBeLessThanOrEqual(32.01);
    }
  }
  const header=await box(page,'.site-header'),limit=width>=1024?300:width>=640?360:400;
  expect.soft(header.height,`N1L_HEADER_HEIGHT ${header.height}px at ${width}px`).toBeLessThanOrEqual(limit);
  expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'N1L_OVERFLOW').toBe(true);
  await page.screenshot({path:info.outputPath('native-observed.png'),fullPage:true});
  await load(page,archive);
  await expect(page.locator('#header > .widget')).toHaveCount(1);
  const clean=await box(page,'#Header1');
  expect.soft(clean.height,`N1L_CLEAN_BRAND_ROW_HEIGHT ${clean.height}px`).toBeLessThanOrEqual(96);
  await page.screenshot({path:info.outputPath('native-empty-archive.png'),fullPage:true});
});
test('observed saved gadgets keep keyboard order and visible focus',async({page})=>{
  await load(page,observed);
  const menu=await page.locator('#menu-toggle').isVisible(),navigation=await page.locator('#primary-navigation').isVisible();
  const order:{kind:string;id:string;box:Box;indicator:boolean}[]=[];
  for(let i=0;i<48;i++){
    await page.keyboard.press('Tab');
    const item=await page.evaluate(()=>{
      const el=document.activeElement as HTMLElement|null;
      if(!el||el===document.body)return null;
      const r=el.getBoundingClientRect(),style=getComputedStyle(el);
      const kind=el.matches('.skip-link')?'skip':el.matches('#Header1 .brand')?'brand':el.id==='theme-toggle'?'theme':el.id==='menu-toggle'?'menu':
        el.closest('#header > .widget:not(#Header1)')?'gadget':el.id==='search-query'?'search':el.closest('#primary-navigation')?'navigation':'other';
      return {kind,id:el.id||el.tagName.toLowerCase(),box:{x:r.x,y:r.y,width:r.width,height:r.height},indicator:style.outlineStyle!=='none'&&parseFloat(style.outlineWidth)>0||style.boxShadow!=='none'};
    });
    if(!item)continue;
    order.push(item);
    if(item.kind==='search'||item.kind==='other')break;
  }
  const kinds=order.map(item=>item.kind).filter((kind,i,all)=>i===0||all[i-1]!==kind);
  expect.soft(kinds,'N1L_FOCUS_ORDER').toEqual(['skip','brand','theme',...(menu?['menu']:[]),'gadget',...(navigation?['navigation','search']:['other'])]);
  const targets=order.filter(item=>item.kind!=='other');
  for(const item of targets){
    expect.soft(item.box.width>0&&item.box.height>0,`N1L_FOCUS_AREA ${item.id}`).toBe(true);
    expect.soft(item.indicator,`N1L_FOCUS_INDICATOR ${item.id}`).toBe(true);
  }
  // WCAG 2.5.8: at least 24 by 24 CSS px, or the undersized-target spacing exception.
  for(const item of targets.filter(t=>t.kind!=='skip')){
    const b=item.box;if(b.width>=24&&b.height>=24)continue;
    const cx=b.x+b.width/2,cy=b.y+b.height/2;
    const spaced=targets.filter(t=>t!==item&&t.kind!=='skip').every(other=>{
      const o=other.box,dx=Math.max(o.x-cx,0,cx-(o.x+o.width)),dy=Math.max(o.y-cy,0,cy-(o.y+o.height));
      if(Math.hypot(dx,dy)<12)return false;
      return o.width>=24&&o.height>=24||Math.hypot(o.x+o.width/2-cx,o.y+o.height/2-cy)>=24;
    });
    expect.soft(spaced,`N1L_TARGET_SIZE ${item.id} ${Math.round(b.width)}x${Math.round(b.height)}`).toBe(true);
  }
});
test('empty native sidebar sections render no chrome',async({page})=>{
  for(const address of [observed,archive]){
    await load(page,address);
    await expect(page.locator('.sidebar .sidebar-panel')).toHaveCount(2);
    await expect(page.locator('#sidebar')).toHaveCount(1);
    const result=await page.locator('#sidebar').evaluate(root=>{
      const chrome:string[]=[];
      for(const el of [root,...Array.from(root.querySelectorAll('*'))]){
        if(el.getClientRects().length===0)continue;
        const s=getComputedStyle(el),name=el.id||el.className||el.tagName;
        if(['top','right','bottom','left'].some(side=>s.getPropertyValue(`border-${side}-style`)!=='none'&&parseFloat(s.getPropertyValue(`border-${side}-width`))>0))chrome.push(`${name}:border`);
        if(!['rgba(0, 0, 0, 0)','transparent'].includes(s.backgroundColor)||s.backgroundImage!=='none')chrome.push(`${name}:background`);
        if(s.boxShadow!=='none')chrome.push(`${name}:shadow`);
        if(['top','right','bottom','left'].some(side=>parseFloat(s.getPropertyValue(`padding-${side}`))>0))chrome.push(`${name}:padding`);
      }
      return {chrome,height:root.getBoundingClientRect().height,text:(root as HTMLElement).innerText.trim()};
    });
    const view=address===observed?'no-items':'empty-archive';
    expect.soft(result.chrome,`N1L_SIDEBAR_CHROME ${view}`).toEqual([]);
    expect.soft(result.height,`N1L_SIDEBAR_HEIGHT ${view} ${result.height}px`).toBeLessThanOrEqual(1);
    expect.soft(result.text,`N1L_SIDEBAR_TEXT ${view}`).toBe('');
  }
});
test.describe(()=>{
  test.use({javaScriptEnabled:false});
  test('native shell core survives theme JavaScript disabled',async({page})=>{
    for(const address of [observed,archive]){
      await load(page,address,false);
      await expect(page.locator('#Header1 .brand')).toBeVisible();
      await expect(page.locator('#theme-toggle')).toBeHidden();await expect(page.locator('#menu-toggle')).toBeHidden();
      await expect(page.locator('#primary-navigation')).toBeVisible();await expect(page.locator('#site-search[role="search"]')).toBeVisible();
      const row=await box(page,'.site-header > .header-row'),shell=await gadgets(page);
      expect(shell.items.map(item=>item.id),'N1L_GADGET_MODEL').toEqual(address===observed?gadgetIds:[]);
      for(const item of shell.items){
        expect.soft(item.box.height,`N1L_GADGET_HIDDEN ${item.id}`).toBeGreaterThan(0);
        expect.soft(item.box.x>=row.x-1&&item.box.x+item.box.width<=row.x+row.width+1,`N1L_GADGET_CONTAINMENT ${item.id}`).toBe(true);
        for(const media of item.media)expect.soft(Math.max(media.width,media.height),`N1L_GADGET_MEDIA ${item.id} ${media.tag}`).toBeLessThanOrEqual(32.01);
      }
      expect.soft(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'N1L_OVERFLOW').toBe(true);
    }
  });
});
test('native shell states have no WCAG A/AA axe violations',async({page,network},info)=>{
  for(const [name,address] of [['observed',observed],['empty-archive',archive]] as const){
    await load(page,address);
    const result=await guardedAxe(network,page).withTags(tags).analyze();
    // Bounded attachment: every violation and incomplete check, without the passes list.
    await info.attach(`axe-native-shell-${name}`,{body:JSON.stringify({url:result.url,testEngine:result.testEngine,violations:result.violations,incomplete:result.incomplete}),contentType:'application/json'});
    expect.soft(result.violations,`N1L_AXE ${name}`).toEqual([]);
  }
});
