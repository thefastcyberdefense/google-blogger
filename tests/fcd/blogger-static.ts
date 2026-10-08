// US-L7: static expansion of the built theme for the layout and colour tests.
// Blogger renders theme XML on its own servers, which CI never reaches, so the
// tests lay the page out from dist/theme.xml the way the engine does:
// b:section becomes div.<class>.section#<id>, b:widget becomes
// div.widget.<Type>#<id> holding its main includable, and b:include resolves
// against the widget, then the theme's default markup for its type, then
// Common. b:if is evaluated only for the view flags below; any other condition
// is unknown and its branch renders, so the fixture shows at least everything
// the live page can show. Placeholders stand in for blog data.

export type View = 'home' | 'post';

type Scalar = boolean | string | number;
type Value = Scalar | Scalar[] | undefined; // undefined: unknown without Blogger
type Tri = boolean | null; // null: unknown

export interface XEl {
  name: string;
  attrs: Record<string, string>;
  children: XNode[];
}
export type XNode = XEl | string;

export interface Orphan {
  id: string;
  type: string;
  html: string;
}

export interface RenderOptions {
  view: View;
  layout?: boolean;
  // Gadgets Blogger kept from an earlier theme, by the section it moved them to.
  orphans?: Record<string, Orphan[]>;
}

export interface SectionInfo {
  id: string;
  fixed: boolean; // showaddelement false: only the theme's own widgets belong here
  widgets: string[];
}

export const BLOG_TITLE = 'Fast Cyber Defense - Cyber Security Company';
export const POST_TITLE = 'Demo Blog Post';
const POST_BODY =
  '<p>Here is the checkpoint in order. You run every Blogger step and each step is its own go or no-go.</p>' +
  '<h2>Layout check</h2><p>Navigation, Intro, Call to Action and Footer each hold one gadget. Text carries <a href="#">a link</a>, <strong>strong words</strong> and <code>inline code</code>.</p>' +
  '<ol><li>Open the browser console.</li><li>Paste the snippet and send the output.</li></ol>' +
  '<pre><code>console.table(widgets);</code></pre><blockquote><p>Roll back on any save failure.</p></blockquote>';

const VIEWS: Record<View, Record<string, Scalar>> = {
  home: {
    'data:view.isHomepage': true,
    'data:view.isMultipleItems': true,
    'data:view.isSingleItem': false,
    'data:view.isPost': false,
    'data:view.isPage': false,
    'data:view.isError': false,
    'data:view.isSearch': false,
    'data:view.isArchive': false,
    'data:view.isLabelSearch': false,
    'data:blog.pageType': 'index'
  },
  post: {
    'data:view.isHomepage': false,
    'data:view.isMultipleItems': false,
    'data:view.isSingleItem': true,
    'data:view.isPost': true,
    'data:view.isPage': false,
    'data:view.isError': false,
    'data:view.isSearch': false,
    'data:view.isArchive': false,
    'data:view.isLabelSearch': false,
    'data:blog.pageType': 'item'
  }
};

// Shared fixture state: first page, HTML gadgets left empty so their built-in
// defaults render (as on the test blog), the Header's default image placement
// and at least one post.
const SHARED: Record<string, Scalar> = {
  'data:newerPageUrl': false,
  'data:content': false,
  'data:posts.any': true,
  'data:imagePlacement': 'BEHIND',
  'data:this.imagePlacement': 'BEHIND'
};

