import { afterAll, beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';

// Design tokens and components (design v1): the shipped b:skin CSS applied to the shared fixtures
// without theme JavaScript. Covers the signal line under the masthead's top edge, the brand mark,
// card chrome and its hover lift, the mono advisory strip and the sidebar card voice. CSS only: no
// markup, section or widget changes, so no contract check is needed.
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
// The shipped signal-line rule is found by selector and property, not by the compiler's exact spelling.
const signalRules=(css.match(/\.site-header::before\s*\{[^}]*\}/g)??[]).filter(rule=>/height:\s*3px/.test(rule));
const mono=/^"?Fira Code"?,\s*ui-monospace/;
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
type Options={styles?:string,colorScheme?:'light'|'dark',reducedMotion?:'reduce'|'no-preference',hover?:boolean};
async function measure(file:string,width:number,options:Options={}){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:options.colorScheme??'light',reducedMotion:options.reducedMotion??'no-preference'});
  try{
    await page.setContent(pug.renderFile(file,{css:options.styles??css,script:'',pretty:true}));
    if(options.hover){await page.hover('.post-card[data-editorial-role="secondary"] .post-title a');await page.waitForTimeout(450);}
    return await page.evaluate(()=>{
      const header=document.querySelector('header.site-header');
      if(!header)throw new Error('N1L_COMPONENTS_MISSING site header');
      const probe=(name:string)=>{const d=document.createElement('div');d.style.color=`var(${name})`;document.body.append(d);const c=getComputedStyle(d).color;d.remove();return c;};
      const line=getComputedStyle(header,'::before');
      const mark=document.querySelector('.brand-monogram'),markStyle=mark?getComputedStyle(mark):null,markBox=mark?.getBoundingClientRect();
      const strip=(root:string)=>{const el=document.querySelector(root);return el?Array.from(el.querySelectorAll('.post-labels a')).map(a=>{const s=getComputedStyle(a);return {name:(a.textContent??'').trim(),family:s.fontFamily,transform:s.textTransform,size:s.fontSize,color:s.color,after:getComputedStyle(a,'::after').content};}):[];};
      return {
        tokens:{brand:probe('--brand'),border:probe('--border'),soft:probe('--soft-border'),mark:probe('--mark'),primary:probe('--primary'),muted:probe('--muted-text')},
        headerBorder:getComputedStyle(header).borderTopWidth,
        line:{height:line.height,color:line.backgroundColor,image:line.backgroundImage,animation:line.animationName},
        mark:mark&&markStyle&&markBox?{display:markStyle.display,width:markBox.width,height:markBox.height,background:markStyle.backgroundColor,color:markStyle.color,radius:markStyle.borderTopLeftRadius}:null,
        cards:Array.from(document.querySelectorAll('.post-card')).map(c=>{const s=getComputedStyle(c);return {role:c.getAttribute('data-editorial-role'),radius:s.borderTopLeftRadius,side:s.borderRightColor,top:s.borderTopWidth,topColor:s.borderTopColor,transform:s.transform};}),
        cardStrip:strip('.post-card'),articleStrip:strip('.article-header'),
        panels:Array.from(document.querySelectorAll('.sidebar-panel')).map(p=>{const s=getComputedStyle(p),h=p.querySelector('h2'),hs=h?getComputedStyle(h):null;return {radius:s.borderTopLeftRadius,side:s.borderRightColor,padding:s.paddingTop,heading:hs?{family:hs.fontFamily,transform:hs.textTransform,size:hs.fontSize,color:hs.color}:null};}),
        overflow:document.documentElement.scrollWidth>innerWidth+1,
      };
    });
  }finally{await page.close();}
}
type View=Awaited<ReturnType<typeof measure>>;
function common(view:View){
  expect([view.headerBorder,view.line.height],'N1L_SIGNAL_LINE').toEqual(['0px','3px']);
  expect(view.line.color,'N1L_SIGNAL_LINE').toBe(view.tokens.brand);
  expect(view.line.image,'N1L_SIGNAL_LINE').toContain('linear-gradient');
  expect(view.panels.length,'N1L_PANEL').toBe(2);
  for(const panel of view.panels){
    expect([panel.radius,panel.side,panel.padding],'N1L_PANEL').toEqual(['14px',view.tokens.soft,'22px']);
    expect(panel.heading?.family,'N1L_PANEL_VOICE').toMatch(mono);
    expect([panel.heading?.transform,panel.heading?.size,panel.heading?.color],'N1L_PANEL_VOICE').toEqual(['uppercase','14px',view.tokens.muted]);
  }
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
}
function advisoryStrip(items:View['cardStrip'],view:View){
  expect(items.map(item=>item.name),'N1L_STRIP').toEqual(['Cloud Security','Research']);
  for(const item of items){
    expect(item.family,'N1L_STRIP').toMatch(mono);
    expect([item.transform,item.size,item.color],'N1L_STRIP').toEqual(['uppercase','14px',view.tokens.primary]);
  }
  expect(items[0].after,'N1L_STRIP_SEPARATOR').toContain('/');
  expect(items[1].after,'N1L_STRIP_SEPARATOR').toBe('none');
}
it('home at 1280px: signal line, brand mark, card chrome with a hover lift and the advisory strip',async()=>{
  const view=await measure('fixtures/home.pug',1280,{hover:true});common(view);
  expect([view.tokens.soft,view.tokens.mark],'N1L_TOKENS').toEqual(['rgb(216, 226, 238)','rgb(26, 42, 72)']);
  expect(view.line.animation,'N1L_SIGNAL_SWEEP').toBe('fcd-sweep');
  expect(view.mark,'N1L_MARK').toEqual({display:'grid',width:44,height:44,background:view.tokens.mark,color:'rgb(255, 255, 255)',radius:'10px'});
  expect(view.cards.map(card=>card.role),'N1L_CARDS').toEqual(['lead','secondary','secondary','standard']);
  for(const card of view.cards)expect(card.radius,'N1L_CARD_CHROME').toBe('14px');
  expect([view.cards[0].side,view.cards[2].side,view.cards[3].side],'N1L_CARD_CHROME').toEqual([view.tokens.soft,view.tokens.soft,view.tokens.soft]);
  expect([view.cards[0].top,view.cards[0].topColor],'N1L_CARD_LEAD').toEqual(['4px',view.tokens.brand]);
  expect([view.cards[1].transform,view.cards[1].side],'N1L_CARD_LIFT').toEqual(['matrix(1, 0, 0, 1, 0, -3)',view.tokens.border]);
  expect(view.cards[2].transform,'N1L_CARD_LIFT').toBe('none');
  advisoryStrip(view.cardStrip,view);
},25000);
it('article at 390px in dark mode: the advisory strip above the title and dark card chrome',async()=>{
  const view=await measure('fixtures/article.pug',390,{colorScheme:'dark'});common(view);
  expect(view.tokens.soft,'N1L_TOKENS').toBe('rgb(45, 61, 90)');
  expect(view.mark?.display,'N1L_MARK').toBe('none');
  expect(view.cards,'N1L_CARDS').toEqual([]);
  advisoryStrip(view.articleStrip,view);
},25000);
it('reduced motion: the signal line stays still and a hovered card does not move',async()=>{
  const view=await measure('fixtures/home.pug',1280,{reducedMotion:'reduce',hover:true});
  expect([view.headerBorder,view.line.height,view.line.animation],'N1L_SIGNAL_STILL').toEqual(['0px','3px','none']);
  expect(view.cards[1].transform,'N1L_CARD_STILL').toBe('none');
},25000);
it('negative control: without the shipped signal-line rule the masthead has no line',async()=>{
  expect(signalRules.length,'N1L_SIGNAL_RULE').toBe(1);
  const view=await measure('fixtures/home.pug',1280,{styles:css.replace(signalRules[0],'')});
  expect(view.line.height).not.toBe('3px');
},25000);
