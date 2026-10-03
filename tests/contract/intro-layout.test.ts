import { afterAll, beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { chromium, type Browser } from 'playwright-core';

// L2-intro (design v1): the shipped b:skin CSS applied to the shared home fixture without theme
// JavaScript. The fixture models the Intro gadget's default copy from the shared mixin; contract C7
// pins the production gadget and headline. Blogger rendering of the Intro gadget stays a native checkpoint.
const pug=createRequire(import.meta.url)('pug') as {renderFile(file:string,options:Record<string,unknown>):string};
const xml=readFileSync('dist/theme.xml','utf8');
const css=/<b:skin\b[^>]*>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/b:skin>/.exec(xml)?.[1]??'';
const bandRule='.is-home-lead .intro-band{background:var(--ink);color:var(--on-ink);border-image-source:linear-gradient(var(--ink) calc(100% - 1px),var(--ink-edge) 0);border-image-slice:0 fill;border-image-outset:0 100vw}';
const ink=[15,28,51];
const render=(view:string,styles=css)=>pug.renderFile('fixtures/home.pug',{css:styles,script:'',pretty:true,fixtureView:view});
// RGB of a 1x1 screenshot. With no left or upper neighbour every PNG filter leaves bytes 1-3 unchanged.
function pixel(png:Buffer){
  const data:Buffer[]=[];
  for(let at=8;at<png.length;){const length=png.readUInt32BE(at);if(png.toString('ascii',at+4,at+8)==='IDAT')data.push(png.subarray(at+8,at+8+length));at+=12+length;}
  const row=inflateSync(Buffer.concat(data));return [row[1],row[2],row[3]];
}
let browser:Browser;
beforeAll(async()=>{browser=await chromium.launch();});
afterAll(async()=>{await browser?.close();});
async function measure(view:string,width:number,styles=css){
  const page=await browser.newPage({viewport:{width,height:900}});
  try{
    await page.setContent(render(view,styles));
    const result=await page.evaluate(()=>{
      const band=document.querySelector('.intro-band');if(!band)throw new Error('N1L_INTRO_MISSING .intro-band');
      const r=band.getBoundingClientRect();
      return {
        band:{y:r.y,height:r.height,bottom:r.bottom,background:getComputedStyle(band).backgroundColor},
        hero:!!document.querySelector('.intro-hero'),
        h1s:Array.from(document.querySelectorAll('h1'),h=>({text:(h.textContent??'').trim(),hero:!!h.closest('.intro-hero'),color:getComputedStyle(h).color})),
        copy:(document.querySelector('#HTML1 .intro-body')?.textContent??'').trim(),
        pills:Array.from(band.querySelectorAll('.topic-pill'),a=>({bottom:a.getBoundingClientRect().bottom,color:getComputedStyle(a).color})),
        overflow:document.documentElement.scrollWidth>innerWidth+1,
      };
    });
    // x=2 lies outside the centred container, so ink there proves the band bleeds to the viewport edge.
    const edge=pixel(await page.screenshot({clip:{x:2,y:Math.round(result.band.y+result.band.height/2),width:1,height:1},animations:'disabled'}));
    return {...result,edge};
  }finally{await page.close();}
}
for(const width of [1280,390])it(`first home page opens with the full-bleed intro band at ${width}px`,async()=>{
  const view=await measure('home',width);
  expect(view.h1s,'N1L_INTRO_ONE_H1').toEqual([{text:'Security knowledge. Practical defense.',hero:true,color:'rgb(255, 255, 255)'}]);
  expect(view.band.background,'N1L_INTRO_INK').toBe('rgb(15, 28, 51)');
  expect(view.edge,'N1L_INTRO_FULL_BLEED').toEqual(ink);
  expect(view.copy,'N1L_INTRO_COPY').toBe('Research, threat insights, and guidance for stronger security.');
  expect(view.pills.length,'N1L_INTRO_TOPICS').toBeGreaterThan(0);
  for(const pill of view.pills){
    expect(pill.bottom,'N1L_INTRO_TOPICS inside the band').toBeLessThanOrEqual(view.band.bottom+0.5);
    expect(pill.color,'N1L_INTRO_TOPIC_TEXT').toBe('rgb(234, 242, 251)');
  }
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
},25000);
it('other multi-item views keep the plain publication heading and Topics',async()=>{
  const view=await measure('paged',1280);
  expect(view.hero,'N1L_INTRO_HOME_ONLY').toBe(false);
  expect(view.h1s.map(h=>h.text),'N1L_INTRO_ONE_H1').toEqual(['Latest articles']);
  expect(view.band.background,'N1L_INTRO_PLAIN').toBe('rgba(0, 0, 0, 0)');
  expect(view.edge,'N1L_INTRO_PLAIN').not.toEqual(ink);
  expect(view.overflow,'N1L_OVERFLOW').toBe(false);
},25000);
it('negative control: without the shipped band rule the intro loses its ink band',async()=>{
  expect(css,'N1L_INTRO_RULE').toContain(bandRule);
  const view=await measure('home',1280,css.replace(bandRule,''));
  expect(view.band.background).toBe('rgba(0, 0, 0, 0)');expect(view.edge).not.toEqual(ink);
},25000);
