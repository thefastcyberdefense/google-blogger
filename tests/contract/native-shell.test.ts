import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// FCD-L1-SHELL-CONTRACT-v1 static checks on the freshly built theme XML.
// Source contract only: they cannot prove Blogger import, save or rendering.
// Messages carry N1L_* reason codes like the native-shell browser regressions.
const original=readFileSync('dist/theme.xml','utf8');
const prelude=String.raw`
import sys
import xml.etree.ElementTree as E
r=E.fromstring(sys.stdin.buffer.read())
B='{http://www.google.com/2005/gml/b}';H='{http://www.w3.org/1999/xhtml}';X='{http://www.google.com/2005/gml/expr}'
def classes(e):return (e.get('class') or '').split()
def one(items,message):
    items=list(items)
    assert len(items)==1,message+': found %d'%len(items)
    return items[0]
def section(i):return one((s for s in r.iter(B+'section') if s.get('id')==i),'section '+i)
def widget(i):return one((w for w in r.iter(B+'widget') if w.get('id')==i),'widget '+i)
def includable(w,i):return one((x for x in w.findall(B+'includable') if x.get('id')==i),(w.get('id') or w.get('type') or '')+' includable '+i)
`;
const checks={
  // C1: the masthead section declares only Header1, whose main renders the whole brand row.
  C1:String.raw`
header=section('header')
assert [w.get('id') for w in header.findall(B+'widget')]==['Header1'],'N1L_C1_HEADER_ONLY masthead section must declare only Header1'
row=one((e for e in includable(widget('Header1'),'main').iter(H+'div') if 'brand-row' in classes(e)),'N1L_C1_BRAND_ROW Header1 main .brand-row')
one((a for a in row.iter(H+'a') if 'brand' in classes(a)),'N1L_C1_BRAND_ROW brand link')
assert [b.get('id') for b in row.iter(H+'button')]==['theme-toggle','menu-toggle'],'N1L_C1_CONTROLS .brand-row must hold Theme then Menu'
for i in ['theme-toggle','menu-toggle']:assert sum(1 for e in r.iter() if e.get('id')==i)==1,'N1L_C1_CONTROLS duplicate or missing #'+i
`,
  // C2: the native Attribution gadget gets a compact text credit instead of the platform logo.
  C2:String.raw`
m=one((m for d in r.iter(B+'defaultmarkups') for m in d.findall(B+'defaultmarkup') if m.get('type')=='Attribution'),'N1L_C2_ATTRIBUTION Attribution default markup')
a=one((a for a in includable(m,'main').iter(H+'a') if a.get(X+'href')=='data:bloggerUrl'),'N1L_C2_ATTRIBUTION link to data:bloggerUrl')
assert 'nofollow' in (a.get('rel') or '').split(),'N1L_C2_ATTRIBUTION link must be rel=nofollow'
assert any(x.get('name')=='messages.poweredByBlogger' for x in a.iter(B+'message')),'N1L_C2_ATTRIBUTION must use messages.poweredByBlogger'
assert not [e for e in m.iter() if e.tag in (H+'img',H+'svg','{http://www.w3.org/2000/svg}svg')],'N1L_C2_LOGO Attribution markup must not render a logo'
`,
} as const;
type Check=keyof typeof checks;
const check=(xml:string,name:Check)=>spawnSync('python3',['-c',prelude+checks[name]],{input:xml,encoding:'utf8'});
it.each(Object.keys(checks) as Check[])('L1 contract %s holds for the generated theme',name=>{
  const r=check(original,name);expect(r.status,r.stderr+r.stdout).toBe(0);
});
// Mutation controls: each check must reject the regression it exists to catch.
const mutations:[Check,string,(s:string)=>string][]=[
  ['C1','a saved gadget declared before Header1',s=>s.replace('<b:widget id="Header1"','<b:widget id="HTML9" type="HTML" title="Mutation" version="2"/><b:widget id="Header1"')],
  ['C2','a logo inside the Attribution link',s=>s.replace(/(<b:defaultmarkup type="Attribution">[\s\S]*?<a\b[^>]*>)/,'$1<svg class="svg-icon-24"></svg>')],
];
it.each(mutations)('L1 contract %s rejects %s',(name,_label,mutate)=>{
  const changed=mutate(original);expect(changed,'N1L_MUTATION_TARGET missing').not.toBe(original);
  const r=check(changed,name);expect(r.status,r.stderr+r.stdout).not.toBe(0);
});
