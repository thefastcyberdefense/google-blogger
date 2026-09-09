import {it,expect} from 'vitest';
import {rankRelated,type Candidate} from '../../src/scripts/related-posts.ts';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
const pug=createRequire(import.meta.url)('pug') as {render(source:string,options:Record<string,unknown>):string};
const p=(identity:string,labels:string[],published?:number):Candidate=>({title:identity,url:'https://example.com/'+identity,identity,id:identity,labels:labels.map(key=>({key,text:key})),published});
const current={identity:'self',id:'self',labels:['cloud','identity']};
it('ranks distinct shared labels then dates, excluding self',()=>{const result=rankRelated([p('self',['cloud']),p('one',['cloud'],20),p('two',['cloud','identity'],1),p('none',[],99)],current);expect(result.kind).toBe('related');expect(result.posts.map(x=>x.identity)).toEqual(['two','one']);});
it('does not fill genuine matches with unrelated latest posts',()=>{expect(rankRelated([p('match',['cloud']),p('other',[],100)],current).posts.map(x=>x.identity)).toEqual(['match']);});
it('uses deterministic identity ties and latest fallback',()=>{const posts=[p('z',[],10),p('a',[],10),p('b',[])];expect(rankRelated(posts,current)).toMatchObject({kind:'latest'});expect(rankRelated(posts,current).posts.map(x=>x.identity)).toEqual(['a','z','b']);expect(rankRelated([...posts].reverse(),current).posts.map(x=>x.identity)).toEqual(['a','z','b']);});
it('deduplicates and caps at three',()=>{const posts=[p('a',['cloud']),p('a',['cloud']),p('b',['cloud']),p('c',['cloud']),p('d',['cloud'])];expect(rankRelated(posts,current).posts.map(x=>x.identity)).toEqual(['a','b','c']);});
it('excludes matching stable ID even under a different URL',()=>{expect(rankRelated([{...p('different',['cloud']),id:'self'}],current).posts).toEqual([]);});
it('counts repeated normalized labels once and leaves inputs unchanged',()=>{const a=p('a',[' CLOUD ','cloud','cloud'],1),b=p('b',['cloud','identity'],0);const source=[a,b];const before=JSON.stringify(source);expect(rankRelated(source,current).posts.map(x=>x.identity)).toEqual(['b','a']);expect(JSON.stringify(source)).toBe(before);});
it('requires native post guard and permanent fallback in shared presentation',()=>{
 const source=readFileSync('src/partials/presentation.pug','utf8');const validate=(s:string)=>{if(!s.includes("b:if(cond='data:view.isPost')\n        +fcdRelated({}, false)")||!s.includes("aria-labelledby='related-heading'")||!s.includes('a.related-fallback('))throw new Error('Missing guarded accessible native fallback');};
 validate(source);expect(()=>validate(source.replace("b:if(cond='data:view.isPost')\n        +fcdRelated({}, false)","+fcdRelated({}, false)"))).toThrow();expect(()=>validate(source.replace('a.related-fallback(','a('))).toThrow();expect(()=>validate(source.replace("aria-labelledby='related-heading'",''))).toThrow();
});
it('shared native context uses escaped attributes and repeated labels, not comma splitting',()=>{const source=readFileSync('src/partials/presentation.pug','utf8');const post={url:'/post?x="quoted"',id:'100',labels:[{name:'Cloud, Identity " <script>',url:'/search/label/cloud'}]};const html=pug.render(source+'\n+fcdRelated(post,true)',{post});expect(html).toContain('data-post-url="/post?x=&quot;quoted&quot;"');expect(html).toContain('data-current-label="Cloud, Identity &quot; &lt;script&gt;"');expect(html).not.toContain('<script>');});
it('optional renderer failure and missing identity do not break other consumers',async()=>{
 const code=await build({entryPoints:['src/scripts/main.ts'],bundle:true,write:false,format:'iife',platform:'browser'});const browser=await chromium.launch();const origin='https://blogs.fastcyberdefense.com';
 try{for(const mode of ['none','broken-renderer','missing-identity']){
  const context=await browser.newContext();try{const page=await context.newPage();let requests=0;
   const shell=`<section data-related-post="true" data-post-url="${mode==='missing-identity'?'':origin+'/self'}"><h2 data-related-heading>Continue reading</h2><ol data-related-list></ol><p data-related-status></p><a href="/search">Native fallback</a></section>`;
   const html='<main><h1>Publication</h1>'+(mode==='none'?'':'<section><ol id="recent-posts"></ol><p id="recent-status"></p></section>'+shell)+'</main>';
   await page.route(origin+'/**',r=>{if(r.request().url().includes('/feeds/')){requests++;return r.fulfill({contentType:'application/json',body:JSON.stringify({feed:{entry:[{title:{$t:'Other article'},link:[{rel:'alternate',href:origin+'/other'}]}]}})});}return r.fulfill({contentType:'text/html',body:html});});
   await page.goto(origin+'/self');if(mode==='broken-renderer')await page.evaluate(()=>{const original=Element.prototype.replaceChildren;Element.prototype.replaceChildren=function(...nodes:(Node|string)[]){if(this.hasAttribute('data-related-list'))throw new Error('Injected renderer failure');return original.apply(this,nodes);};});
   await page.addScriptTag({content:code.outputFiles[0].text});
   if(mode==='none'){expect(requests).toBe(0);}else{await page.waitForFunction(()=>document.querySelectorAll('#recent-posts a').length===1);expect(requests).toBe(1);expect(await page.locator('[data-related-list] a').count()).toBe(0);if(mode==='broken-renderer')expect(await page.locator('[data-related-status]').textContent()).toContain('Suggestions unavailable');expect(await page.getByText('Native fallback').isVisible()).toBe(true);}
  }finally{await context.close();}
 }}finally{await browser.close();}
},30000);
