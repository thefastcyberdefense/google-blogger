export type MetadataInput={html:string;view:string;url:string};
/** Runs in a browser parsing context without executing source scripts or fetching resources.
 * Source fixtures do not interpret Blogger expressions. Visibility/import gates remain separate. */
export function validateMetadata(input:MetadataInput):string[]{
 const errors:string[]=[];const fail=(message:string)=>{errors.push(message);};
 if(!['home','article','label','search','archive','static','error','paged'].includes(input.view))return ['Unsupported view'];
 if(new TextEncoder().encode(input.html).byteLength>2000000)return ['Metadata HTML exceeds budget'];
 let base:URL;try{base=new URL(input.url);if(base.protocol!=='https:'||base.username||base.password)throw new Error();}catch{return ['Invalid page URL'];}
 const doc=new DOMParser().parseFromString(input.html,'text/html');const text=(value:unknown)=>typeof value==='string'?value.replace(/\s+/g,' ').trim():'';
 const safeURL=(value:unknown,sameOrigin=false)=>{if(typeof value!=='string'||!value.trim()||Array.from(value).some(c=>c.charCodeAt(0)<=31))return null;try{const url=new URL(value,base);return url.protocol==='https:'&&!url.username&&!url.password&&(!sameOrigin||url.origin===base.origin)?url:null;}catch{return null;}};
 const titles=doc.querySelectorAll('head title');if(titles.length!==1||!text(titles[0]?.textContent))fail('One nonempty title required');
 const canonicalNodes=doc.querySelectorAll('head link[rel~="canonical"]');
 const canonical=canonicalNodes.length===1?safeURL(canonicalNodes[0].getAttribute('href'),true):null;
 if(input.view!=='error'&&!canonical||canonicalNodes.length>1||canonicalNodes.length===1&&!canonical)fail('Invalid unique same-origin canonical');
 if(canonical?.hash)fail('Canonical must not contain fragment');
 const meta=(selector:string,required=false)=>{const nodes=doc.querySelectorAll(selector);if(nodes.length>1||required&&nodes.length!==1)fail('Invalid metadata multiplicity: '+selector);const value=nodes[0]?.getAttribute('content');if(nodes.length&&!text(value))fail('Empty metadata: '+selector);return value;};
 for(const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:site_name"]','meta[name="twitter:title"]','meta[name="twitter:description"]'])meta('head '+selector);
 const kind=meta('head meta[property="og:type"]',true);if(kind!==(input.view==='article'?'article':'website'))fail('OpenGraph type disagrees with view');
 const card=meta('head meta[name="twitter:card"]',true);if(card&&!['summary','summary_large_image'].includes(card))fail('Invalid social card type');
 for(const selector of ['head meta[property="og:image"]','head meta[name="twitter:image"]']){const value=meta(selector);if(value&&!safeURL(value))fail('Invalid social image URL');}
 const ogURL=meta('head meta[property="og:url"]');if(ogURL&&(!safeURL(ogURL,true)||canonical&&safeURL(ogURL,true)?.href!==canonical.href))fail('OpenGraph URL disagrees with canonical');
 const date=(value:unknown)=>{if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))return false;try{return new Date(value.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===value.slice(0,10);}catch{return false;}};
 const publishedMeta=meta('head meta[property="article:published_time"]');if(publishedMeta&&(input.view!=='article'||!date(publishedMeta)))fail('Invalid article publication metadata');
 const scripts=Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));if(scripts.length>20)return [...errors,'Too many structured-data scripts'];
 const objects:Record<string,unknown>[]=[];let visited=0;
 const visit=(value:unknown,depth=0)=>{if(depth>10||++visited>100){fail('Structured-data graph exceeds budget');return;}if(Array.isArray(value)){for(const item of value)visit(item,depth+1);return;}if(!value||typeof value!=='object'){fail('Structured data must be an object or graph');return;}const item=value as Record<string,unknown>;objects.push(item);if(item['@graph']!==undefined)visit(item['@graph'],depth+1);};
 for(const script of scripts){try{visit(JSON.parse(script.textContent||''));}catch{fail('Malformed JSON-LD');}}
 const articles=objects.filter(o=>[o['@type']].flat().some(t=>['Article','NewsArticle','BlogPosting'].includes(String(t))));
 if(input.view==='article'&&articles.length!==1)fail('Article view requires one article schema');
 if(input.view!=='article'&&articles.length)fail('Article schema on non-post view');
 for(const article of articles){
  const heading=doc.querySelector('main#content article.article-view h1.post-title')||doc.querySelector('main#content h1');
  if(!text(article.headline)||text(article.headline)!==text(heading?.textContent))fail('Article headline disagrees with content');
  const entity=article.mainEntityOfPage;const entityURL=safeURL(typeof entity==='object'&&entity? (entity as Record<string,unknown>)['@id']:entity,true);
  if(!entityURL||!canonical||entityURL.href!==canonical.href)fail('Article identity disagrees with canonical');
  for(const key of ['datePublished','dateModified'])if(article[key]!==undefined&&!date(article[key]))fail('Invalid '+key);
  if(date(article.datePublished)&&date(article.dateModified)&&Date.parse(String(article.dateModified))<Date.parse(String(article.datePublished)))fail('Modification precedes publication');
  if(publishedMeta&&article.datePublished&&Date.parse(publishedMeta)!==Date.parse(String(article.datePublished)))fail('Publication dates disagree');
  if(article.author!==undefined){const authors=Array.isArray(article.author)?article.author:[article.author];if(!authors.length)fail('Empty authors');for(const author of authors){if(!author||typeof author!=='object'){fail('Invalid author');continue;}const a=author as Record<string,unknown>;if(!['Person','Organization'].includes(String(a['@type']))||!text(a.name))fail('Invalid author');if(a.url!==undefined&&!safeURL(a.url))fail('Invalid author URL');}}
  if(article.image!==undefined){const images=Array.isArray(article.image)?article.image:[article.image];if(!images.length)fail('Empty article images');for(const image of images){const value=image&&typeof image==='object'?(image as Record<string,unknown>).url:image;if(!safeURL(value))fail('Invalid article image');}}
 }
 return [...new Set(errors)];
}
