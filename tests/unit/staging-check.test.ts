import {expect,it,vi} from 'vitest';
import {validateManifest,runStaging} from '../../tools/staging-check.ts';
const origin='https://stage.example';const build='0.1.0+'+'a'.repeat(40);
const types=['home','article','label','search','archive','static','error','paged'];
const raw=()=>({origin,build,views:types.map(type=>({type,url:origin+'/'+type,expectedText:['search','static','error'].includes(type)?'Fixture content':undefined}))});
it('missing staging URLs block rather than pass',()=>expect(()=>validateManifest({origin:'',build:'',views:[]})).toThrow());
it('requires distinct required native page types',()=>expect(()=>validateManifest({origin,build,views:[{type:'home',url:origin+'/'}]})).toThrow());
it('rejects off-origin views and credential-bearing URLs',()=>{const a=raw();a.views[2].url='https://evil.example/label';expect(()=>validateManifest(a)).toThrow();a.views[2].url='https://user:pass@stage.example/label';expect(()=>validateManifest(a)).toThrow();});
const card='<article class="post-card"><h2 class="post-title"><a href="/2026/09/security-research.html">Security research</a></h2></article>';
function markup(type:string){
 const content=type==='article'||type==='static'?'<article class="article-view"><h1 class="post-title">Page heading</h1><div id="article-body"><p>Fixture content</p></div></article>':`<h1>Page heading</h1><p>Fixture content</p>${card}<a class="blog-pager-older-link" href="/older">Older</a>`;
 const schema=type==='article'?'<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:'Page heading',mainEntityOfPage:origin+'/article'})+'</script>':'';
 return `<html><head><title>Page heading</title><meta name="theme-build" content="${build}"><link rel="canonical" href="${origin}/${type}"><meta property="og:type" content="${type==='article'?'article':'website'}"><meta name="twitter:card" content="summary">${schema}</head><body><main id="content">${content}</main></body></html>`;
}
it('checks all eight configured response types without contacting real staging',async()=>{const seen:string[]=[];const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(input)=>{const url=String(input);seen.push(url);const type=new URL(url).pathname.slice(1);return new Response(markup(type),{status:type==='error'?404:200});});try{await runStaging(validateManifest(raw()));expect(seen).toHaveLength(8);}finally{fetch.mockRestore();}},60000);
const invalid:[string,number,string][]=[['redirect',302,''],['missing body',200,'<html><head><meta name="theme-build" content="'+build+'"><style>.post-title{}</style></head><body></body></html>'],['stale build',200,markup('home').replace(build,'0.1.0+'+'b'.repeat(40))]];
it.each(invalid)('rejects %s responses',async(_name,status,body)=>{const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(body,{status}));try{await expect(runStaging(validateManifest(raw()))).rejects.toThrow();}finally{fetch.mockRestore();}},30000);
async function checkOne(type:string,html:string){const manifest=validateManifest(raw());manifest.views=manifest.views.filter(v=>v.type===type);const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(html,{status:type==='error'?404:200}));try{await runStaging(manifest);}finally{fetch.mockRestore();}}
it('rejects a populated catalog masquerading as the article view',async()=>{await expect(checkOne('article',markup('home'))).rejects.toThrow(/article/i);},30000);
it('rejects a hidden article body even when a visible catalog sibling exists',async()=>{const html=markup('article').replace('id="article-body"','id="article-body" hidden').replace('</main>',card+'</main>');await expect(checkOne('article',html)).rejects.toThrow(/article/i);},30000);
const mutations:Record<string,(html:string)=>string>={
 'hidden main':html=>html.replace('<main id="content">','<main id="content" hidden>'),
 'CSS-hidden ancestor':html=>html.replace('<body>','<body><div style="display:none">').replace('</body>','</div></body>'),
 'hidden heading':html=>html.replace('<h1','<h1 style="visibility:hidden"'),
 'hidden expected text':html=>html.replace('<p>Fixture content</p>','<p hidden>Fixture content</p>'),
 'transparent expected text':html=>html.replace('<p>Fixture content</p>','<div style="opacity:0"><p>Fixture content</p></div>'),
 'non-content expected text':html=>html.replace('<p>Fixture content</p>','<script type="application/json">"Fixture content"</script><style>/* Fixture content */</style><template>Fixture content</template>')
};
const hiddenCases=['search','static','error'].flatMap(type=>Object.keys(mutations).map(name=>({type,name})));
it.each(hiddenCases)('rejects $name in $type views',async({type,name})=>{await expect(checkOne(type,mutations[name](markup(type)))).rejects.toThrow();},30000);
it('rejects malformed metadata even when article content is visible',async()=>{await expect(checkOne('article',markup('article').replace('"headline":"Page heading"','"headline":"Wrong article"'))).rejects.toThrow(/headline/);},30000);
