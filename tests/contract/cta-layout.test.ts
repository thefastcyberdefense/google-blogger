import { afterAll, beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { chromium, type Browser } from 'playwright-core';

// L3-CTA (design v1): the shipped b:skin CSS applied to the shared fixtures without theme JavaScript.
// The fixtures model the Call to Action gadget's default copy from the shared mixin; contract C8 pins
// the production gadget. Blogger rendering of the gadget stays a native checkpoint.
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
// The shipped band rule is found by selector and property, not by the compiler's exact spelling.
const bandRules=(css.match(/\.cta-band\s*\{[^}]*\}/g)??[]).filter(rule=>/background:\s*var\(--elevated\)/.test(rule));
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
async function measure(file:string,width:number,options:{styles?:string,colorScheme?:'light'|'dark',print?:boolean}={}){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:options.colorScheme??'light'});
  try{
    await page.setContent(pug.renderFile(file,{css:options.styles??css,script:'',pretty:true}));
    if(options.print)await page.emulateMedia({media:'print'});
    return await page.evaluate(()=>{
      const bands=document.querySelectorAll('aside.cta-band');const band=bands[0];if(!band)throw new Error('N1L_CTA_MISSING aside.cta-band');
      const button=band.querySelector('a.cta-button'),copy=band.querySelector('.cta-copy');if(!button||!copy)throw new Error('N1L_CTA_MISSING default copy and button');
      const box=(e:Element)=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
      const main=document.querySelector('main#content'),foot=document.querySelector('footer.site-footer');
      const style=getComputedStyle(band),b=getComputedStyle(button);
      return {
        count:bands.length,
        between:!!main&&!!(main.compareDocumentPosition(band)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!foot&&band.nextElementSibling===foot,
        display:style.display,background:style.backgroundColor,band:box(band),copy:box(copy),
        button:{...box(button),background:b.backgroundColor,color:b.color,href:button.getAttribute('href'),text:(button.textContent??'').replace('\u2197','').trim()},
        heading:(copy.querySelector('h2')?.textContent??'').trim(),
        ctaHeadings:Array.from(document.querySelectorAll('h2,h3')).filter(h=>(h.textContent??'').trim()==='Need help securing your organization?').length,
        articleCta:document.querySelectorAll('.article-cta').length,
        overflow:document.documentElement.scrollWidth>innerWidth+1,
        viewport:innerWidth,
      };
    });
  }finally{await page.close();}
}
type View=Awaited<ReturnType<typeof measure>>;
function common(view:View){
  expect(view.count,'N1L_CTA_ONE').toBe(1);
  expect(view.between,'N1L_CTA_ORDER').toBe(true);
  expect(view.background,'N1L_CTA_SURFACE').toBe('rgb(237, 246, 251)');
  expect([view.band.left,view.band.width],'N1L_CTA_FULL_WIDTH').toEqual([0,view.viewport]);
  expect(view.heading,'N1L_CTA_COPY').toBe('Need help securing your organization?');
  expect([view.button.text,view.button.href],'N1L_CTA_BUTTON').toEqual(['Explore FCD services','https://fastcyberdefense.com/']);
  expect([view.button.background,view.button.color],'N1L_CTA_BUTTON_INK').toEqual(['rgb(15, 28, 51)','rgb(255, 255, 255)']);
  expect(view.button.height,'N1L_CTA_TARGET').toBeGreaterThanOrEqual(44);
  expect([view.ctaHeadings,view.articleCta],'N1L_CTA_NO_DUPLICATE').toEqual([1,0]);
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
}
it('home at 1280px: the call to action sits on one row above the footer',async()=>{
  const view=await measure('fixtures/home.pug',1280);common(view);
  expect(view.button.top,'N1L_CTA_ROW').toBeLessThan(view.copy.bottom);
  expect(view.button.left,'N1L_CTA_ROW').toBeGreaterThanOrEqual(view.copy.right);
},25000);
it('article at 390px: one call to action, stacked, with a full-width button',async()=>{
  const view=await measure('fixtures/article.pug',390);common(view);
  expect(view.button.top,'N1L_CTA_STACK').toBeGreaterThanOrEqual(view.copy.bottom-1);
  expect(view.button.width,'N1L_CTA_STACK').toBeGreaterThanOrEqual(view.copy.width-1);
},25000);
it('dark mode swaps the button to the light accent and print drops the band',async()=>{
  const dark=await measure('fixtures/home.pug',1280,{colorScheme:'dark'});
  expect(dark.background,'N1L_CTA_DARK').toBe('rgb(29, 46, 72)');
  expect([dark.button.background,dark.button.color],'N1L_CTA_DARK').toEqual(['rgb(139, 201, 250)','rgb(14, 21, 39)']);
  const print=await measure('fixtures/article.pug',1280,{print:true});
  expect(print.display,'N1L_CTA_PRINT').toBe('none');
},25000);
it('negative control: without the shipped band rule the call to action loses its surface',async()=>{
  expect(bandRules.length,'N1L_CTA_RULE').toBe(1);
  const view=await measure('fixtures/home.pug',1280,{styles:css.replace(bandRules[0],'')});
  expect(view.background).toBe('rgba(0, 0, 0, 0)');
},25000);
