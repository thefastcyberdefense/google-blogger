import { expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { readFileSync, cpSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
const pug = createRequire(import.meta.url)('pug') as {renderFile(file:string, options:Record<string,unknown>):string};
const render = (page:string) => pug.renderFile(`fixtures/${page}.pug`, {css:'',script:'',pretty:true});
it('article fixture carries the production single-item body state', () => {
  const html=render('article'); expect(html).toMatch(/<body[^>]*class="[^"]*is-single/); expect(html).not.toMatch(/<body[^>]*class="[^"]*is-home-lead/);
  const theme=readFileSync('src/theme.pug','utf8'); expect(theme).toContain("cond='data:view.isSingleItem' name='is-single'");
});
it('home fixture models Header1 and Blog1 wrapper boundaries and real images', () => {
  const html=render('home'); for(const value of ['id="Header1"','id="Blog1"','post-outer-container','class="card-image"','srcset=']) expect(html).toContain(value);
});
it('shared production structures match fixture controls and article/card slots', async () => {
  const browser=await chromium.launch();
  try {
    const page=await browser.newPage();
    const result=await page.evaluate(({xml,home,article})=>{
      const parser=new DOMParser(); const prod=parser.parseFromString(xml,'application/xml'); const fixture=parser.parseFromString(home,'text/html'); const single=parser.parseFromString(article,'text/html');
      if(prod.querySelector('parsererror')) throw new Error('Production XML parse failed');
      const b='http://www.google.com/2005/gml/b';
      const signature=(el:Element):unknown[]=>{
        if(el.namespaceURI==='http://www.google.com/2005/gml/data') return [];
        if(el.namespaceURI===b && !['section','widget'].includes(el.localName)) return Array.from(el.children).flatMap(signature);
        const attrs:Record<string,string>={};
        for(const attr of Array.from(el.attributes)) if(['id','class','role','type','for','name','hidden','tabindex','width','height','alt','sizes','loading','fetchpriority','decoding'].includes(attr.name)||attr.name.startsWith('aria-')) attrs[attr.name]=attr.name==='hidden'?'true':attr.value;
        // Compare the lead branch of these two narrowly specified native conditionals.
        if(el.localName==='img'&&el.hasAttribute('expr:loading')){
          if(el.getAttribute('expr:loading')!=='data:fcdEditorialRole == "lead" ? "eager" : "lazy"'||el.getAttribute('expr:fetchpriority')!=='data:fcdEditorialRole == "lead" ? "high" : "auto"')throw new Error('Unexpected native image priority expression');
          attrs.loading='eager';attrs.fetchpriority='high';
        }
        let tag=el.localName;
        if(el.namespaceURI===b){tag='div';delete attrs.type;delete attrs.name;if(el.localName==='widget')attrs.class=`widget ${el.getAttribute('type')}`;}
        return [{tag,attrs:Object.fromEntries(Object.entries(attrs).sort(([a],[z])=>a.localeCompare(z))),children:Array.from(el.children).flatMap(signature)}];
      };
      const selected=(doc:Document,selector:string)=>{const el=doc.querySelector(selector);if(!el)throw new Error(`Missing ${selector}`);return el;};
      const slots=(doc:Document,selector:string)=>Array.from(selected(doc,selector).children).flatMap(el=>el.namespaceURI===b?Array.from(el.children):[el]).map(el=>`${el.localName}.${el.getAttribute('class')||''}`);
      return {
        productionHeader:signature(selected(prod,'.site-header')),fixtureHeader:signature(selected(fixture,'.site-header')),
        productionImage:signature(selected(prod,'.card-image')),fixtureImage:signature(selected(fixture,'.card-image')),
        productionCardSlots:slots(prod,'.card-content'),fixtureCardSlots:slots(fixture,'.card-content'),
        productionArticleHeading:signature(selected(prod,'.article-header h1')),fixtureArticleHeading:signature(selected(single,'.article-header h1')),
        productionBody:signature(selected(prod,'#article-body')).map((x:any)=>({...x,children:[]})),fixtureBody:signature(selected(single,'#article-body')).map((x:any)=>({...x,children:[]}))
      };
    },{xml:readFileSync('dist/theme.xml','utf8'),home:render('home'),article:render('article')});
    expect(result.productionHeader).toEqual(result.fixtureHeader);
    expect(result.productionImage).toEqual(result.fixtureImage);
    expect(result.productionCardSlots).toEqual(result.fixtureCardSlots);
    expect(result.productionArticleHeading).toEqual(result.fixtureArticleHeading);
    expect(result.productionBody).toEqual(result.fixtureBody);
  }finally{await browser.close();}
},25000);
it('a deliberate production search-label regression also breaks the shared fixture gate', () => {
  const dir=mkdtempSync(path.join(os.tmpdir(),'fcd-parity-'));
  try {
    cpSync('src',path.join(dir,'src'),{recursive:true});cpSync('fixtures',path.join(dir,'fixtures'),{recursive:true});
    const file=path.join(dir,'src/partials/presentation.pug');const source=readFileSync(file,'utf8');const target="label.sr-only(for='search-query') Search articles";
    expect(source).toContain(target);
    const check=(html:string)=>{if(!/<label[^>]*for="search-query"[^>]*>Search articles<\/label>/.test(html))throw new Error('Missing accessible production search label');};
    check(render('home'));
    writeFileSync(file,source.replace(target,'span Search articles'));
    const broken=pug.renderFile(path.join(dir,'fixtures/home.pug'),{css:'',script:''});
    expect(()=>check(broken)).toThrow('Missing accessible production search label');
  }finally{rmSync(dir,{recursive:true,force:true});}
});
it('editorial roles retain the native eligible sequence rather than a replacement loop',()=>{
 const source=readFileSync('src/widgets/blog-post.pug','utf8');expect(source).toContain('data:view.isHomepage and not data:newerPageUrl');expect(source).toContain('data:post.id == data:posts.first.id');expect(source).toContain('data:posts take 3 map (p => p.id)');expect(source).not.toContain('b:loop');
 const presentation=readFileSync('src/partials/presentation.pug','utf8');expect(presentation).toContain("expr:data-editorial-role=fixture ? undefined : 'data:fcdEditorialRole'");
});
it('changing the shared fixture lead-loading policy is caught by a negative control',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'fcd-image-parity-'));
 try{cpSync('src',path.join(dir,'src'),{recursive:true});cpSync('fixtures',path.join(dir,'fixtures'),{recursive:true});const file=path.join(dir,'src/partials/presentation.pug');const source=readFileSync(file,'utf8');const target="lead ? 'eager' : 'lazy'";expect(source).toContain(target);writeFileSync(file,source.replace(target,"lead ? 'lazy' : 'lazy'"));const broken=pug.renderFile(path.join(dir,'fixtures/home.pug'),{css:'',script:''});expect(broken).not.toContain('loading="eager"');expect(render('home')).toContain('loading="eager"');}finally{rmSync(dir,{recursive:true,force:true});}
});
