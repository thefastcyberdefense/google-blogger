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
  // C3 (US-004b): the archive card only earns chrome when Blogger supplies archive data.
  C3:String.raw`
w=widget('BlogArchive1')
m=includable(w,'main')
assert m.get('var')=='this','N1L_C3_THIS BlogArchive1 main must declare var=this so data:this.data is bound'
card=one((e for e in m.iter(H+'div') if 'gadget-card' in classes(e)),'N1L_C3_CARD BlogArchive1 .gadget-card')
flag=one(card.findall(B+'class'),'N1L_C3_HAS_ITEMS one b:class on .gadget-card')
assert flag.get('name')=='has-items' and flag.get('cond')=='data:this.data','N1L_C3_HAS_ITEMS has-items must follow data:this.data'
assert [i.get('name') for i in card.findall(B+'include')]==['super.main'],'N1L_C3_NATIVE archive card must delegate to super.main'
`,
  // C4 (US-004b): saved gadgets get native homes instead of landing in the masthead.
  C4:String.raw`
assert [w.get('id') for w in section('sidebar').findall(B+'widget')]==['Profile1','BlogArchive1'],'N1L_C4_SIDEBAR sidebar must declare Profile1 then BlogArchive1'
foot=one((f for f in r.iter(H+'footer') if 'site-footer' in classes(f)),'N1L_C4_FOOTER footer.site-footer')
home=one((s for s in foot.iter(B+'section') if s.get('id')=='footer-gadgets'),'N1L_C4_FOOTER_SECTION footer-gadgets inside the footer')
assert [w.get('id') for w in home.findall(B+'widget')]==['Attribution1','ReportAbuse1'],'N1L_C4_FOOTER_GADGETS footer must declare Attribution1 then ReportAbuse1'
for i,t in [('Profile1','Profile'),('Attribution1','Attribution'),('ReportAbuse1','ReportAbuse')]:
    w=widget(i);assert w.get('type')==t and w.get('version')=='2','N1L_C4_TYPE '+i
    m=includable(w,'main');assert m.get('var')=='this','N1L_C4_THIS '+i+' main must declare var=this'
    assert [x.get('name') for x in m.iter(B+'include')]==['super.main'],'N1L_C4_NATIVE '+i+' must delegate to super.main'
`,
  // C5 (US-004b, owner decision): FCD's own search is the single masthead search; the theme
  // gives the saved Blog Search gadget no search presentation (the owner removes it in Layout).
  C5:String.raw`
head=one((h for h in r.iter(H+'header') if 'site-header' in classes(h)),'N1L_C5_HEADER header.site-header')
form=one((f for f in head.iter(H+'form') if f.get('role')=='search'),'N1L_C5_ONE_SEARCH masthead search forms')
assert form.get('id')=='site-search' and form.get('method')=='get' and form.get(X+'action')=='data:blog.searchUrl','N1L_C5_NATIVE_SEARCH theme search must GET data:blog.searchUrl'
assert any(i.get('name')=='q' and i.get('type')=='search' for i in form.iter(H+'input')),'N1L_C5_NATIVE_SEARCH q search input'
assert not [m for d in r.iter(B+'defaultmarkups') for m in d.findall(B+'defaultmarkup') if m.get('type')=='BlogSearch'],'N1L_C5_GADGET_SEARCH theme must not present the saved Blog Search gadget as a second search'
`,
  // C6 (L1-nav): Navigation is the owner's native Link List gadget in its own Layout section, with
  // the approved design v1 links as fresh-install defaults. The theme owns the drawer and the single
  // search, so the menu target and search never depend on a saved gadget.
  C6:String.raw`
parent={c:p for p in r.iter() for c in p}
def within(e,test):
    p=parent.get(e)
    while p is not None:
        if test(p):return True
        p=parent.get(p)
    return False
head=one((h for h in r.iter(H+'header') if 'site-header' in classes(h)),'N1L_C6_HEADER header.site-header')
nav=one((e for e in r.iter() if e.get('id')=='primary-navigation'),'N1L_C6_DRAWER #primary-navigation')
assert nav.tag==H+'nav' and nav.get('aria-label')=='Primary','N1L_C6_DRAWER #primary-navigation must be nav aria-label=Primary'
assert within(nav,lambda p:p is head) and not within(nav,lambda p:p.tag==B+'section'),'N1L_C6_DRAWER the theme owns the drawer inside the masthead, outside every section'
assert one((e for e in r.iter() if e.get('id')=='menu-toggle'),'N1L_C6_DRAWER #menu-toggle').get('aria-controls')=='primary-navigation','N1L_C6_DRAWER Menu must control the drawer'
home=one((s for s in nav.iter(B+'section') if s.get('id')=='navigation'),'N1L_C6_SECTION Navigation section inside the drawer')
assert (home.get('name'),home.get('maxwidgets'),home.get('showaddelement'))==('Navigation','1','false'),'N1L_C6_SECTION the Navigation section holds exactly one gadget'
w=one(home.findall(B+'widget'),'N1L_C6_GADGET Navigation gadgets')
assert (w.get('id'),w.get('type'),w.get('version'),w.get('locked'))==('LinkList1','LinkList','2','true'),'N1L_C6_GADGET Navigation must be the locked Version 2 LinkList1 gadget'
links=one((u for u in includable(w,'main').iter(H+'ul') if 'nav-list' in classes(u)),'N1L_C6_LIST LinkList1 main ul.nav-list')
saved=one((i for i in links.iter(B+'if') if i.get('cond')=='data:links'),'N1L_C6_SAVED saved-links branch')
loop=one(saved.findall(B+'loop'),'N1L_C6_SAVED saved-links loop')
assert (loop.get('values'),loop.get('var'))==('data:links','link'),'N1L_C6_SAVED the loop must read data:links'
a=one(loop.iter(H+'a'),'N1L_C6_SAVED saved link anchor')
assert a.get(X+'href')=='data:link.target' and 'nav-link' in classes(a),'N1L_C6_SAVED saved links must use data:link.target'
assert [e.get('expr') for e in a.iter(B+'eval')]==['data:link.name'],'N1L_C6_SAVED saved links must show data:link.name'
kids=list(saved)
assert [k.tag for k in kids[:2]]==[B+'loop',B+'else'],'N1L_C6_DEFAULTS defaults render only when no links are saved'
defaults=[x for k in kids[2:] for x in k.iter(H+'a')]
names=[''.join(x.itertext()).replace('\u2197','').strip() for x in defaults]
assert names==['Latest','Topics','Guides','Company website'],'N1L_C6_DEFAULTS default links %r'%names
targets=[x.get(X+'href') or x.get('href') for x in defaults]
assert targets==['data:blog.homepageUrl path "search"','#topics','data:blog.homepageUrl path "search/label/Guides"','https://fastcyberdefense.com/'],'N1L_C6_DEFAULTS default targets %r'%targets
assert [s.get('aria-hidden') for s in defaults[3].iter(H+'span')]==['true'],'N1L_C6_EXTERNAL the external mark must be decorative'
stray=[x for x in nav.iter(H+'a') if not within(x,lambda p:p is w)]
assert not stray,'N1L_C6_THEME_LINKS the theme must not hardcode links beside the gadget: %d'%len(stray)
form=one((f for f in nav.iter(H+'form') if f.get('id')=='site-search'),'N1L_C6_SEARCH #site-search inside the drawer')
assert not within(form,lambda p:p.tag==B+'section'),'N1L_C6_SEARCH FCD search must stay outside every section'
`,
  // C7 (L2-intro): the first home page opens with the intro band. The theme owns its headline, so each
  // view keeps exactly one h1; the owner's Intro gadget copy replaces the default standfirst; Topics
  // follows inside the band. Other multi-item views keep the plain publication heading.
  C7:String.raw`
parent={c:p for p in r.iter() for c in p}
def within(e,test):
    p=parent.get(e)
    while p is not None:
        if test(p):return True
        p=parent.get(p)
    return False
HOME='data:view.isHomepage and not data:newerPageUrl'
main=one((m for m in r.iter(H+'main') if m.get('id')=='content'),'N1L_C7_MAIN main#content')
band=one((d for d in main.iter(H+'div') if 'intro-band' in classes(d)),'N1L_C7_BAND .intro-band inside main#content')
hero=one((h for h in band.iter(H+'header') if 'intro-hero' in classes(h)),'N1L_C7_HERO header.intro-hero')
gate=parent[hero]
assert gate.tag==B+'if' and gate.get('cond')==HOME and parent[gate] is band,'N1L_C7_HERO the headline renders only on the first home page'
assert not within(hero,lambda p:p.tag in (B+'section',B+'widget')),'N1L_C7_HERO the theme owns the headline, outside every gadget'
h1=one(hero.iter(H+'h1'),'N1L_C7_H1 intro h1')
assert h1.get('id')=='intro-heading' and ''.join(h1.itertext()).strip()=='Security knowledge. Practical defense.','N1L_C7_H1 the design v1 headline'
intro=one((s for s in band.findall(B+'section') if s.get('id')=='intro'),'N1L_C7_SECTION Intro section in the band')
assert (intro.get('name'),intro.get('maxwidgets'),intro.get('showaddelement'))==('Intro','1','false'),'N1L_C7_SECTION the Intro section holds exactly one gadget'
w=one(intro.findall(B+'widget'),'N1L_C7_GADGET Intro gadgets')
assert (w.get('id'),w.get('type'),w.get('version'),w.get('locked'))==('HTML1','HTML','2','true'),'N1L_C7_GADGET Intro must be the locked Version 2 HTML1 gadget'
m=includable(w,'main')
home=one(m.findall(B+'if'),'N1L_C7_HOME_ONLY Intro copy guard')
assert home.get('cond')==HOME,'N1L_C7_HOME_ONLY the Intro copy renders only on the first home page'
body=one((d for d in home.iter(H+'div') if 'intro-body' in classes(d)),'N1L_C7_BODY .intro-body')
saved=one(body.findall(B+'if'),'N1L_C7_BODY saved-copy branch')
kids=list(saved)
assert saved.get('cond')=='data:content' and [k.tag for k in kids[:2]]==[B+'eval',B+'else'] and kids[0].get('expr')=='data:content','N1L_C7_BODY saved Intro copy first, the default only when it is empty'
assert [(k.tag,classes(k),''.join(k.itertext()).strip()) for k in kids[2:]]==[(H+'p',['standfirst'],'Research, threat insights, and guidance for stronger security.')],'N1L_C7_DEFAULT the design v1 standfirst'
assert not list(m.iter(H+'h1')),'N1L_C7_ONE_H1 the Intro gadget must not render an h1'
topics=one((s for s in band.findall(B+'section') if s.get('id')=='topics'),'N1L_C7_TOPICS Topics section in the band')
assert [c for c in band if c.tag in (B+'if',B+'section')]==[gate,intro,topics],'N1L_C7_ORDER headline, Intro copy, then Topics'
pub=one((h for h in main.iter(H+'header') if 'publication-heading' in classes(h)),'N1L_C7_HEADING publication heading')
assert parent[pub].tag==B+'if' and parent[pub].get('cond')=='not data:view.isSingleItem and (not data:view.isHomepage or data:newerPageUrl)','N1L_C7_ONE_H1 the publication heading must yield to the home intro'
blog=widget('Blog1')
stray=[x for x in main.iter(H+'h1') if not (x is h1 or within(x,lambda p:p is pub) or within(x,lambda p:p is blog))]
assert not stray,'N1L_C7_ONE_H1 stray h1 in main#content: %d'%len(stray)
`,
  // C8 (L3-CTA): one sitewide call to action between the content and the footer. The owner's Call to
  // Action gadget copy replaces the default message and button; the article no longer repeats it.
  C8:String.raw`
parent={c:p for p in r.iter() for c in p}
def within(e,test):
    p=parent.get(e)
    while p is not None:
        if test(p):return True
        p=parent.get(p)
    return False
body=one(r.iter(H+'body'),'N1L_C8_BODY body')
band=one((a for a in r.iter(H+'aside') if 'cta-band' in classes(a)),'N1L_C8_BAND aside.cta-band')
assert parent[band] is body and band.get('aria-label')=='Call to action','N1L_C8_BAND the call to action is a labelled top-level band on every view'
kids=[c for c in body if c.tag in (H+'main',H+'aside',H+'footer')]
main=one((c for c in kids if c.tag==H+'main' and c.get('id')=='content'),'N1L_C8_ORDER main#content')
foot=one((c for c in kids if c.tag==H+'footer' and 'site-footer' in classes(c)),'N1L_C8_ORDER footer.site-footer')
assert kids.index(main)<kids.index(band) and kids.index(foot)==kids.index(band)+1,'N1L_C8_ORDER the band sits between the content and the footer'
sec=one((s for s in band.iter(B+'section') if s.get('id')=='cta'),'N1L_C8_SECTION Call to Action section in the band')
assert (sec.get('name'),sec.get('maxwidgets'),sec.get('showaddelement'))==('Call to Action','1','false'),'N1L_C8_SECTION the Call to Action section holds exactly one gadget'
w=one(sec.findall(B+'widget'),'N1L_C8_GADGET Call to Action gadgets')
assert (w.get('id'),w.get('type'),w.get('version'),w.get('locked'))==('HTML2','HTML','2','true'),'N1L_C8_GADGET Call to Action must be the locked Version 2 HTML2 gadget'
row=one((d for d in includable(w,'main').iter(H+'div') if 'cta-row' in classes(d)),'N1L_C8_ROW .cta-row')
saved=one(row.findall(B+'if'),'N1L_C8_SAVED saved-copy branch')
k=list(saved)
assert saved.get('cond')=='data:content' and [x.tag for x in k[:2]]==[H+'div',B+'else'] and 'cta-copy' in classes(k[0]) and [e.get('expr') for e in k[0].iter(B+'eval')]==['data:content'],'N1L_C8_SAVED saved copy first, the default only when it is empty'
d=k[2:]
assert [x.tag for x in d]==[H+'div',H+'a'] and 'cta-copy' in classes(d[0]) and 'cta-button' in classes(d[1]),'N1L_C8_DEFAULT default copy, then the button'
assert [(x.tag,''.join(x.itertext()).strip()) for x in d[0]]==[(H+'h2','Need help securing your organization?'),(H+'p','Put knowledge into practice with Fast Cyber Defense.')],'N1L_C8_DEFAULT the design v1 message'
assert d[1].get('href')=='https://fastcyberdefense.com/' and ''.join(d[1].itertext()).replace('\u2197','').strip()=='Explore FCD services' and [s.get('aria-hidden') for s in d[1].iter(H+'span')]==['true'],'N1L_C8_DEFAULT the design v1 button'
assert not [e for e in r.iter() if 'article-cta' in classes(e)],'N1L_C8_ONE_CTA the article must not repeat the call to action'
heads=[h for h in r.iter() if h.tag in (H+'h2',H+'h3') and ''.join(h.itertext()).strip()=='Need help securing your organization?']
assert len(heads)==1,'N1L_C8_ONE_CTA call-to-action headings: %d'%len(heads)
`,
  // C9 (L4-footer): the brand and the owner's Footer gadget copy beside the theme links, then a base
  // row with the copyright and the native Attribution and Report Abuse gadgets. No footer headings.
  C9:String.raw`
foot=one((f for f in r.iter(H+'footer') if 'site-footer' in classes(f)),'N1L_C9_FOOTER footer.site-footer')
kids=[d for d in foot if d.tag==H+'div']
assert [[c for c in classes(d) if c.startswith('footer-')] for d in kids]==[['footer-grid'],['footer-base']] and all('container' in classes(d) for d in kids),'N1L_C9_ROWS the footer is a link grid, then a base row'
grid,base=kids
brand=one((d for d in grid if 'footer-brand' in classes(d)),'N1L_C9_BRAND .footer-brand')
assert [''.join(p.itertext()).strip() for p in brand.findall(H+'p')]==['Fast Cyber Defense'] and 'brand-name' in classes(brand.find(H+'p')),'N1L_C9_BRAND the brand name leads the footer'
sec=one((s for s in brand.findall(B+'section') if s.get('id')=='footer'),'N1L_C9_SECTION Footer section beside the brand')
assert (sec.get('name'),sec.get('maxwidgets'),sec.get('showaddelement'))==('Footer','1','false'),'N1L_C9_SECTION the Footer section holds exactly one gadget'
w=one(sec.findall(B+'widget'),'N1L_C9_GADGET Footer gadgets')
assert (w.get('id'),w.get('type'),w.get('title'),w.get('version'),w.get('locked'))==('HTML3','HTML','Footer','2','true'),'N1L_C9_GADGET Footer must be the locked Version 2 HTML3 gadget'
text=one((d for d in includable(w,'main').iter(H+'div') if 'footer-text' in classes(d)),'N1L_C9_TEXT .footer-text')
saved=one(text.findall(B+'if'),'N1L_C9_SAVED saved-copy branch')
k=list(saved)
assert saved.get('cond')=='data:content' and [x.tag for x in k[:2]]==[B+'eval',B+'else'] and k[0].get('expr')=='data:content','N1L_C9_SAVED saved copy first, the default only when it is empty'
assert [(x.tag,classes(x),''.join(x.itertext()).strip()) for x in k[2:]]==[(H+'p',['footer-tagline'],'Quick to Act, Strong to Protect.'),(H+'p',['footer-blurb'],'Security research and practical guidance from Fast Cyber Defense.')],'N1L_C9_DEFAULT the design v1 tagline and blurb'
nav=one((n for n in grid if n.tag==H+'nav'),'N1L_C9_LINKS footer nav')
assert nav.get('aria-label')=='Footer' and 'footer-links' in classes(nav),'N1L_C9_LINKS one labelled footer nav'
links=nav.findall(H+'a')
assert [(a.get('href') or a.get(X+'href'),''.join(a.itertext()).replace('\u2197','').strip()) for a in links]==[('https://fastcyberdefense.com/','Company website'),('data:blog.homepageUrl path "feeds/posts/default"','Publication feed'),('#top','Back to top')],'N1L_C9_LINKS the design v1 links'
assert all('footer-link' in classes(a) for a in links) and [s.get('aria-hidden') for a in links for s in a.iter(H+'span')]==['true'],'N1L_C9_LINKS one decorative external arrow'
assert [''.join(p.itertext()).strip() for p in base.findall(H+'p') if 'footer-copyright' in classes(p)]==['\u00a9 Fast Cyber Defense'],'N1L_C9_BASE copyright line'
one((s for s in base.findall(B+'section') if s.get('id')=='footer-gadgets'),'N1L_C9_BASE native gadgets in the base row')
assert not [e for e in foot.iter() if e.tag in [H+'h%d'%i for i in range(1,7)]],'N1L_C9_NO_HEADINGS the footer carries no headings'
blurbs=[e for e in r.iter() if ''.join(e.itertext()).strip()=='Security research and practical guidance from Fast Cyber Defense.' and e.tag in (H+'p',H+'div')]
assert len(blurbs)==1,'N1L_C9_ONE_BLURB the blurb appears once: %d'%len(blurbs)
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
  ['C3','an archive card bound to the wrong data',s=>s.replace('cond="data:this.data" name="has-items"','cond="data:posts" name="has-items"')],
  ['C4','the Profile gadget moved out of the sidebar',s=>s.replace('<b:widget id="Profile1"','<b:widget id="Profile9"')],
  ['C5','a second masthead search form',s=>s.replace(/<form\b(?=[^>]*id="site-search")/,'<form role="search" action="/mutation"></form><form')],
  ['C6','a renamed drawer target',s=>s.replace('id="primary-navigation"','id="primary-nav"')],
  ['C6','a theme link hardcoded beside the gadget',s=>s.replace(/<form\b(?=[^>]*id="site-search")/,'<a href="/mutation">Extra</a><form')],
  ['C7','the publication heading also on the home intro',s=>s.replace(/<b:if cond="not data:view\.isSingleItem[^"]*">(\s*<header class="publication-heading")/,'<b:if cond="true">$1')],
  ['C7','a stray theme h1 in main',s=>s.replace(/<main\b[^>]*>/,m=>m+'<h1>Mutation</h1>')],
  ['C8','a second call to action inside the article',s=>s.replace(/<main\b[^>]*>/,m=>m+'<aside class="article-cta"><h2>Need help securing your organization?</h2></aside>')],
  ['C8','the call-to-action headline repeated in the sidebar',s=>s.replace(/<aside class="sidebar"[^>]*>/,m=>m+'<h2>Need help securing your organization?</h2>')],
  ['C9','the footer blurb repeated in main',s=>s.replace(/<main\b[^>]*>/,m=>m+'<p>Security research and practical guidance from Fast Cyber Defense.</p>')],
  ['C9','a heading inside the footer',s=>s.replace(/<\/footer>/,'<h2>Mutation</h2></footer>')],
];
it.each(mutations)('L1 contract %s rejects %s',(name,_label,mutate)=>{
  const changed=mutate(original);expect(changed,'N1L_MUTATION_TARGET missing').not.toBe(original);
  const r=check(changed,name);expect(r.status,r.stderr+r.stdout).not.toBe(0);
});
