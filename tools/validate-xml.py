"""Validate the FCD static native-render contract, not Blogger expression semantics."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

B = '{http://www.google.com/2005/gml/b}'
H = '{http://www.w3.org/1999/xhtml}'
E = '{http://www.google.com/2005/gml/expr}'

def require(condition, message):
    if not condition:
        raise ValueError(message)

def unique(elements, field, label):
    values = [el.get(field) for el in elements]
    require(all(values) and len(set(values)) == len(values), f'{label}: missing or duplicate {field}')

def validate(xml):
    require(len(xml) <= 500000, 'theme size exceeds 500000 bytes')
    root = ET.fromstring(xml)
    require(root.tag == H+'html', 'XHTML root required')
    require(root.get(B+'layoutsVersion') == '3', 'Layouts V3 required')
    require(root.get(B+'defaultwidgetversion') == '2', 'default widget version 2 required')
    require(root.get(B+'version') is None and 'v2' not in root.get('class','').split(), 'legacy V2 root forbidden')
    require(root.get(B+'responsive') == 'true', 'responsive Blogger root required')
    require(root.get(E+'lang') and root.get(E+'dir'), 'native language and direction bindings required')
    require(len(root.findall('.//'+B+'skin')) == 1, 'exactly one b:skin required')
    heads=root.findall(H+'head'); bodies=root.findall(H+'body')
    require(len(heads)==1 and len(bodies)==1, 'one head and body required')
    head=heads[0]; body=bodies[0]
    sections=root.findall('.//'+B+'section'); widgets=root.findall('.//'+B+'widget')
    require(sections and widgets, 'native sections and widgets required')
    unique(sections,'id','sections'); unique(widgets,'id','widgets')
    require(all(w.get('version')=='2' for w in widgets), 'each widget must use version 2')
    for section in sections:
        require(all(child.tag==B+'widget' for child in section), 'sections may contain widgets only')
    blog=next((w for w in widgets if w.get('id')=='Blog1'),None)
    header=next((w for w in widgets if w.get('id')=='Header1'),None)
    require(blog is not None and blog.get('type')=='Blog' and blog.get('locked')=='true', 'locked Blog1 Blog widget required')
    require(header is not None and header.get('type')=='Header', 'Header1 Header widget required')
    mains=[m for m in body.iter(H+'main') if m.get('id')=='content']
    require(len(mains)==1 and blog in list(mains[0].iter()), 'Blog1 must be inside main#content')
    require(any(a.get('href')=='#content' and 'skip-link' in a.get('class','').split() for a in body.iter(H+'a')), 'skip link must target main#content')
    require(any(c.get('name')=='is-single' and c.get('cond')=='data:view.isSingleItem' for c in body.findall(B+'class')), 'single-item body state binding required')
    defaults=root.findall('.//'+B+'defaultmarkup')
    require(any(d.get('type')=='Blog' for d in defaults), 'Blog default markup required')
    for container in widgets+defaults:
        includes=container.findall(B+'includable')
        if includes: unique(includes,'id','includables within '+str(container.get('id') or container.get('type')))
    inc={el.get('id'):el for el in blog.findall(B+'includable')}
    needed={'main','post','postCommentsAndAd','commentPicker','postPagination','noContentPlaceholder','postMeta','inlineAd','postJumpLink','postShareButtons','postFooterAuthorProfile'}
    require(needed <= inc.keys(), 'missing required FCD Blog1 includable: '+str(sorted(needed-inc.keys())))
    def calls(el,name): return [i for i in el.iter(B+'include') if i.get('name')==name]
    require(calls(inc['main'],'super.main'), 'Blog1 main must delegate to native super.main')
    require(calls(inc['main'],'noContentPlaceholder'), 'Blog1 must retain loud empty/error branch')
    require(list(inc['noContentPlaceholder'].iter(H+'h2')), 'empty-state heading required')
    require(calls(inc['postCommentsAndAd'],'post') and calls(inc['postCommentsAndAd'],'commentPicker'), 'native post/comment dispatch required')
    require(calls(inc['commentPicker'],'super.commentPicker'), 'declared native comment delegation required; full runtime checks remain pending')
    post=inc['post']
    require(any(i.get('cond')=='data:view.isSingleItem' for i in post.iter(B+'if')), 'native single-item guard required')
    require(any(e.get('expr')=='data:post.body' for e in post.iter(B+'eval')), 'native post body output required')
    require(any(e.get('id')=='article-body' for e in post.iter(H+'div')), 'article body container required')
    require(list(post.iter(H+'h1')) and list(post.iter(H+'h2')), 'single article and catalog title headings required')
    for cursor in ('data:olderPageUrl','data:newerPageUrl'):
        require(any(a.get(E+'href')==cursor for a in inc['postPagination'].iter(H+'a')), 'native pagination URL missing: '+cursor)
    require(len(calls(head,'all-head-content'))==1, 'one native head metadata owner required')
    stamps=[m for m in head.iter(H+'meta') if m.get('name')=='theme-build']
    require(len(stamps)==1 and re.fullmatch(r'0\.1\.0\+[a-f0-9]{40}',stamps[0].get('content',''),re.I), 'one full source build stamp required')
    # Parse attributes only, not comments, CSS, JS or documentation strings.
    for el in root.iter():
        for name,value in el.attrib.items():
            expression = name.startswith(E) or el.tag.startswith(B) and name in ('expr','cond','value','values')
            if not expression: continue
            require(not re.search(r'data:blog\.pageType|\.size\b|\b(?:gt|lt)\b|&&|\|\|',value), 'unsupported legacy expression: '+value)
    return root

if __name__ == '__main__':
    try:
        validate(Path('dist/theme.xml').read_bytes())
        print('PASS: static V3 shell, native binding, body, comments, pagination, metadata and empty-state contracts. Blogger import/rendering remains unverified.')
    except (ValueError, ET.ParseError) as error:
        raise SystemExit('FAIL: '+str(error))