const TOKEN = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/gi;
const ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decode = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m: string, e: string) => {
    if (e.startsWith('#x') || e.startsWith('#X')) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
    if (e.startsWith('#')) return String.fromCodePoint(Number.parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
const escapeText = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s: string): string => escapeText(s).replace(/"/g, '&quot;');

export function parseXml(xml: string): XEl {
  const root: XEl = { name: '#root', attrs: {}, children: [] };
  const stack: XEl[] = [root];
  for (const m of xml.matchAll(TOKEN)) {
    const top = stack[stack.length - 1] ?? root;
    const [, cdata, close, open, rawAttrs, selfClose, text] = m;
    if (cdata !== undefined) top.children.push(escapeText(cdata));
    else if (close !== undefined) {
      const at = stack.map((e) => e.name).lastIndexOf(close);
      if (at > 0) stack.length = at;
    } else if (open !== undefined) {
      const el: XEl = { name: open, attrs: {}, children: [] };
      for (const a of (rawAttrs ?? '').matchAll(ATTR)) el.attrs[a[1] ?? ''] = decode(a[2] ?? a[3] ?? '');
      top.children.push(el);
      if (selfClose !== '/') stack.push(el);
    } else if (text !== undefined) top.children.push(text);
  }
  return root;
}

const COND_TOKEN = /\s*(==|!=|\(|\)|\{[^{}]*\}|"[^"]*"|'[^']*'|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*(?::[\w$.]+)?)/y;

function condTokens(src: string): string[] | null {
  const out: string[] = [];
  let at = 0;
  while (at < src.length && src.slice(at).trim()) {
    COND_TOKEN.lastIndex = at;
    const m = COND_TOKEN.exec(src);
    if (!m || m[1] === undefined) return null;
    out.push(m[1]);
    at = COND_TOKEN.lastIndex;
  }
  return out;
}

function truth(v: Value): Tri {
  if (v === undefined) return null;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.length > 0;
  if (typeof v === 'number') return v !== 0;
  return v;
}

const KEYWORDS = new Set(['not', 'and', 'or', 'in', ')', '==', '!=']);

// Three-valued evaluation of a Blogger condition: true, false or null (unknown).
export function evaluate(cond: string, known: Record<string, Scalar>): Tri {
  const t = condTokens(cond);
  if (!t || t.length === 0) return null;
  let i = 0;
  let broken = false;
  function atom(): Value {
    const tok = t?.[i++];
    if (tok === undefined || KEYWORDS.has(tok)) {
      broken = true;
      return undefined;
    }
    if (tok === '(') {
      const v = disjunction();
      if (t?.[i++] !== ')') broken = true;
      return v;
    }
    if (tok === 'true') return true;
    if (tok === 'false') return false;
    if (tok.startsWith('"') || tok.startsWith("'")) return tok.slice(1, -1);
    if (/^\d/.test(tok)) return Number(tok);
    if (tok.startsWith('{')) return tok.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    return Object.prototype.hasOwnProperty.call(known, tok) ? known[tok] : undefined;
  }
  function compare(): Value {
    const left = atom();
    const op = t?.[i];
    if (op === '==' || op === '!=') {
      i++;
      const right = atom();
      if (left === undefined || right === undefined || Array.isArray(left) || Array.isArray(right)) return undefined;
      return op === '==' ? left === right : left !== right;
    }
    const negated = op === 'not' && t?.[i + 1] === 'in';
    if (op === 'in' || negated) {
      i += negated ? 2 : 1;
      const set = atom();
      if (left === undefined || Array.isArray(left) || !Array.isArray(set)) return undefined;
      const hit = set.includes(String(left));
      return negated ? !hit : hit;
    }
    return left;
  }
  function negation(): Value {
    if (t?.[i] === 'not' && t?.[i + 1] !== 'in') {
      i++;
      const v = truth(negation());
      return v === null ? undefined : !v;
    }
    return compare();
  }
  function conjunction(): Value {
    let acc: Tri = truth(negation());
    while (t?.[i] === 'and') {
      i++;
      const v = truth(negation());
      acc = acc === false || v === false ? false : acc === null || v === null ? null : true;
    }
    return acc === null ? undefined : acc;
  }
  function disjunction(): Value {
    let acc: Tri = truth(conjunction());
    while (t?.[i] === 'or') {
      i++;
      const v = truth(conjunction());
      acc = acc === true || v === true ? true : acc === null || v === null ? null : false;
    }
    return acc === null ? undefined : acc;
  }
  const result = truth(disjunction());
  return broken || i !== t.length ? null : result;
}

function placeholder(expr: string): string {
  const literal = expr.trim().match(/^"([^"]*)"$|^'([^']*)'$/);
  if (literal) return escapeText(literal[1] ?? literal[2] ?? '');
  if (/post\.body/.test(expr)) return POST_BODY;
  if (/post\.title|view\.title/.test(expr)) return POST_TITLE;
  if (/blog\.title|data:title\b/.test(expr)) return BLOG_TITLE;
  if (/date|timestamp/i.test(expr)) return 'October 4, 2026';
  if (/author/i.test(expr)) return 'Fast Cyber Defense';
  if (/snippet|description|summary/i.test(expr)) return 'Field notes and practical defense from Fast Cyber Defense.';
  if (/label|name/i.test(expr)) return 'Threat Intel';
  if (/numberOf|count/i.test(expr)) return '1';
  return 'Sample';
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const SKIP = new Set(['b:includable', 'b:widget-settings', 'b:defaultmarkups', 'b:defaultmarkup', 'b:skin', 'b:template-skin', 'b:comment', 'b:param', 'b:class', 'b:attr', 'b:else', 'b:elseif', 'script', 'noscript']);

interface Scope {
  type: string;
  own: Map<string, XEl>;
  stack: string[];
}

interface Ctx {
  known: Record<string, Scalar>;
  markups: Map<string, Map<string, XEl>>;
  opts: RenderOptions;
  sections: SectionInfo[];
}

const isEl = (n: XNode): n is XEl => typeof n !== 'string';

function* descendants(el: XEl): Generator<XEl> {
  for (const c of el.children) {
    if (!isEl(c)) continue;
    yield c;
    yield* descendants(c);
  }
}

function includables(el: XEl): Map<string, XEl> {
  const map = new Map<string, XEl>();
  for (const c of el.children) if (isEl(c) && c.name === 'b:includable' && c.attrs.id) map.set(c.attrs.id, c);
  return map;
}

function htmlAttrs(attrs: Record<string, string>, classes: string[], drop: string[]): string {
  const out: string[] = [];
  const cls: string[] = attrs.class ? [attrs.class] : [];
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class' || drop.includes(k) || k.startsWith('xmlns') || k.startsWith('b:')) continue;
    if (k.startsWith('expr:')) {
      const name = k.slice(5);
      if (name === 'href' && attrs.href === undefined) out.push('href="#"');
      if (name === 'class') {
        const literals = [...v.matchAll(/"([^"]*)"/g)];
        const last = literals[literals.length - 1]?.[1];
        if (last) cls.push(last);
      }
      continue;
    }
    out.push(`${k}="${escapeAttr(v)}"`);
  }
  cls.push(...classes);
  const joined = cls.join(' ').trim();
  if (joined) out.unshift(`class="${escapeAttr(joined)}"`);
  return out.length ? ' ' + out.join(' ') : '';
}

function renderNodes(nodes: XNode[], ctx: Ctx, scope: Scope | null): string {
  let out = '';
  for (const n of nodes) out += renderNode(n, ctx, scope);
  return out;
}

function element(tag: string, el: XEl, ctx: Ctx, scope: Scope | null, drop: string[] = [], extra: Record<string, string> = {}): string {
  const classes: string[] = [];
  const attrs: Record<string, string> = { ...el.attrs, ...extra };
  for (const c of el.children) {
    if (!isEl(c) || (c.name !== 'b:class' && c.name !== 'b:attr')) continue;
    if (c.attrs.cond !== undefined && evaluate(c.attrs.cond, ctx.known) === false) continue;
    if (c.name === 'b:class' && c.attrs.name) classes.push(c.attrs.name);
    if (c.name === 'b:attr' && c.attrs.name && c.attrs.value !== undefined) attrs[c.attrs.name] = c.attrs.value;
  }
  const open = `<${tag}${htmlAttrs(attrs, classes, drop)}>`;
  return VOID.has(tag) ? open : `${open}${renderNodes(el.children, ctx, scope)}</${tag}>`;
}

function renderIf(el: XEl, ctx: Ctx, scope: Scope | null): string {
  const branches: Array<{ cond: string | null; nodes: XNode[] }> = [{ cond: el.attrs.cond ?? '', nodes: [] }];
  for (const c of el.children) {
    if (isEl(c) && (c.name === 'b:elseif' || c.name === 'b:else')) {
      branches.push({ cond: c.name === 'b:else' ? null : c.attrs.cond ?? '', nodes: [] });
      continue;
    }
    branches[branches.length - 1]?.nodes.push(c);
  }
  let out = '';
  for (const b of branches) {
    const v: Tri = b.cond === null ? true : evaluate(b.cond, ctx.known);
    if (v === false) continue;
    out += renderNodes(b.nodes, ctx, scope);
    if (v === true) break;
  }
  return out;
}

function includeNamed(name: string, ctx: Ctx, scope: Scope, parent = false): string {
  const key = (parent ? 'super.' : '') + name;
  if (scope.stack.includes(key) || scope.stack.length > 24) return '';
  const target = (parent ? undefined : scope.own.get(name)) ?? ctx.markups.get(scope.type)?.get(name) ?? ctx.markups.get('Common')?.get(name);
  return target ? renderNodes(target.children, ctx, { ...scope, stack: [...scope.stack, key] }) : '';
}

function renderInclude(el: XEl, ctx: Ctx, scope: Scope | null): string {
  if (!scope) return '';
  if (el.attrs.cond !== undefined && evaluate(el.attrs.cond, ctx.known) === false) return '';
  const name = el.attrs.name ?? '';
  // Blogger's own Blog main: the post list, then the pager.
  if (name === 'super.main' && scope.type === 'Blog') {
    return `<div class="blog-posts hfeed container">${includeNamed('postCommentsAndAd', ctx, scope)}</div>${includeNamed('postPagination', ctx, scope)}`;
  }
  if (name.startsWith('super.')) return includeNamed(name.slice(6), ctx, scope, true);
  return includeNamed(name, ctx, scope);
}

function renderWidget(el: XEl, ctx: Ctx): string {
  const type = el.attrs.type ?? '';
  const scope: Scope = { type, own: includables(el), stack: ['main'] };
  const main = scope.own.get('main') ?? ctx.markups.get(type)?.get('main');
  const inner = main ? renderNodes(main.children, ctx, scope) : '';
  return `<div class="widget ${escapeAttr(type)}" data-version="2" id="${escapeAttr(el.attrs.id ?? '')}">${inner}</div>`;
}

function renderSection(el: XEl, ctx: Ctx): string {
  const id = el.attrs.id ?? '';
  const widgets = el.children.filter((c): c is XEl => isEl(c) && c.name === 'b:widget');
  ctx.sections.push({ id, fixed: /^(false|no)$/i.test(el.attrs.showaddelement ?? 'yes'), widgets: widgets.map((w) => w.attrs.id ?? '') });
  const moved = (ctx.opts.orphans?.[id] ?? [])
    .map((o) => `<div class="widget ${escapeAttr(o.type)}" data-version="2" data-fcd-orphan="" id="${escapeAttr(o.id)}">${o.html}</div>`)
    .join('');
  const cls = [el.attrs.class, 'section'].filter(Boolean).join(' ');
  return `<div class="${escapeAttr(cls)}" id="${escapeAttr(id)}" name="${escapeAttr(el.attrs.name ?? '')}">${moved}${widgets.map((w) => renderWidget(w, ctx)).join('')}</div>`;
}

function renderNode(n: XNode, ctx: Ctx, scope: Scope | null): string {
  if (!isEl(n)) return n;
  const name = n.name;
  if (SKIP.has(name)) return '';
  if (name === 'b:section') return renderSection(n, ctx);
  if (name === 'b:widget') return renderWidget(n, ctx);
  if (name === 'b:if') return renderIf(n, ctx, scope);
  if (name === 'b:include') return renderInclude(n, ctx, scope);
  if (name === 'b:eval') return placeholder(n.attrs.expr ?? '');
  if (name === 'b:message') return /poweredByBlogger/.test(n.attrs.name ?? '') ? 'Powered by Blogger' : 'Message';
  if (name === 'b:tag') {
    if (n.attrs.cond !== undefined && evaluate(n.attrs.cond, ctx.known) === false) return renderNodes(n.children, ctx, scope);
    const tag = /^[a-z][a-z0-9]*$/i.test(n.attrs.name ?? '') ? n.attrs.name ?? 'div' : 'div';
    return element(tag, n, ctx, scope, ['name', 'cond']);
  }
  if (name.startsWith('data:')) return placeholder(name);
  if (name.startsWith('b:')) return renderNodes(n.children, ctx, scope); // b:loop, b:with, b:switch and friends
  return element(name, n, ctx, scope);
}

// Renders the theme body for one view. Returns the body element markup and the
// sections in document order.
export function renderTheme(root: XEl, opts: RenderOptions): { body: string; sections: SectionInfo[] } {
  const all = [...descendants(root)];
  const body = all.find((e) => e.name === 'body');
  if (!body) throw new Error('theme XML has no body');
  const markups = new Map<string, Map<string, XEl>>();
  for (const m of all.filter((e) => e.name === 'b:defaultmarkup')) {
    for (const type of (m.attrs.type ?? '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const map = markups.get(type) ?? new Map<string, XEl>();
      for (const [k, v] of includables(m)) map.set(k, v);
      markups.set(type, map);
    }
  }
  const ctx: Ctx = { known: { ...SHARED, ...VIEWS[opts.view] }, markups, opts, sections: [] };
  const html = element('body', body, ctx, null, [], opts.layout ? { id: 'layout' } : {});
  return { body: html, sections: ctx.sections };
}
