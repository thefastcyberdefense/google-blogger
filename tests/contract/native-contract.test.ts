import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const original=readFileSync('dist/theme.xml','utf8');
const checker=path.resolve('tools/validate-xml.py');
function check(xml:string){const dir=mkdtempSync(path.join(os.tmpdir(),'fcd-contract-'));try{mkdirSync(path.join(dir,'dist'));writeFileSync(path.join(dir,'dist/theme.xml'),xml);return spawnSync('python3',[checker],{cwd:dir,encoding:'utf8'});}finally{rmSync(dir,{recursive:true,force:true});}}
it('accepts current generated V3 output',()=>{const r=check(original);expect(r.status,r.stderr+r.stdout).toBe(0);});
const mutations:[string,(s:string)=>string][]=[
 ['V2 root attribute',s=>s.replace('<html ','<html b:version="2" ')],
 ['missing skin',s=>s.replace(/<b:skin\b[\s\S]*?<\/b:skin>/,'')],
 ['duplicate section identity',s=>s.replace('id="topics"','id="header"')],
 ['Blog1 moved outside main',s=>s.replace(/<main\b/g,'<div').replace(/<\/main>/g,'</div>')],
 ['unlocked native Blog1',s=>s.replace(/(<b:widget\b[^>]*id="Blog1"[^>]*locked=")true/, '$1false')],
 ['duplicate Blog1 includable',s=>s.replace('<b:includable id="postMeta"','<b:includable id="postMeta"/><b:includable id="postMeta"')],
 ['missing actual post body output',s=>s.replace('expr="data:post.body"','expr="data:post.title"')],
 ['removed comment dispatch',s=>s.replace('name="commentPicker"','name="unusedCommentPicker"')],
 ['removed native older cursor',s=>s.replace('expr:href="data:olderPageUrl"','href="#"')],
 ['removed native metadata owner',s=>s.replace('<b:include data="blog" name="all-head-content"/>','')],
 ['duplicate head owner',s=>s.replace('<b:include data="blog" name="all-head-content"/>','<b:include data="blog" name="all-head-content"/><b:include data="blog" name="all-head-content"/>')],
 ['missing single-item guard',s=>s.replace('cond="data:view.isSingleItem"','cond="false"')],
 ['invalid expression syntax',s=>s.replace('data:posts.any and not data:view.isError','data:posts.size gt 0')],
 ['wrong skip destination',s=>s.replace('href="#content"','href="#missing"')]
];
it.each(mutations)('rejects %s',(_name,mutate)=>{const changed=mutate(original);expect(changed).not.toBe(original);const r=check(changed);expect(r.status,r.stdout).not.toBe(0);});
it('does not flag comments describing banned syntax',()=>{const r=check(original.replace('<head>','<head><!-- data:posts.size gt 0; b:version is forbidden guidance, not executable markup -->'));expect(r.status,r.stderr).toBe(0);});
