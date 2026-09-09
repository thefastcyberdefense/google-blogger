import {expect,it,vi} from 'vitest';
import {validateManifest,runStaging} from '../../tools/staging-check.ts';
const origin='https://stage.example';const build='0.1.0+'+'a'.repeat(40);
const types=['home','article','label','search','archive','static','error','paged'];
const raw=()=>({origin,build,views:types.map(type=>({type,url:origin+'/'+type,expectedText:['search','static','error'].includes(type)?'Fixture content':undefined}))});
it('missing staging URLs block rather than pass',()=>expect(()=>validateManifest({origin:'',build:'',views:[]})).toThrow());
it('requires distinct required native page types',()=>expect(()=>validateManifest({origin,build,views:[{type:'home',url:origin+'/'}]})).toThrow());
it('rejects off-origin views and credential-bearing URLs',()=>{const a=raw();a.views[2].url='https://evil.example/label';expect(()=>validateManifest(a)).toThrow();a.views[2].url='https://user:pass@stage.example/label';expect(()=>validateManifest(a)).toThrow();});
function markup(type:string){return `<html><head><meta name="theme-build" content="${build}"><link rel="canonical" href="${origin}/${type}"></head><body><main id="content"><h1>Fixture content</h1><article class="post-card"><h2 class="post-title"><a href="/2026/09/security-research.html">Security research</a></h2></article><a class="blog-pager-older-link" href="/older">Older</a></main></body></html>`;}
it('checks all eight configured response types without contacting real staging',async()=>{
 const seen:string[]=[];const fetch=vi.spyOn(globalThis,'fetch').mockImplementation(async(input)=>{const url=String(input);seen.push(url);const type=new URL(url).pathname.slice(1);return new Response(markup(type),{status:type==='error'?404:200});});
 try{await runStaging(validateManifest(raw()));expect(seen).toHaveLength(8);}finally{fetch.mockRestore();}
},60000);
const invalid:[string,number,string][]=[['redirect',302,''],['missing body',200,'<html><head><meta name="theme-build" content="'+build+'"><style>.post-title{}</style></head><body></body></html>'],['stale build',200,markup('home').replace(build,'0.1.0+'+'b'.repeat(40))]];
it.each(invalid)('rejects %s responses',async(_name,status,body)=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(body,{status}));try{await expect(runStaging(validateManifest(raw()))).rejects.toThrow();}finally{fetch.mockRestore();}
},30000);
