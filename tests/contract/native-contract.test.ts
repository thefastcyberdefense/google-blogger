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

const states=['error','label','search','archive','home','generic'];
it.each(states)('ships a distinct native %s empty state',state=>{
 expect(original).toContain(`data-empty-state="${state}"`);
});
it('uses an exclusive error-first native dispatch with label before search and a generic fallback',()=>{
 const result=spawnSync('python3',['-c',`
import xml.etree.ElementTree as E
r=E.parse('dist/theme.xml').getroot(); b='{http://www.google.com/2005/gml/b}'; h='{http://www.w3.org/1999/xhtml}'
w=next(x for x in r.iter(b+'widget') if x.get('id')=='Blog1')
p=next(x for x in w.findall(b+'includable') if x.get('id')=='noContentPlaceholder')
chain=p.find(b+'if')
assert chain is not None, 'missing exclusive native state dispatch'
assert chain.get('cond')=='data:view.isError'
assert [x.get('cond') for x in chain.findall(b+'elseif')]==['data:view.isLabelSearch','data:view.isSearch','data:view.isArchive','data:view.isHomepage and not data:newerPageUrl']
assert len(chain.findall(b+'else'))==1
assert [x.get('data-empty-state') for x in chain.findall(h+'section')]==['error','label','search','archive','home','generic']
assert not list(p.iter(h+'h1')), 'empty state must not duplicate page h1'
for section in chain.findall(h+'section'):
 assert len(section.findall(h+'h2'))==1
 form=section.find(h+'form'); assert form is not None
 assert form.get('method')=='get' and form.get('{http://www.google.com/2005/gml/expr}action')=='data:blog.searchUrl'
 assert any(x.get('name')=='q' and x.get('type')=='search' for x in form.iter(h+'input'))
 assert any(x.get('{http://www.google.com/2005/gml/expr}href')=='data:blog.homepageUrl' for x in section.iter(h+'a'))
for expr in ['data:view.search.query.escaped','data:view.search.label.escaped','data:view.archive.rangeMessage.escaped']:
 assert any(x.get('expr')==expr for x in p.iter(b+'eval')), 'missing escaped native context: '+expr
`],{encoding:'utf8'});
 expect(result.status,result.stderr+result.stdout).toBe(0);
});
it('shares state content between production and fixture instead of duplicating copy',()=>{
 expect(readFileSync('src/widgets/blog.pug','utf8')).toContain('+fcdEmptyState(false)');
 expect(readFileSync('fixtures/home.pug','utf8')).toContain('+fcdEmptyState(true,');
});
