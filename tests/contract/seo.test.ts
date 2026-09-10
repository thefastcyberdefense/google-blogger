import{expect,it}from'vitest';import{readFileSync}from'node:fs';
import {chromium} from 'playwright-core';
import {validateMetadata} from '../../tools/metadata-check.ts';
it('keeps one native head owner and escaped structured data templates',()=>{const xml=readFileSync('dist/theme.xml','utf8');expect(xml.match(/name="all-head-content"/g)).toHaveLength(1);expect(xml).toContain('BlogPosting');expect(xml).toContain('BreadcrumbList');expect(xml).toContain('data:post.title.jsonEscaped');});
it('omits unavailable native author and publication date rather than emitting empty metadata',()=>{const source=readFileSync('src/partials/head-meta.pug','utf8');expect(source).toContain("b:if cond='data:post.author.name'");expect(source).toContain("b:if cond='data:post.date'");});
it('has no fixed component or growth size limits, retaining total XML cap',()=>{const source=readFileSync('tools/generate.ts','utf8');expect(source).toContain('bytes>500000');expect(source).not.toContain('size.css.raw-base.css.raw');expect(source).not.toContain('size.js.raw-base.js.raw');});
it('validates rendered eight-view metadata with positive and adversarial controls',async()=>{
 const data=JSON.parse(readFileSync('fixtures/metadata-cases.json','utf8')) as {views:string[];title:string;url:string;date:string;author:string;image:string};
 const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const schema={ '@context':'https://schema.org','@type':'BlogPosting',headline:data.title,mainEntityOfPage:data.url,datePublished:data.date,author:{'@type':'Person',name:data.author},image:data.image};
 const ld=(o:unknown)=>'<script type="application/ld+json">'+JSON.stringify(o).replace(/</g,'\\u003c')+'</script>';
 const html=(view:string)=>`<html><head><title>${esc(data.title)}</title><link rel="canonical" href="${data.url}"><meta property="og:type" content="${view==='article'?'article':'website'}"><meta name="twitter:card" content="summary">${view==='article'?ld(schema):''}</head><body><main id="content"><h1>${esc(data.title)}</h1></main></body></html>`;
 const browser=await chromium.launch();try{const page=await browser.newPage();await page.route('**/*',r=>r.abort());
 const check=(text:string,view='article')=>page.evaluate(validateMetadata,{html:text,view,url:data.url});
 for(const view of data.views)expect(await check(html(view),view)).toEqual([]);
 for(const bad of [
 html('article').replace('</head>','<link rel="canonical" href="https://evil.example/"></head>'),
 html('article').replace('href="'+data.url+'"','href="javascript:alert(1)"'),
 html('article').replace(data.title.replace(/"/g,'\\"'),'Wrong headline'),
 html('article').replace(data.date,'not-a-date'),
 html('article').replace(data.author,''),
 html('article').replace('"mainEntityOfPage":"'+data.url+'"','"mainEntityOfPage":"https://stage.example/other"'),
 html('article').replace('"@context"','broken "@context"'),
 html('article').replace('<title>','<title></title><title>'),
 html('article').replace('</head>','<meta property="og:type" content="website"></head>')
 ])expect((await check(bad)).length).toBeGreaterThan(0);
 expect((await check(html('article'),'static')).length).toBeGreaterThan(0);
 expect((await check(html('static'),'article')).length).toBeGreaterThan(0);
 const optional={...schema};delete (optional as Partial<typeof schema>).author;delete (optional as Partial<typeof schema>).datePublished;delete (optional as Partial<typeof schema>).image;
 expect(await check(html('article').replace(ld(schema),ld(optional)))).toEqual([]);
 }finally{await browser.close();}
},30000);
